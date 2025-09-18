import React, { useState, useEffect, MouseEvent } from 'react';
import { useParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Menu, MenuItem } from '@mui/material';
import { Box, TextField, Collapse, Typography, IconButton, Badge, Tooltip, Stack } from '@mui/material';

import { updateRecord } from '../../services/app.service';
import { formatConfidence, useKeyDown, useOutsideClick, formatAttributeValue, formatDateTime, callAPI } from '../../util';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Attribute, RecordAttributesTableProps, FieldID } from '../../types';
import { styles } from '../../styles';
import { useUserContext } from '../../usercontext';


const LOW_CONFIDENCE: number = 0.01;

interface AttributesTableProps extends RecordAttributesTableProps {
    attributesList: Attribute[];
    forceOpenSubtable?: number | null;
    open?: boolean;
    topLevelIdx?: number;
    topLevelKey?: string;
    record_id?: string;
    handleClickOutside?: () => void;
}

function showEditedValue(v: Attribute){
    if (v.edited && v.uncleaned_value) {
        return true
    }
    return false
}

function showOCRRawValue(v: Attribute) {
    if (v.user_added) return false
    else if (v.edited || v.cleaned) return true
    return false
}


const AttributesTable = (props: AttributesTableProps) => {
    const { 
        attributesList,
        open,
        topLevelKey = "",
        topLevelIdx = -1,
        forceOpenSubtable=false,
        ...childProps
    } = props;

    const {
        handleClickField,
        showRawValues
    } = childProps;

    const handleClickOutside = () => {
        const emptyField: FieldID = {
            key: '',
            primaryIndex: -1
        }
        handleClickField(emptyField, null);
    }
    const ref = useOutsideClick(handleClickOutside);
    const params = useParams<{ id: string }>();

    if (topLevelKey) {return (
        <TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{ margin: 1 }}>
                <Typography variant="h6" gutterBottom component="div">
                    {topLevelKey} Properties
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
                            topLevelKey={topLevelKey}
                            topLevelIdx={topLevelIdx}
                            record_id={params.id}
                            handleClickOutside={handleClickOutside}
                            {...childProps}
                        />
                    ))}
                    </TableBody>
                </Table>
                </Box>
            </Collapse>
            </TableCell>
        </TableRow>
    )} else return (
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
                            handleClickOutside={handleClickOutside}
                            {...childProps}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

interface AttributeRowProps extends RecordAttributesTableProps {
    k: string;
    v: Attribute;
    idx: number;
    topLevelKey?: string;
    topLevelIdx?: number;
    forceOpenSubtable?: number | null;
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
        topLevelKey,
        ...childProps
    } = props;

    const { 
        handleClickField,
        handleChangeValue,
        displayKeyIndex,
        displayKeySubattributeIndex,
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
    const isSubattribute = (topLevelIdx && topLevelIdx > -1) ? true : false;
    const schemaKey = isSubattribute ? `${topLevelKey}::${k}` : k;
    const primaryIndex = isSubattribute ? topLevelIdx : idx;
    const subIndex = isSubattribute ? idx : null;
    const coordinates = v.user_provided_coordinates || v.normalized_vertices;
    const tableId = isSubattribute ? `${k}::${primaryIndex}::${idx}` : `${k}::${idx}`
    const fieldId: FieldID = {
        key: k,
        primaryIndex: primaryIndex,
        isSubattribute: isSubattribute,
        subIndex: subIndex,
        parentKey: topLevelKey,
    }
    
    const [ editMode, setEditMode ] = useState(false);
    const [ openSubtable, setOpenSubtable ] = useState(true);
    const [ isSelected, setIsSelected ] = useState(false);
    const [ lastSavedValue, setLastSavedValue ] = useState(v.value);
    const [ menuAnchor, setMenuAnchor ] = useState<null | HTMLElement>(null);
    const [ showActions, setShowActions ] = useState(false);
    const [ childFields, setChildFields ] = useState<string[]>([]);
    const { userPermissions } = useUserContext();

    const allowMultiple = recordSchema[schemaKey]?.occurrence?.toLowerCase().includes('multiple');
    const isParent = recordSchema[schemaKey]?.google_data_type?.toLowerCase() === 'parent';

    useEffect(() => {
        const tempChildFields = [];
        if (isParent) {
            let recordKeys = Object.keys(recordSchema);
            for (let each of recordKeys) {
                if (each.includes(`${k}::`)) {
                    tempChildFields.push(each);
                }
            }
            setChildFields(tempChildFields);
        }
    }, [v])

    useEffect(() => {
        if (isSubattribute){
            if (displayKeyIndex === topLevelIdx && idx === displayKeySubattributeIndex) {
                setIsSelected(true);
            } else {
                setIsSelected(false);
                if (editMode) finishEditing();
            }
        } else {
            if (idx === displayKeyIndex && (displayKeySubattributeIndex === null || displayKeySubattributeIndex === undefined))
                setIsSelected(true);
            else  {
                setIsSelected(false);
                if (editMode) finishEditing();
            }
        }

    }, [displayKeyIndex, topLevelIdx, displayKeySubattributeIndex]);

    const handleClickInside = (e: React.MouseEvent<HTMLTableRowElement>) => {
        if (v.subattributes) setOpenSubtable(!openSubtable)
        e.stopPropagation();
        handleClickField(fieldId, coordinates);
    }

    const handleSuccess = (resp: any) => {
        let newV;
        if (isSubattribute)
            newV = resp?.[`attributesList.${topLevelIdx}.subattributes.${idx}`];
        else
            newV = resp?.["attributesList."+idx];
        const fieldId: FieldID = {
            key: k,
            primaryIndex: primaryIndex,
            subIndex: subIndex,
            isSubattribute: isSubattribute,
        }
        const data: {
            fieldId: FieldID,
            v: any;
            review_status?: string;
          } = {
            fieldId,
            v: newV,
        }
        if (resp?.review_status) data.review_status = resp?.review_status;
        handleSuccessfulAttributeUpdate(data)
    }

    const handleFailedUpdate = (data: any, response_status?: number) => {
        if (response_status === 403) {
            showError(`${data}.`);
        } else {
            console.error(`error updating attribute ${k}: ${data}`);
        }
    }

    const handleUpdateRecord = (cleanFields: boolean = true) => {
        if (locked) return
        const body: {
            data: { key: string; idx: number; v: any, review_status?: string
            isSubattribute?: boolean, subIndex?: number | null};
            type: string;
            fieldToClean: any;
          } = { data: { key: k, idx: primaryIndex, v: v, review_status: reviewStatus, isSubattribute: isSubattribute, subIndex: subIndex}, type: "attribute", fieldToClean: null }
        if (cleanFields) {
            const fieldToClean = {
                topLevelIndex: primaryIndex,
                isSubattribute: isSubattribute,
                subIndex: subIndex,
            }
            body['fieldToClean'] = fieldToClean;
        }
        callAPI(
            updateRecord,
            [record_id, body],
            handleSuccess,
            handleFailedUpdate
        );
    }

    useKeyDown("Enter", () => {
        if (isSelected) {
            if (editMode) finishEditing();
            else makeEditable();
        }
    }, undefined, undefined, undefined, true);

    useKeyDown("Escape", () => {
        if (isSelected) {
            if (editMode) {
                // reset to last saved value
                if (v.value !== lastSavedValue) {
                    let fakeEvent = {
                        target: {
                            value: lastSavedValue
                        }
                    } as React.ChangeEvent<HTMLInputElement>
                    handleChangeValue(fakeEvent, fieldId)
                }
                setEditMode(false);
            }
            handleClickField(fieldId, coordinates)
        }
    }, undefined, undefined, undefined);

    useEffect(() => {
        if (forceOpenSubtable === idx) setOpenSubtable(true);
    }, [forceOpenSubtable]);

    useEffect(() => {
        if (forceEditMode[0] === idx && forceEditMode[1] === -1 && !isSubattribute) {
            makeEditable();
            handleClickField(fieldId, coordinates);
        } else if (forceEditMode[0] === topLevelIdx && forceEditMode[1] === idx && isSubattribute) {
            makeEditable();
            handleClickField(fieldId, coordinates);
        } else if (forceEditMode[0] !== -1) {
            setIsSelected(false);
            setEditMode(false);
        }
    }, [forceEditMode]);

    const handleDoubleClick = () => {
        makeEditable()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTableCellElement>) => {
        if (e.key === "ArrowLeft") {
            e.stopPropagation();
        }
        else if (e.key === "ArrowRight") {
            e.stopPropagation();
        }
    }

    const handleClickEditIcon = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handleDoubleClick();
    }

    const makeEditable = () => {
        if (locked) return
        setEditMode(true);
    }

    const finishEditing = () => {
        if (v.value !== lastSavedValue) {
            handleUpdateRecord();
            setLastSavedValue(v.value);
        }
        setEditMode(false);
    }

    const showAutocleanDisclaimer = () => {
        if (v.cleaned && v.value !== null && v.lastUpdated && v.last_cleaned) {
            const difference = Math.abs((v.lastUpdated / 1000) - v.last_cleaned);
            if (difference <= 10) return true
        }
        return false
    }

    const handleClickShowActions = (event: MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setShowActions(!showActions);
        setMenuAnchor(event.currentTarget);
    }

    const handleClickInsertField = () => {
        setShowActions(false);
        setMenuAnchor(null);
        handleClickOutside();
        insertField(fieldId, topLevelKey);
    }

    const handleClickDeleteField = () => {
        setShowActions(false);
        setMenuAnchor(null);
        handleClickOutside();
        deleteField(fieldId);
    }

    const handleClickAddChildField = (childField: string) => {
        // console.log(`add child field: ${childField}`)
        const childKey = childField.replace(`${k}::`, '');
        let subIdx = v.subattributes?.length || 0;
        subIdx -= 1;
        setMenuAnchor(null);
        setShowActions(false);
        handleClickOutside();
        const childId: FieldID = {
            key: childKey,
            primaryIndex: idx,
            isSubattribute: true,
            subIndex: subIdx,
        }
        insertField(childId, k);
    }

    const handleUpdateValue = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (locked) return;
        handleChangeValue(event, fieldId);
    }

    const handleClickUpdateFieldLocation = () => {
        const fieldID = {
            key: k,
            primaryIndex,
            subIndex,
            isSubattribute
        };
        setUpdateFieldLocationID(fieldID);
        setMenuAnchor(null);
        setShowActions(false);
        // handleClickOutside();
    }

    const getRowOptionsIcon = () => {
        const showUpdateCoordinatesOption = userPermissions?.includes("update_coordinates");
        return (
            <TableCell>
                {
                    (allowMultiple || isParent || showUpdateCoordinatesOption) && (
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
                >
                    {allowMultiple && 
                        <MenuItem onClick={handleClickInsertField}>Add another '{k}'</MenuItem>
                    }
                    {
                        childFields.map((childField) => (
                            <MenuItem 
                                key={childField} 
                                onClick={() => handleClickAddChildField(childField)}
                            >
                                Add child field '{childField.replace(`${k}::`, '')}'
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
                        <MenuItem onClick={handleClickDeleteField}>Delete this '{k}'</MenuItem>
                    }
                </Menu>
            </TableCell> 
        )
    }

    return (
    <>
        <TableRow id={tableId} sx={(isSelected && !isParent) ? {backgroundColor: "#EDEDED"} : {}} onClick={handleClickInside}>
            <TableCell sx={styles.fieldKey}>
                <span>
                    {k}
                </span>
                {
                    v.subattributes &&
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        sx={styles.rowIconButton}
                    >
                        {openSubtable ? <KeyboardArrowUpIcon sx={styles.rowIcon}/> : <KeyboardArrowDownIcon sx={styles.rowIcon}/>}
                    </IconButton>
                }
            </TableCell>
            {
                isParent ? 
                <TableCell></TableCell> 
                :
                <TableCell onKeyDown={handleKeyDown}>

                <Stack direction='column'>
                    <span style={v.cleaning_error ? styles.errorSpan : {}}>
                        {editMode ? 
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
                            :
                            <p style={v.cleaning_error ? styles.errorParagraph : styles.noErrorParagraph}>
                                {formatAttributeValue(v.value)}&nbsp;
                                {isSelected && !locked &&
                                    <IconButton id='edit-field-icon' sx={styles.rowIconButton} onClick={handleClickEditIcon}>
                                        <EditIcon sx={styles.rowIcon}/>
                                    </IconButton>
                                }
                            </p>
                        }
                    </span>
                    {
                        v.cleaning_error && (
                            <Typography noWrap component={'p'} sx={styles.errorText}>
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
                        (isSelected && !showRawValues) &&(
                            <span>
                                {
                                    showAutocleanDisclaimer() &&
                                    <Typography noWrap component={'p'} sx={styles.ocrRawText}>
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
                                    <Typography noWrap component={'p'} sx={styles.ocrRawText} onClick={(e) => e.stopPropagation()}>
                                        Edited value: {v.uncleaned_value}
                                    </Typography>
                                }
                                {
                                    showOCRRawValue(v) &&
                                    <Typography noWrap component={'p'} sx={styles.ocrRawText} onClick={(e) => e.stopPropagation()}>
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
            <TableCell align="right" id={v.key+'_confidence'}>
                {
                    v.user_added ? (
                        <Tooltip title={(v.lastUpdated) ? `Last updated ${formatDateTime(v.lastUpdated)} by ${v.lastUpdatedBy || 'unknown'}` : ''}>
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
                        <Tooltip title={(v.lastUpdated) ? `Last updated ${formatDateTime(v.lastUpdated)} by ${v.lastUpdatedBy || 'unknown'}` : ''}>
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
                            (v.value === "" || v.confidence < LOW_CONFIDENCE) ? 
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
            v.subattributes &&
            <AttributesTable
                attributesList={v.subattributes}
                topLevelIdx={idx} 
                topLevelKey={k}
                open={openSubtable}
                record_id={record_id}
                reviewStatus={reviewStatus}
                handleClickOutside={handleClickOutside}
                {...childProps}
            />
        }
    </>
    )
})

export default AttributesTable;