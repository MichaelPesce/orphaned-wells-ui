import React, { FC, useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, TableContainer } from '@mui/material';
import { Box, TextField, Collapse, Typography, IconButton, Badge } from '@mui/material';
import { formatConfidence, useKeyDown, useOutsideClick, round } from '../../assets/helperFunctions';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';

const styles: { [key: string]: React.CSSProperties } = {
    fieldsTable: {
        width: "100%",
        maxHeight: "70vh",
        backgroundColor: "white"
    },
    tableHead: {
        backgroundColor: "#EDF2FA",
        fontWeight: "bold",
    }, 
    fieldKey: {
        cursor: "pointer",
    },
    headerRow: {
        fontWeight: "bold"
    },
    subattributesTable: {
        backgroundColor: "#FAFAFA",
    },
    rowIconButton: {
        padding: 0.5,
        marginTop: -0.5
    },
    rowIcon: {
        fontSize: "16px"
    },
    flaggedConfidence: {
        padding: 0,
        margin: 0,
        color: "#9E0101",
    },
    unflaggedConfidence: {
        padding: 0,
        margin: 0,
    }
}

const LOW_CONFIDENCE: number = 0.01;

interface Attribute {
    key: string;
    value: string;
    confidence: number | null;
    edited?: boolean;
    normalized_vertices: number[][] | null;
    subattributes?: Attribute[];
}

interface AttributesTableProps {
    attributesList: Attribute[];
    handleClickField: (key: string, vertices: number[][] | null, index: number, isSubattribute: boolean, subattributeIdx: number | null) => void;
    handleChangeValue: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => void;
    fullscreen: string | null;
    forceOpenSubtable: number | null;
    displayKeyIndex: number;
    displayKeySubattributeIndex: number | null;
    handleUpdateRecord: () => void;
}

