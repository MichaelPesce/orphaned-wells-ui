import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, TableContainer } from '@mui/material';
import { Box, TextField, Collapse, Typography, IconButton } from '@mui/material';
import { formatConfidence, useKeyDown, useOutsideClick } from '../../assets/helperFunctions';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';

const styles = {
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
    }
}

export default function AttributesTable(props) {
    const { 
        attributesList,
        handleClickField,
        handleChangeValue,
        fullscreen,
        forceOpenSubtable,
        displayKeyIndex,
        displayKeySubattributeIndex,
        handleUpdateRecord 
    } = props
    const handleClickOutside = () => {
        handleClickField()
    }
    let ref = useOutsideClick(handleClickOutside);

    return (
        <TableContainer id="table-container" sx={styles.fieldsTable}>
            <Table stickyHeader size='small'>
                <TableHead sx={styles.tableHead}>
                    <TableRow >
                        <TableCell sx={styles.headerRow}>Field</TableCell>
                        <TableCell sx={styles.headerRow}>Value</TableCell>
                        <TableCell sx={styles.headerRow}>Confidence</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody ref={ref}>
                    {attributesList.map((v, idx) => (
                        <AttributeRow 
                            key={v.key+" "+idx}
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

function AttributeRow(props) { 
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
    } = props
    const [ editMode, setEditMode ] = useState(false)
    const [ openSubtable, setOpenSubtable ] = useState(false)
    const [ isSelected, setIsSelected ] = useState(false)

    useEffect(() => {
        // console.log("useeffect, displayKeyIndex === ")
        if (idx === displayKeyIndex && (displayKeySubattributeIndex === null || displayKeySubattributeIndex === undefined)) setIsSelected(true)
        else  {
            setIsSelected(false)
            if (editMode) finishEditing()
        }
    },[displayKeyIndex, displayKeySubattributeIndex])

    const handleClickInside = (e) => {
        e.stopPropagation()
        handleClickField(k, v.normalized_vertices, idx)
    }

    useKeyDown("Enter", () => {
        if (isSelected) {
            if (editMode) finishEditing()
            else setEditMode(true)
        }
    }, null, null, null, true)

    useKeyDown("Escape", () => {
        if (isSelected) {
            if (editMode) finishEditing()
        }
    }, null, null, null)

    useEffect(() => {
        if (forceOpenSubtable === idx) setOpenSubtable(true)
    }, [forceOpenSubtable])

    const handleDoubleClick = () => {
        setEditMode(true)
    }

    const handleKeyDown = (e) => {
        if (e.key === "ArrowLeft") {
            e.stopPropagation();
        }
        else if (e.key === "ArrowRight") {
            e.stopPropagation();
        }
    }

    const handleClickEditIcon = (e) => {
        e.stopPropagation()
        handleDoubleClick()
    }

    const finishEditing = () => {
        handleUpdateRecord()
        setEditMode(false)
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
            
            <TableCell>{formatConfidence(v.confidence)}</TableCell>
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

function SubattributesTable(props) {
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
    } = props

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
                    {attributesList.map(( v, idx ) => (
                        <SubattributeRow 
                            key={v.key+ " "+idx}
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

function SubattributeRow(props) { 
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
    } = props
    const [ editMode, setEditMode ] = useState(false)
    const [ isSelected, setIsSelected ] = useState(false)

    useEffect(() => {
        if (displayKeyIndex === topLevelIdx && idx===displayKeySubattributeIndex) {
            setIsSelected(true)
        } else {
            setIsSelected(false)
            if (editMode) finishEditing()
        }
    },[displayKeyIndex, topLevelIdx, displayKeySubattributeIndex])

    useKeyDown("Enter", () => {
        if (isSelected) {
            if (editMode) finishEditing()
            else setEditMode(true)
        }
    }, null, null, null, true)

    useKeyDown("Escape", () => {
        if (isSelected) {
            if (editMode) finishEditing()
        }
    }, null, null, null)

    const handleClickInside = (e) => {
        e.stopPropagation()
        handleClickField(k, v.normalized_vertices, topLevelIdx, true, idx)
    }

    const handleDoubleClick = () => {
        setEditMode(true)
    }

    const handleKeyDown = (e) => {
        if (e.key === "ArrowLeft") {
            e.stopPropagation();
        }
        else if (e.key === "ArrowRight") {
            e.stopPropagation();
        }
    }

    const handleUpdateValue = (event) => {
        handleChangeValue(event, topLevelIdx, true, idx)
    }

    const handleClickEditIcon = (e) => {
        e.stopPropagation()
        handleDoubleClick()
    }

    const finishEditing = () => {
        handleUpdateRecord()
        setEditMode(false)
    }

    return (
        <TableRow 
            key={k} 
            id={`${topLevelIdx}::${idx}`} 
            sx={isSelected ? {backgroundColor: "#EDEDED"} : {}}
            onClick={handleClickInside}
        >
            <TableCell sx={styles.fieldKey} >
            <span 
                style={isSelected ? {fontWeight:"bold"} : {}}
            >
                {k}
            </span>
            </TableCell>
            <TableCell onKeyDown={handleKeyDown} >
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