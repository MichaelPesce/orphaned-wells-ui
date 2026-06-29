import React, { useState, useEffect, MouseEvent, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Menu, MenuItem } from "@mui/material";
import { Box, TextField, Collapse, Typography, IconButton, Badge, Tooltip, Stack } from "@mui/material";

import { updateRecord } from "../../services/app.service";
import { formatConfidence, useKeyDown, useOutsideClick, formatAttributeValue, formatDateTime, callAPI, getAttributeRowId, deriveAttribute } from "../../util";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import InfoIcon from "@mui/icons-material/Info";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Attribute, RecordAttributesTableProps, FieldID } from "../../types";
import { styles } from "../../styles";
import { useUserContext } from "../../usercontext";


const LOW_CONFIDENCE: number = 0.01;
const EMPTY_PARENT_INDEXES: number[] = [];

interface AttributesTableProps extends RecordAttributesTableProps {
    attributesList: Attribute[];
    forceOpenSubtable?: number[] | null;
    open?: boolean;
    topLevelIdx?: number;
    parentKey?: string;
    record_id?: string;
    handleClickOutside?: () => void;
}

function showEditedValue(v: Attribute){
  if (v.edited && v.uncleaned_value !== undefined) {
    return true;
  }
  return false;
}

function showOCRRawValue(v: Attribute) {
  if (v.user_added) return false;
  else if (v.edited || v.cleaned) return true;
  return false;
}

function getAttributeResponseKey(indexes: number[]) {
  return indexes.reduce((path, idx, indexPosition) => {
    if (indexPosition === 0) return `${path}.${idx}`;
    return `${path}.subattributes.${idx}`;
  }, "attributesList");
}

const indexesMatch = (left: number[], right: number[]) => {
  return left.length === right.length && left.every((value, index) => value === right[index]);
};

const rowIndexesMatchDisplayPath = (props: AttributeRowProps) => {
  const { parentIndexes, idx, displayIndexes } = props;
  const rowDepth = parentIndexes.length + 1;
  if (displayIndexes.length < rowDepth) return false;
  for (let indexPosition = 0; indexPosition < parentIndexes.length; indexPosition += 1) {
    if (displayIndexes[indexPosition] !== parentIndexes[indexPosition]) return false;
  }
  return displayIndexes[parentIndexes.length] === idx;
};

const rowIndexesMatchForceOpenPath = (props: AttributeRowProps) => {
  const { parentIndexes, idx, forceOpenSubtable } = props;
  const rowDepth = parentIndexes.length + 1;
  if (!forceOpenSubtable || forceOpenSubtable.length < rowDepth) return false;
  for (let indexPosition = 0; indexPosition < parentIndexes.length; indexPosition += 1) {
    if (forceOpenSubtable[indexPosition] !== parentIndexes[indexPosition]) return false;
  }
  return forceOpenSubtable[parentIndexes.length] === idx;
};

const rowDisplayStateMatches = (prevProps: AttributeRowProps, nextProps: AttributeRowProps) => {
  const prevRelevant = rowIndexesMatchDisplayPath(prevProps);
  const nextRelevant = rowIndexesMatchDisplayPath(nextProps);
  if (prevRelevant !== nextRelevant) return false;
  return !nextRelevant || indexesMatch(prevProps.displayIndexes, nextProps.displayIndexes);
};

const rowForceOpenStateMatches = (prevProps: AttributeRowProps, nextProps: AttributeRowProps) => {
  const prevRelevant = rowIndexesMatchForceOpenPath(prevProps);
  const nextRelevant = rowIndexesMatchForceOpenPath(nextProps);
  if (prevRelevant !== nextRelevant) return false;
  if (!nextRelevant) return true;
  return indexesMatch(prevProps.forceOpenSubtable || [], nextProps.forceOpenSubtable || []);
};