const AttributesTable: FC<AttributesTableProps> = (props) => {
    const { 
        attributesList,
        handleClickField,
        handleChangeValue,
        fullscreen,
        forceOpenSubtable,
        displayKeyIndex,
        displayKeySubattributeIndex,
        handleUpdateRecord,
    } = props;

    const handleClickOutside = () => {
        handleClickField('', null, -1, false, null);
    }
    const ref = useOutsideClick(handleClickOutside);

    return (
        <TableContainer id="table-container" sx={styles.fieldsTable}>
            <Table stickyHeader size='small'>
                <TableHead sx={styles.tableHead}>
                    <TableRow>
                        <TableCell sx={styles.headerRow}>Field</TableCell>
                        <TableCell sx={styles.headerRow}>Value</TableCell>
                        <TableCell sx={styles.headerRow}>Confidence</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody ref={ref}>
                    {attributesList.map((v: Attribute, idx: number) => (
                        <AttributeRow 
                            key={`${v.key} ${idx}`}
                            k={v.key}
                            v={v}
                            idx={idx}
                            handleClickField={handleClickField}
                            handleChangeValue={handleChangeValue}
                            fullscreen={fullscreen}
                            forceOpenSubtable={forceOpenSubtable}
                            displayKeyIndex={displayKeyIndex}
                            displayKeySubattributeIndex={displayKeySubattributeIndex}
                            handleUpdateRecord={handleUpdateRecord}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

interface AttributeRowProps {
    k: string;
    v: Attribute;
    idx: number;
    handleClickField: AttributesTableProps["handleClickField"];
    handleChangeValue: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number) => void;
    fullscreen: string | null;
    forceOpenSubtable: number | null;
    displayKeyIndex: number;
    displayKeySubattributeIndex: number | null;
    handleUpdateRecord: () => void;
}

const AttributeRow: FC<AttributeRowProps> = (props) => { 
    const { 
        k, 
        v, 
        idx, 
        handleClickField, 
        handleChangeValue, 
        fullscreen, 
        forceOpenSubtable,
        displayKeyIndex, 
        displayKeySubattributeIndex, 
        handleUpdateRecord 
    } = props;
    
    const [ editMode, setEditMode ] = useState<boolean>(false);
    const [ openSubtable, setOpenSubtable ] = useState<boolean>(false);
    const [ isSelected, setIsSelected ] = useState<boolean>(false);

    useEffect(() => {
        if (idx === displayKeyIndex && (displayKeySubattributeIndex === null || displayKeySubattributeIndex === undefined)) setIsSelected(true);
        else  {
            setIsSelected(false);
            if (editMode) finishEditing();
        }
    }, [displayKeyIndex, displayKeySubattributeIndex]);

    const handleClickInside = (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.stopPropagation();
        handleClickField(k, v.normalized_vertices, idx, false, null);
    }

    useKeyDown("Enter", () => {
        if (isSelected) {
            if (editMode) finishEditing();
            else setEditMode(true);
        }
    }, undefined, undefined, undefined, true);

    useKeyDown("Escape", () => {
        if (isSelected) {
            if (editMode) finishEditing();
        }
    }, undefined, undefined, undefined);

    useEffect(() => {
        if (forceOpenSubtable === idx) setOpenSubtable(true);
    }, [forceOpenSubtable]);

    const handleDoubleClick = () => {
        setEditMode(true);
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

    const finishEditing = () => {
        handleUpdateRecord();
        setEditMode(false);
    }

    return (
    <>
        <TableRow id={`${k}::${idx}`} sx={isSelected ? {backgroundColor: "#EDEDED"} : {}} onClick={handleClickInside}>
            <TableCell sx={styles.fieldKey}>
                <span>
                    {k}
                </span>
                {
                    v.subattributes &&
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpenSubtable(!openSubtable)}
                        sx={styles.rowIconButton}
                    >
                        {openSubtable ? <KeyboardArrowUpIcon sx={styles.rowIcon}/> : <KeyboardArrowDownIcon sx={styles.rowIcon}/>}
                    </IconButton>
                }
            </TableCell>
            {
                v.subattributes ? 
                <TableCell></TableCell> 
                :
                <TableCell onKeyDown={handleKeyDown}>
                    {editMode ? 
                        <TextField 
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            name={k}
                            size="small"
                            defaultValue={v.value} 
                            onChange={(e) => handleChangeValue(e, idx)} 
                            onFocus={(event) => event.target.select()}
                        />
                        :
                        <span>
                            {v.value}&nbsp;
                            {isSelected && 
                                <IconButton sx={styles.rowIconButton} onClick={handleClickEditIcon}>
                                    <EditIcon sx={styles.rowIcon}/>
                                </IconButton>
                            }
                        </span>
                    }
                </TableCell>
            }
            <TableCell align="right">
                {
                    v.edited ? 
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
                    </p> :
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
        </TableRow>
        {
            v.subattributes &&
            <SubattributesTable 
                attributesList={v.subattributes}
                handleClickField={handleClickField}
                handleChangeValue={handleChangeValue}
                open={openSubtable}
                fullscreen={fullscreen}
                displayKeyIndex={displayKeyIndex}
                handleUpdateRecord={handleUpdateRecord}
                displayKeySubattributeIndex={displayKeySubattributeIndex}
                topLevelIdx={idx}
            />
        }
    </>
    )
}

interface SubattributesTableProps {
    attributesList: Attribute[];
    handleClickField: AttributesTableProps["handleClickField"];
    handleChangeValue: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void;
    open: boolean;
    topLevelIdx: number;
    fullscreen: string | null;
    displayKeyIndex: number;
    displayKeySubattributeIndex: number | null;
    handleUpdateRecord: () => void;
}

const SubattributesTable: FC<SubattributesTableProps> = (props) => {
    const { 
        attributesList,
        handleClickField,
        handleChangeValue,
        open,
        topLevelIdx,
        fullscreen,
        displayKeyIndex,
        displayKeySubattributeIndex,
        handleUpdateRecord
    } = props;

    return (
        <TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{ margin: 1 }}>
                <Typography variant="h6" gutterBottom component="div">
                    Properties
                </Typography>
                <Table size="small" aria-label="purchases" sx={styles.subattributesTable}>
                    <TableHead>
                    <TableRow>
                        <TableCell sx={styles.headerRow}>Field</TableCell>
                        <TableCell sx={styles.headerRow}>Value</TableCell>
                        <TableCell sx={styles.headerRow}>Confidence</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {attributesList.map((v: Attribute, idx: number) => (
                        <SubattributeRow 
                            key={`${v.key} ${idx}`}
                            k={v.key}
                            v={v}
                            handleClickField={handleClickField}
                            handleChangeValue={handleChangeValue}
                            fullscreen={fullscreen}
                            displayKeyIndex={displayKeyIndex}
                            handleUpdateRecord={handleUpdateRecord}
                            displayKeySubattributeIndex={displayKeySubattributeIndex}
                            idx={idx}
                            topLevelIdx={topLevelIdx}
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

interface SubattributeRowProps {
    k: string;
    v: Attribute;
    handleClickField: AttributesTableProps["handleClickField"];
    handleChangeValue: (event: React.ChangeEvent<HTMLInputElement>, topLevelIdx: number, isSubattribute: boolean, subIdx: number) => void;
    topLevelIdx: number;
    fullscreen: string | null;
    displayKeyIndex: number;
    displayKeySubattributeIndex: number | null;
    handleUpdateRecord: () => void;
    idx: number;
}

const SubattributeRow: FC<SubattributeRowProps> = (props) => { 
    const { 
        k, 
        v,
        handleClickField,
        handleChangeValue,
        topLevelIdx,
        fullscreen,
        displayKeyIndex,
        displayKeySubattributeIndex,
        handleUpdateRecord,
        idx
    } = props;

    const [ editMode, setEditMode ] = useState<boolean>(false);
    const [ isSelected, setIsSelected ] = useState<boolean>(false);

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
            else setEditMode(true);
        }
    }, undefined, undefined, undefined, true);

    useKeyDown("Escape", () => {
        if (isSelected) {
            if (editMode) finishEditing();
        }
    }, undefined, undefined, undefined);

    const handleClickInside = (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.stopPropagation();
        handleClickField(k, v.normalized_vertices, topLevelIdx, true, idx);
    }

    const handleDoubleClick = () => {
        setEditMode(true);
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
        handleChangeValue(event, topLevelIdx, true, idx);
    }

    const handleClickEditIcon = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        handleDoubleClick();
    }

    const finishEditing = () => {
        handleUpdateRecord();
        setEditMode(false);
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
            <TableCell onKeyDown={handleKeyDown}>
                {editMode ? 
                    <TextField 
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        name={k}
                        size="small" 
                        defaultValue={v.value} 
                        onChange={handleUpdateValue} 
                        onFocus={(event) => event.target.select()}
                    />
                    :
                    <span>
                        {v.value}&nbsp;
                        {isSelected && 
                            <IconButton sx={styles.rowIconButton} onClick={handleClickEditIcon}>
                                <EditIcon sx={styles.rowIcon}/>
                            </IconButton>
                        }
                    </span>
                }
            </TableCell>
            <TableCell>{formatConfidence(v.confidence)}</TableCell>
        </TableRow>
    )
}

export default AttributesTable;