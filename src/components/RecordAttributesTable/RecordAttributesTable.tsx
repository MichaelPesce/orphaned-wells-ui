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
import { Attribute, RecordAttributesTableProps } from '../../types';
import { styles } from '../../styles';


const LOW_CONFIDENCE: number = 0.01;

interface AttributesTableProps extends RecordAttributesTableProps {
    attributesList: Attribute[];
    forceOpenSubtable: number | null;
}

const AttributesTable = (props: AttributesTableProps) => {
    const { 
        attributesList,
        ...childProps
    } = props;

    const {
        handleClickField,
        showRawValues
    } = childProps;

    const handleClickOutside = () => {
        handleClickField('', null, -1, false, null);
    }
    const ref = useOutsideClick(handleClickOutside);
    const params = useParams<{ id: string }>();

    return (
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
    forceOpenSubtable: number | null;
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
        deleteField
    } = childProps;
    
    const [ editMode, setEditMode ] = useState(false);
    const [ openSubtable, setOpenSubtable ] = useState(true);
    const [ isSelected, setIsSelected ] = useState(false);
    const [ lastSavedValue, setLastSavedValue ] = useState(v.value);
    const [ menuAnchor, setMenuAnchor ] = useState<null | HTMLElement>(null);
    const [ showActions, setShowActions ] = useState(false);
    const [ childFields, setChildFields ] = useState<string[]>([]);

    const allowMultiple = recordSchema[k]?.occurrence?.toLowerCase().includes('multiple');
    const isParent = recordSchema[k]?.google_data_type?.toLowerCase() === 'parent';

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
        if (idx === displayKeyIndex && (displayKeySubattributeIndex === null || displayKeySubattributeIndex === undefined)) setIsSelected(true);
        else  {
            setIsSelected(false);
            if (editMode) finishEditing();
        }
    }, [displayKeyIndex, displayKeySubattributeIndex]);

    const handleClickInside = (e: React.MouseEvent<HTMLTableRowElement>) => {
        if (v.subattributes) setOpenSubtable(!openSubtable)
        e.stopPropagation();
        handleClickField(k, v.normalized_vertices, idx, false, null);
    }

    const handleSuccess = (resp: any) => {
        const newV = resp?.["attributesList."+idx];
        const data: any = {
            isSubattribute: false,
            topLevelIndex: idx,
            subIndex: null,
            v: newV,
            review_status: resp?.review_status,
        }
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
            data: { key: string; idx: number; v: any, review_status: string };
            type: string;
            fieldToClean: any;
          } = { data: { key: k, idx: idx, v: v, review_status: reviewStatus}, type: "attribute", fieldToClean: null }
        if (cleanFields) {
            const fieldToClean = {
                topLevelIndex: idx,
                isSubattribute: false,
                subIndex: null
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
                    handleChangeValue(fakeEvent, idx)
                }
                setEditMode(false);
            }
            handleClickField(k, v.normalized_vertices, idx, false, null);
        }
    }, undefined, undefined, undefined);

    useEffect(() => {
        if (forceOpenSubtable === idx) setOpenSubtable(true);
    }, [forceOpenSubtable]);

    useEffect(() => {
        if (forceEditMode[0] === idx && forceEditMode[1] === -1) {
            makeEditable();
            handleClickField(k, v.normalized_vertices, idx, false, null);
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
        // TODO: this isnt working as intended
        // last updated is in milliseconds, last_cleaned is in seconds
        if (v.cleaned && v.value !== null && v.lastUpdated && v.last_cleaned) {
            // we can assume it was autocleaned (and not simply cleaned) if last updated and last cleaned times are within a couple seconds of eachother
            // this doesnt work ^. if a user updates it, waits a few seconds, then clicks enter, there is a wider gap :/
            const difference = Math.abs((v.lastUpdated / 1000) - v.last_cleaned);
            if (difference <= 10) return true
        }
        return false
    }

    const showEditedValue = () => {
        if (v.edited && v.uncleaned_value) {
            return true
        }
        return false
    }

    const showOCRRawValue = () => {
        if (v.user_added) return false
        else if (v.edited || v.cleaned) return true
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
        insertField(k, idx, false);
    }

    const handleClickDeleteField = () => {
        setShowActions(false);
        setMenuAnchor(null);
        handleClickOutside();
        deleteField(idx, false);
    }

    const handleClickAddChildField = (childField: string) => {
        // console.log(`add child field: ${childField}`)
        const childKey = childField.replace(`${k}::`, '');
        let subIdx = v.subattributes?.length || 0;
        subIdx -= 1;
        setMenuAnchor(null);
        setShowActions(false);
        handleClickOutside();
        insertField(childKey, idx, true, subIdx, k);
    }

    return (
    <>
        <TableRow id={`${k}::${idx}`} sx={(isSelected && !isParent) ? {backgroundColor: "#EDEDED"} : {}} onClick={handleClickInside}>
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
            { // TODO: add styling to parent attribute if subattributes have errors
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
                                onChange={(e) => handleChangeValue(e, idx)} 
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
                                        <Tooltip title={`Only ${recordSchema[k]?.database_data_type} types are allowed for this field.`} onClick={(e) => e.stopPropagation()}>
                                            <IconButton sx={styles.infoIcon}>
                                                <InfoIcon fontSize='inherit' color='inherit'/>
                                            </IconButton>
                                        </Tooltip>
                                    </Typography>
                                }
                                {
                                    showEditedValue() &&
                                    <Typography noWrap component={'p'} sx={styles.ocrRawText} onClick={(e) => e.stopPropagation()}>
                                        Edited value: {v.uncleaned_value}
                                    </Typography>
                                }
                                {
                                    showOCRRawValue() &&
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
            <TableCell>{(allowMultiple || isParent) ? (
                <IconButton size='small' onClick={handleClickShowActions}>
                    <MoreVertIcon/>
                </IconButton>
            ) : null}</TableCell> 
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
                {v.user_added && 
                    <MenuItem onClick={handleClickDeleteField}>Delete this '{k}'</MenuItem>
                }
            </Menu>
        </TableRow>
        {
            v.subattributes &&
            <SubattributesTable 
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

interface SubattributesTableProps extends RecordAttributesTableProps {
    attributesList: Attribute[];
    open: boolean;
    topLevelIdx: number;
    topLevelKey: string;
    record_id?: string;
    handleClickOutside: () => void;
}

const SubattributesTable = (props: SubattributesTableProps) => {
    const { 
        attributesList,
        open,
        topLevelKey,
        ...childProps
    } = props;

    const {
        showRawValues,
    } = childProps;

    return (
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
                        <SubattributeRow 
                            key={`${v.key} ${idx}`}
                            k={v.key}
                            v={v}
                            idx={idx}
                            topLevelKey={topLevelKey}
                            {...childProps}
                        />
                    ))}
                    </TableBody>
                </Table>
                </Box>
            </Collapse>
            </TableCell>
        </TableRow>
    )
}

interface SubattributeRowProps extends RecordAttributesTableProps {
    k: string;
    v: Attribute;
    topLevelIdx: number;
    idx: number;
    topLevelKey: string;
    record_id?: string;
    handleClickOutside: () => void;
}

const SubattributeRow = React.memo((props: SubattributeRowProps) => {
    const { 
        k, 
        v,
        handleClickField,
        handleChangeValue,
        topLevelIdx,
        displayKeyIndex,
        displayKeySubattributeIndex,
        idx,
        locked,
        showRawValues,
        recordSchema,
        topLevelKey,
        showError,
        handleSuccessfulAttributeUpdate,
        record_id,
        insertField,
        deleteField,
        forceEditMode,
        reviewStatus,
        handleClickOutside
    } = props;

    const [ editMode, setEditMode ] = useState(false);
    const [ isSelected, setIsSelected ] = useState(false);
    const [ lastSavedValue, setLastSavedValue ] = useState(v.value)
    const [ menuAnchor, setMenuAnchor ] = useState<null | HTMLElement>(null);
    const [showActions, setShowActions] = useState(false);

    const schemaKey = `${topLevelKey}::${k}`
    const allowMultiple = recordSchema[schemaKey]?.occurrence?.toLowerCase().includes('multiple');

    const handleSuccess = (resp: any) => {
        const newV = resp?.[`attributesList.${topLevelIdx}.subattributes.${idx}`];
        const data: any = {
            isSubattribute: true,
            topLevelIndex: topLevelIdx,
            subIndex: idx,
            v: newV,
        }
        handleSuccessfulAttributeUpdate(data)
    }

    const handleFailedUpdate = (data: any, response_status?: number) => {
        if (response_status === 403) {
            showError(`${data}.`);
        } else {
            console.error(`error updating attribute ${k}: ${data}`);
        }
    }

    const handleClickShowActions = (event: MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setShowActions(!showActions);
        setMenuAnchor(event.currentTarget);
    }

    const handleUpdateRecord = (cleanFields: boolean = true) => {
        if (locked) return
        const body: {
            data: { key: string; idx: number; v: any, review_status?: string, isSubattribute?: boolean, subIndex?: number };
            type: string;
            fieldToClean: any;
          } = { data: { key: k, idx: topLevelIdx, v: v, review_status: reviewStatus, isSubattribute: true, subIndex: idx}, type: "attribute", fieldToClean: null }
        if (cleanFields) {
            const fieldToClean = {
                topLevelIndex: topLevelIdx,
                isSubattribute: true,
                subIndex: idx
            }
            body['fieldToClean'] = fieldToClean
        }
        callAPI(
            updateRecord,
            [record_id, body],
            handleSuccess,
            handleFailedUpdate
        );
    }

    useEffect(() => {
        if (forceEditMode[0] === topLevelIdx && forceEditMode[1] === idx) {
            makeEditable();
            handleClickField(k, v.normalized_vertices, topLevelIdx, true, idx);
        } else if (forceEditMode[0] !== -1) {
            finishEditing();
            setIsSelected(false);
        }
    }, [forceEditMode]);

    useEffect(() => {
        if (displayKeyIndex === topLevelIdx && idx === displayKeySubattributeIndex) {
            setIsSelected(true);
        } else {
            setIsSelected(false);
            if (editMode) finishEditing();
        }
    }, [displayKeyIndex, topLevelIdx, displayKeySubattributeIndex]);

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
                    handleUpdateValue(fakeEvent)
                }
                setEditMode(false);
            }
            handleClickField(k, v.normalized_vertices, topLevelIdx, true, idx);
        }
    }, undefined, undefined, undefined);

    const handleClickInside = (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.stopPropagation();
        handleClickField(k, v.normalized_vertices, topLevelIdx, true, idx);
    }

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

    const handleUpdateValue = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (locked) return
        handleChangeValue(event, topLevelIdx, true, idx);
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
            setLastSavedValue(v.value)
        }
        setEditMode(false);
    }

    const showAutocleanDisclaimer = () => {
        // last updated is in milliseconds, last_cleaned is in seconds
        if (v.cleaned && v.value !== null && v.lastUpdated && v.last_cleaned) {
            const difference = Math.abs((v.lastUpdated / 1000) - v.last_cleaned);
            if (difference <= 2) return true
        }
        return false
    }

    const showEditedValue = () => {
        if (v.edited && v.uncleaned_value) {
            return true
        }
        return false
    }

    const handleClickInsertField = () => {
        setShowActions(false);
        setMenuAnchor(null);
        handleClickOutside();
        insertField(k, topLevelIdx, true, idx, topLevelKey);
    }

    const handleClickDeleteField = () => {
        setShowActions(false);
        setMenuAnchor(null);
        handleClickOutside();
        deleteField(topLevelIdx, true, idx);
    }

    return (
        <TableRow 
            key={k} 
            id={`${topLevelIdx}::${idx}`} 
            sx={isSelected ? {backgroundColor: "#EDEDED"} : {}}
            onClick={handleClickInside}
        >
            <TableCell sx={styles.fieldKey}>
                <span style={isSelected ? {fontWeight:"bold"} : {}}>
                    {k}
                </span>
            </TableCell>
            <TableCell onKeyDown={handleKeyDown} sx={v.cleaning_error ? {backgroundColor: '#FECDD3'} : {}}>
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
                            sx={v.cleaning_error ? styles.errorTextField: {}}
                        />
                        :
                        <p>
                            {formatAttributeValue(v.value)}&nbsp;
                            {isSelected && !locked &&
                                <IconButton sx={styles.rowIconButton} onClick={handleClickEditIcon}>
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
                                    showEditedValue() &&
                                    <Typography noWrap component={'p'} sx={styles.ocrRawText} onClick={(e) => e.stopPropagation()}>
                                        Edited value: {v.uncleaned_value}
                                    </Typography>
                                }
                                {
                                    (v.cleaned || v.cleaning_error) &&
                                    <Typography noWrap component={'p'} sx={styles.ocrRawText} onClick={(e) => e.stopPropagation()}>
                                        OCR Raw Value: {v.raw_text}
                                    </Typography>
                                }
                            </span>
                        )
                    }
                </Stack>
            </TableCell>
            {showRawValues &&
                <TableCell>
                    <span>
                        {v.raw_text}&nbsp;
                    </span>
                </TableCell>
            }
            <TableCell>{formatConfidence(v.confidence)}</TableCell>
            <TableCell>{allowMultiple ? (
                <IconButton size='small' onClick={handleClickShowActions}>
                    <MoreVertIcon/>
                </IconButton>
            ) : null}</TableCell> 
            <Menu
                id="actions"
                anchorEl={menuAnchor}
                open={showActions}
                onClose={() => setShowActions(false)}
                onClick={(e) => e.stopPropagation()}
            >
                <MenuItem onClick={handleClickInsertField}>Add another '{k}'</MenuItem>
                {v.user_added && 
                    <MenuItem onClick={handleClickDeleteField}>Delete this '{k}'</MenuItem>
                }
            </Menu>
        </TableRow>
    )
})

export default AttributesTable;