const AttributesTable = (props: AttributesTableProps) => {
  const { 
    attributesList,
    open,
    parentKey = "",
    topLevelIdx = -1,
    forceOpenSubtable=null,
    parentIndexes=EMPTY_PARENT_INDEXES,
    recordSchema,
    handleClickOutside: providedHandleClickOutside,
    ...childProps
  } = props;

  const {
    handleClickField,
    showRawValues
  } = childProps;

  const handleClickOutside = React.useCallback(() => {
    const emptyField: FieldID = {
      key: "",
      primaryIndex: -1,
      indexes: [-1],
    };
    handleClickField(emptyField, null);
  }, [handleClickField]);
  const effectiveHandleClickOutside = providedHandleClickOutside || handleClickOutside;
  const ref = useOutsideClick(effectiveHandleClickOutside);
  const params = useParams<{ id: string }>();

  let parentName;
  if (parentKey) {
    parentName = parentKey.includes("::") ? parentKey?.split("::")[1] : parentKey;
  } else parentName = null;

  if (parentKey) {
    return (
    <TableRow>
      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ margin: 1 }}>
            <Typography variant="h6" gutterBottom component="div">
              {recordSchema[parentKey]?.alias || parentName} Properties
            </Typography>
            <Table size="small" aria-label="purchases" sx={styles.subattributesTable}>
              <TableHead>
                <TableRow>
                  <TableCell sx={styles.headerRow}>Field</TableCell>
                  <TableCell sx={styles.headerRow}>Value</TableCell>
                  {showRawValues &&
                            <TableCell sx={styles.headerRow}>Raw Value</TableCell>
                  }
                  <TableCell sx={styles.headerRow}>Confidence</TableCell>
                  <TableCell sx={styles.headerRow}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attributesList.map((v: Attribute, idx: number) => (
                  <AttributeRow 
                    key={`${v.key} ${idx}`}
                    k={v.key}
                    v={v}
                    idx={idx}
                    topLevelIdx={topLevelIdx}
                    forceOpenSubtable={forceOpenSubtable}
                    record_id={params.id}
                    handleClickOutside={effectiveHandleClickOutside}
                    recordSchema={recordSchema}
                    parentIndexes={parentIndexes}
                    {...childProps}
                  />
                ))}
              </TableBody>
            </Table>
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  );} else return (
    <TableContainer id="table-container" sx={styles.fieldsTable}>
      <Table stickyHeader size='small'>
        <TableHead sx={styles.tableHead}>
          <TableRow>
            <TableCell sx={styles.headerRow}>Field</TableCell>
            <TableCell sx={styles.headerRow}>Value</TableCell>
            {showRawValues &&
                            <TableCell sx={styles.headerRow}>Raw Value</TableCell>
            }
            <TableCell sx={styles.headerRow} align='right'>Confidence</TableCell>
            <TableCell sx={styles.headerRow} align='right'></TableCell>
          </TableRow>
        </TableHead>
        <TableBody ref={ref}>
          {attributesList.map((v: Attribute, idx: number) => (
            v &&
                        <AttributeRow 
                          key={`${v.key} ${idx}`}
                          k={v.key}
                          v={v}
                          idx={idx}
                          record_id={params.id}
                          forceOpenSubtable={forceOpenSubtable}
                          handleClickOutside={effectiveHandleClickOutside}
                          recordSchema={recordSchema}
                          parentIndexes={parentIndexes}
                          {...childProps}
                        />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface AttributeRowProps extends RecordAttributesTableProps {
    k: string;
    v: Attribute;
    idx: number;
    topLevelIdx?: number;
    forceOpenSubtable?: number[] | null;
    record_id?: string;
    handleClickOutside: () => void;
}


const AttributeRow = React.memo((props: AttributeRowProps) => {
  const { 
    k, 
    v, 
    idx, 
    forceOpenSubtable,
    reviewStatus,
    handleClickOutside,
    topLevelIdx = -1,
    parentIndexes,
    ...childProps
  } = props;

  const { 
    handleClickField,
    handleChangeValue,
    displayIndexes,
    locked,
    showRawValues,
    recordSchema,
    insertField,
    forceEditMode,
    handleSuccessfulAttributeUpdate,
    record_id,
    showError,
    deleteField,
    setUpdateFieldLocationID,
  } = childProps;
  const {
    parentAttribute
  } = v;

  const thisFieldIndexes = useMemo(() => [...parentIndexes, idx], [parentIndexes, idx]);
  const isSubattribute = thisFieldIndexes.length > 1;
  const schemaKey = isSubattribute ? `${parentAttribute}::${k}` : k;
  const primaryIndex = thisFieldIndexes[0] ?? idx;
  const subIndex = isSubattribute ? thisFieldIndexes[thisFieldIndexes.length - 1] : null;
  const coordinates = v.user_provided_coordinates || v.normalized_vertices;
  const tableId = getAttributeRowId(thisFieldIndexes);
  const fieldId: FieldID = {
    key: k,
    primaryIndex: primaryIndex,
    isSubattribute: isSubattribute,
    subIndex: subIndex,
    parentKey: parentAttribute,
    indexes: thisFieldIndexes,
  };
    
  const [ editMode, setEditMode ] = useState(false);
  const [ openSubtable, setOpenSubtable ] = useState(true);
  const [ lastSavedValue, setLastSavedValue ] = useState(v.value);
  const [ menuAnchor, setMenuAnchor ] = useState<null | HTMLElement>(null);
  const [ showActions, setShowActions ] = useState(false);
  const [ childFields, setChildFields ] = useState<string[]>([]);
  const { hasPermission } = useUserContext();

  const fieldIsSelected = thisFieldIndexes.length === displayIndexes.length && thisFieldIndexes.every((val, index) => val === displayIndexes[index]);

  const allowMultiple = recordSchema[schemaKey]?.occurrence?.toLowerCase().includes("multiple");
  const schemaDataType = recordSchema[schemaKey]?.google_data_type ?? recordSchema[schemaKey]?.data_type;
  const dbDataType = recordSchema[schemaKey]?.database_data_type;
  const isParent = schemaDataType?.toLowerCase() === "parent";
  const hasSubattributes = v.subattributes?.length;

  const thisAlias = recordSchema[schemaKey]?.alias || k;

  useEffect(() => {
    const tempChildFields: string[] = [];
    if (isParent) {
      const childFieldPrefix = `${schemaKey}::`;
      const recordKeys = Object.keys(recordSchema);
      for (let each of recordKeys) {
        if (!each.startsWith(childFieldPrefix)) continue;
        const childFieldKey = each.slice(childFieldPrefix.length);
        if (!childFieldKey.includes("::")) {
          tempChildFields.push(each);
        }
      }
    }
    setChildFields(tempChildFields);
  }, [isParent, recordSchema, schemaKey]);

  const handleClickInside = (e: React.MouseEvent<HTMLTableRowElement>) => {
    if (hasSubattributes) setOpenSubtable(!openSubtable);
    e.stopPropagation();
    handleClickField(fieldId, coordinates);
  };

  const handleSuccess = (resp: any) => {
    const fieldId: FieldID = {
      key: k,
      primaryIndex: primaryIndex,
      subIndex: subIndex,
      isSubattribute: isSubattribute,
      indexes: thisFieldIndexes,
    };
    const attributeResponseKey = getAttributeResponseKey(fieldId.indexes);
    const newV = resp?.[attributeResponseKey];
    if (newV === undefined) {
      console.error(`attribute update response missing ${attributeResponseKey}`);
      return;
    }

    const data: {
            fieldId: FieldID,
            v: any;
            review_status?: string;
            recordId?: string;
          } = {
            fieldId,
            v: newV,
            recordId: record_id,
          };
    if (resp?.review_status) data.review_status = resp?.review_status;
    handleSuccessfulAttributeUpdate(data);
  };

  const handleFailedUpdate = (data: any, response_status?: number) => {
    if (response_status === 403) {
      showError(`${data}.`);
    } else {
      console.error(`error updating attribute ${k}: ${data}`);
    }
  };

  const handleUpdateRecord = (cleanFields: boolean = true) => {
    if (locked) return;
    const body: {
            data: { key: string; idx: number; v: any, review_status?: string
            isSubattribute?: boolean, subIndex?: number | null,
            indexes: number[]};
            type: string;
            fieldToClean: any;
          } = { data: { key: k, idx: primaryIndex, v: v, review_status: reviewStatus, isSubattribute: isSubattribute, subIndex: subIndex, indexes: thisFieldIndexes}, type: "attribute", fieldToClean: null };
    if (cleanFields) {
      const fieldToClean = {
        topLevelIndex: primaryIndex,
        isSubattribute: isSubattribute,
        subIndex: subIndex,
        indexes: thisFieldIndexes,
      };
      body["fieldToClean"] = fieldToClean;
    }
    callAPI(
      updateRecord,
      [record_id, body],
      handleSuccess,
      handleFailedUpdate
    );
  };

  useKeyDown("Enter", () => {
    // if (isSelected) {
    if (fieldIsSelected) {
      if (editMode) finishEditing();
      else makeEditable();
    }
  }, undefined, undefined, undefined, true);

  useKeyDown("Escape", () => {
    // if (isSelected) {
    if (fieldIsSelected) {
      if (editMode) {
        // reset to last saved value
        if (v.value !== lastSavedValue) {
          let fakeEvent = {
            target: {
              value: lastSavedValue
            }
          } as React.ChangeEvent<HTMLInputElement>;
          handleChangeValue(fakeEvent, fieldId);
        }
        setEditMode(false);
      }
      handleClickField(fieldId, coordinates);
    }
  }, undefined, undefined, undefined);

  useEffect(() => {
    const shouldForceOpen = !!forceOpenSubtable?.length &&
      thisFieldIndexes.length <= forceOpenSubtable.length &&
      thisFieldIndexes.every((indexValue, indexPosition) => forceOpenSubtable[indexPosition] === indexValue);
    if (shouldForceOpen) setOpenSubtable(true);
  }, [forceOpenSubtable, thisFieldIndexes]);

  useEffect(() => {
    if (forceEditMode[0] === idx && forceEditMode[1] === -1 && !isSubattribute) {
      makeEditable();
      handleClickField(fieldId, coordinates);
    } else if (forceEditMode[0] === topLevelIdx && forceEditMode[1] === idx && isSubattribute) {
      makeEditable();
      handleClickField(fieldId, coordinates);
    } else if (forceEditMode[0] !== -1) {
      setEditMode(false);
    }
  }, [forceEditMode]);

  const handleDoubleClick = () => {
    makeEditable();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableCellElement>) => {
    if (e.key === "ArrowLeft") {
      e.stopPropagation();
    }
    else if (e.key === "ArrowRight") {
      e.stopPropagation();
    }
  };

  const handleClickEditIcon = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleDoubleClick();
  };

  const makeEditable = () => {
    if (locked) return;
    setEditMode(true);
  };

  const finishEditing = () => {
    handleUpdateRecord();
    setLastSavedValue(v.value);
    setEditMode(false);
  };

  const showAutocleanDisclaimer = () => {
    if (v.cleaned && v.value !== null && v.lastUpdated && v.last_cleaned) {
      const difference = Math.abs((v.lastUpdated / 1000) - v.last_cleaned);
      if (difference <= 10) return true;
    }
    return false;
  };

  const handleClickShowActions = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setShowActions(!showActions);
    setMenuAnchor(event.currentTarget);
  };

  const handleClickInsertField = () => {
    setShowActions(false);
    setMenuAnchor(null);
    handleClickOutside();
    insertField(fieldId, parentAttribute);
  };

  const handleClickDeleteField = () => {
    setShowActions(false);
    setMenuAnchor(null);
    handleClickOutside();
    deleteField(fieldId);
  };

  const handleClickAddChildField = (childField: string) => {
    // console.log(`add child field: ${childField}`)
    const childKey = childField.replace(`${schemaKey}::`, "");
    let subIdx = v.subattributes?.length || 0;
    subIdx -= 1;
    setMenuAnchor(null);
    setShowActions(false);
    handleClickOutside();
    const childId: FieldID = {
      key: childKey,
      primaryIndex: primaryIndex,
      isSubattribute: true,
      subIndex: subIdx,
      parentKey: parentAttribute,
      indexes: [...thisFieldIndexes, subIdx],
    };
    insertField(childId, schemaKey);
  };

  const handleUpdateValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (locked) return;
    handleChangeValue(event, fieldId);
  };

  const handleClickUpdateFieldLocation = () => {
    const fieldID = {
      key: k,
      primaryIndex,
      subIndex,
      isSubattribute,
      indexes: thisFieldIndexes,
    };
    setUpdateFieldLocationID(fieldID);
    setMenuAnchor(null);
    setShowActions(false);
    // handleClickOutside();
  };

  const getRowOptionsIcon = () => {
    const showUpdateCoordinatesOption = hasPermission("update_coordinates");
    return (
      <TableCell>
        {
          (allowMultiple || isParent || showUpdateCoordinatesOption || v.user_added) && (
            <IconButton size='small' onClick={handleClickShowActions}>
              <MoreVertIcon sx={{fontSize: "18px"}}/>
            </IconButton>
          )
        }
        <Menu
          id="actions"
          anchorEl={menuAnchor}
          open={showActions}
          onClose={() => setShowActions(false)}
          onClick={(e) => e.stopPropagation()}
          sx={{maxHeight: "50vh"}}
        >
          {allowMultiple && 
                        <MenuItem onClick={handleClickInsertField}>Add another '{thisAlias}'</MenuItem>
          }
          {
            childFields.map((childField) => (
              <MenuItem 
                key={childField} 
                onClick={() => handleClickAddChildField(childField)}
              >
                                Add child field '{
                                  recordSchema[childField]?.alias ||
                                  childField.replace(`${schemaKey}::`, "")
                                }'
              </MenuItem>
            ))
          }
          {
            showUpdateCoordinatesOption && (
              <MenuItem onClick={handleClickUpdateFieldLocation}>
                                Update field location
              </MenuItem>
            )
          }
          {v.user_added && 
                        <MenuItem onClick={handleClickDeleteField}>Delete this '{thisAlias}'</MenuItem>
          }
        </Menu>
      </TableCell> 
    );
  };

  return (
    <>
      <TableRow id={tableId} sx={fieldIsSelected ? {backgroundColor: "#EDEDED"} : {}} onClick={handleClickInside}>
        <TableCell sx={styles.fieldKey}>
          <span>
            {thisAlias}
          </span>
          {
            hasSubattributes ?
                    <IconButton
                      aria-label="expand row"
                      size="small"
                      sx={styles.rowIconButton}
                    >
                      {openSubtable ? <KeyboardArrowUpIcon sx={styles.rowIcon}/> : <KeyboardArrowDownIcon sx={styles.rowIcon}/>}
                    </IconButton>
          : null}
        </TableCell>
        {
          isParent ? 
            <TableCell></TableCell> 
            :
            <TableCell onKeyDown={handleKeyDown}>

              <Stack direction='column'>
                <span style={v.cleaning_error ? styles.errorSpan : {}}>
                  {editMode ? 
                    <Tooltip title={`Expected data type: ${dbDataType}`} placement="top">
                      
                      <TextField 
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        name={k}
                        size="small"
                        defaultValue={v.value} 
                        onChange={handleUpdateValue} 
                        onFocus={(event) => event.target.select()}
                        id='edit-field-text-box'
                        sx={v.cleaning_error ? styles.errorTextField: {}}
                        variant='outlined'
                      />

                    </Tooltip>
                    :
                    <p style={v.cleaning_error ? styles.errorParagraph : styles.noErrorParagraph}>
                      {formatAttributeValue(v.value)}&nbsp;
                      {fieldIsSelected && !locked &&
                                    <IconButton id='edit-field-icon' sx={styles.rowIconButton} onClick={handleClickEditIcon}>
                                      <EditIcon sx={styles.rowIcon}/>
                                    </IconButton>
                      }
                    </p>
                  }
                </span>
                {
                  v.cleaning_error && (
                    <Typography noWrap component={"p"} sx={styles.errorText}>
                                Error during cleaning 
                      <Tooltip title={v.cleaning_error} onClick={(e) => e.stopPropagation()}>
                        <IconButton sx={styles.errorInfoIcon}>
                          <InfoIcon fontSize='inherit' color='inherit'/>
                        </IconButton>
                      </Tooltip>
                                
                    </Typography>
                  )
                }
                {
                  (fieldIsSelected && !showRawValues) &&(
                    <span>
                      {
                        showAutocleanDisclaimer() &&
                                    <Typography noWrap component={"p"} sx={styles.ocrRawText}>
                                        Edited value was auto-cleaned 
                                      <Tooltip title={`Only ${recordSchema[schemaKey]?.database_data_type} types are allowed for this field.`} onClick={(e) => e.stopPropagation()}>
                                        <IconButton sx={styles.infoIcon}>
                                          <InfoIcon fontSize='inherit' color='inherit'/>
                                        </IconButton>
                                      </Tooltip>
                                    </Typography>
                      }
                      {
                        showEditedValue(v) &&
                                    <Typography noWrap component={"p"} sx={styles.ocrRawText} onClick={(e) => e.stopPropagation()}>
                                        Edited value: {v.uncleaned_value}
                                    </Typography>
                      }
                      {
                        showOCRRawValue(v) &&
                                    <Typography noWrap component={"p"} sx={styles.ocrRawText} onClick={(e) => e.stopPropagation()}>
                                        OCR Raw Value: {v.raw_text}
                                    </Typography>
                      }
                    </span>
                  )
                }
              </Stack>
            </TableCell>
        }
        {showRawValues &&
                <TableCell>
                  <span >
                    {v.raw_text}&nbsp;
                  </span>
                </TableCell>
        }
        <TableCell align="right" id={v.key+"_confidence"}>
          {
            v.user_added ? (
              <Tooltip title={(v.lastUpdated) ? `Last updated ${formatDateTime(v.lastUpdated)} by ${v.lastUpdatedBy || "unknown"}` : ""}>
                <p style={{padding:0, margin:0}}>
                  <Badge
                    variant="dot"
                    sx={{
                      "& .MuiBadge-badge": {
                        color: "#2196F3",
                        backgroundColor: "#2196F3"
                      }
                    }}
                  /> 
                                &nbsp; Added
                </p> 
              </Tooltip>
            ) :
              v.edited ? 
                (
                  <Tooltip title={(v.lastUpdated) ? `Last updated ${formatDateTime(v.lastUpdated)} by ${v.lastUpdatedBy || "unknown"}` : ""}>
                    <p style={{padding:0, margin:0}}>
                      <Badge
                        variant="dot"
                        sx={{
                          "& .MuiBadge-badge": {
                            color: "#2196F3",
                            backgroundColor: "#2196F3"
                          }
                        }}
                      /> 
                                &nbsp; Edited
                    </p> 
                  </Tooltip>
                )
                :
                (v.confidence === null) ? 
                  <p style={{padding:0, margin:0}}>
                    <Badge
                      variant="dot"
                      sx={{
                        "& .MuiBadge-badge": {
                          color: "#9E0101",
                          backgroundColor: "#9E0101"
                        }
                      }}
                    /> 
                        &nbsp; Not found
                  </p>
                  :
                  <p 
                    style={
                      (!hasSubattributes && (v.value === "" || v.confidence < LOW_CONFIDENCE)) ? 
                        styles.flaggedConfidence :
                        styles.unflaggedConfidence
                    }
                  >
                    {formatConfidence(v.confidence)}
                  </p>
          }
        </TableCell>
        {getRowOptionsIcon()}
      </TableRow>
      {
        hasSubattributes ?
            <AttributesTable
              attributesList={v.subattributes || []}
              topLevelIdx={primaryIndex} 
              parentKey={schemaKey}
              open={openSubtable}
              record_id={record_id}
              reviewStatus={reviewStatus}
              handleClickOutside={handleClickOutside}
              parentIndexes={thisFieldIndexes}
              forceOpenSubtable={forceOpenSubtable}
              {...childProps}
            />
      : null}
    </>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.k === nextProps.k &&
    prevProps.v === nextProps.v &&
    prevProps.idx === nextProps.idx &&
    prevProps.topLevelIdx === nextProps.topLevelIdx &&
    prevProps.record_id === nextProps.record_id &&
    prevProps.handleClickOutside === nextProps.handleClickOutside &&
    prevProps.handleClickField === nextProps.handleClickField &&
    prevProps.handleChangeValue === nextProps.handleChangeValue &&
    prevProps.fullscreen === nextProps.fullscreen &&
    prevProps.locked === nextProps.locked &&
    prevProps.showRawValues === nextProps.showRawValues &&
    prevProps.recordSchema === nextProps.recordSchema &&
    prevProps.forceEditMode === nextProps.forceEditMode &&
    prevProps.insertField === nextProps.insertField &&
    prevProps.handleSuccessfulAttributeUpdate === nextProps.handleSuccessfulAttributeUpdate &&
    prevProps.showError === nextProps.showError &&
    prevProps.deleteField === nextProps.deleteField &&
    prevProps.reviewStatus === nextProps.reviewStatus &&
    prevProps.setUpdateFieldLocationID === nextProps.setUpdateFieldLocationID &&
    indexesMatch(prevProps.parentIndexes, nextProps.parentIndexes) &&
    rowDisplayStateMatches(prevProps, nextProps) &&
    rowForceOpenStateMatches(prevProps, nextProps)
  );
});

export default AttributesTable;
