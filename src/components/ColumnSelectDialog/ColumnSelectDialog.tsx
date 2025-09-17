import { useEffect, useState } from 'react';
import { Box, FormLabel, FormControl, IconButton, FormGroup, FormControlLabel, Grid, Tooltip } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogContentText, Button, Checkbox, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { callAPI, convertFiltersToMongoFormat } from '../../util';
import { downloadRecords, getColumnData } from '../../services/app.service';
import { ColumnSelectDialogProps, CheckboxesGroupProps, ExportTypeSelectionProps } from '../../types';
import CircularProgress from '@mui/material/CircularProgress';
import ErrorBar from '../ErrorBar/ErrorBar';

const ColumnSelectDialog = (props: ColumnSelectDialogProps) => {
    const { open, onClose, location, handleUpdate, _id, appliedFilters, sortBy, sortAscending } = props;

    const [columns, setColumns] = useState<string[]>([]);
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
    const [downloading, setDownloading] = useState(false);
    const [objSettings, setObjSettings] = useState<any>()
    const [errorMsg, setErrorMsg] = useState<string | null>("")
    const [ exportTypes, setExportTypes ] = useState<{ [key: string]: boolean }>(
        {
            'csv': true,
            'json': false,
            'image_files': false
        }
    )
    const [name, setName] = useState("")
    const dialogHeight = '85vh';
    const dialogWidth = '60vw';

    useEffect(() => {
        if (open) {
            callAPI(
                getColumnData,
                [location, _id],
                setDefaultColumns,
                handleFailedGetColumnData
            );
        }
        
    }, [open]);

    const styles = {
        dialogPaper: {
            minHeight: dialogHeight,
            maxHeight: dialogHeight,
            minWidth: dialogWidth,
            maxWidth: dialogWidth,
        },
        dialogContent: {
            position: "relative",
            paddingBottom: "70px"
        },
        dialogButtons: {
            paddingTop: "70px"
        },
        loader: {
            position: 'absolute',
            right: '50%',
            top: '50%',
        },
        closeIcon: {
            position: 'absolute',
            right: 0,
            top: 8,
        }
    };

    const setDefaultColumns = (data: {columns: string[], obj: any}) => {
        let temp_columns = data.columns;
        setColumns(temp_columns)
        if (data.obj.settings && data.obj.settings.exportColumns) {
            setSelectedColumns([...data.obj.settings.exportColumns]);
        } else {
            setSelectedColumns([...temp_columns]);
        }
        setObjSettings(data.obj.settings)
        setName(data.obj.name)
    }

    const handleClose = () => {
        onClose();
    };

    const handleExport = () => {
        const body = {
            columns: selectedColumns,
            sort: [sortBy, sortAscending],
            filter: convertFiltersToMongoFormat(appliedFilters),
        };
        setDownloading(true)
        callAPI(
            downloadRecords,
            [location, _id, exportTypes, name, body],
            handleSuccessfulExport,
            handleFailedExport,
            false // this argument indicates that the response is NOT json (ie it is blob)
        );

    };

    const handleSuccessfulExport = (data: Blob) => {
        handleClose();
        setDownloading(false)
        const href = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = href;
        link.setAttribute('download', `${name}_records.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // update project settings to include selected columns
        let settings;
        if (objSettings)  {
            settings = objSettings
            settings["exportColumns"] = selectedColumns
        } else {
            settings = {exportColumns: selectedColumns}
        }
        handleUpdate({"settings": settings})
    };

    const handleFailedExport = (e: string) => {
        setDownloading(false)
        setErrorMsg("unable to export: " + e)
    };

    const handleFailedGetColumnData = (e: string) => {
        setErrorMsg("failed to get column data: " + e)
    };

    const handleChangeExportTypes = (name: string) => {
        let tempExportTypes = {...exportTypes}
        tempExportTypes[name] = !tempExportTypes[name]
        setExportTypes(tempExportTypes)
    };

    const disableDownload = () => {
        if (downloading) return true
        for (let each of Object.keys(exportTypes)) {
            if (exportTypes[each]) return false
        }
        return true
    }

    return (
        <Dialog
            open={open}
            onClose={!downloading ? handleClose : undefined} // if downloading, must click x to close dialog
            scroll={"paper"}
            aria-labelledby="export-dialog"
            aria-describedby="export-dialog-description"
            PaperProps={{
                sx: styles.dialogPaper
            }}
        >
            <DialogTitle id="export-dialog-title">Export {location.replace("_"," ")}</DialogTitle>
            <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={styles.closeIcon}
            >
                <CloseIcon />
            </IconButton>
            <DialogContent dividers={true}>
                {
                    downloading && 
                    <CircularProgress 
                        sx={styles.loader}
                    />
                }
                
                <DialogContentText
                    id="scroll-dialog-description"
                    tabIndex={-1}
                    aria-labelledby="export-dialog-content-text"
                    component={'span'}
                >
                    <ExportTypeSelection
                        exportTypes={exportTypes}
                        updateExportTypes={handleChangeExportTypes}
                        disabled={downloading}
                    />
                    <CheckboxesGroup
                        columns={columns}
                        selected={selectedColumns}
                        setSelected={setSelectedColumns}
                        disabled={downloading}
                    />
                </DialogContentText>
            </DialogContent>
                <div style={styles.dialogButtons}> 
                    <Button
                        variant="contained"
                        sx={{
                            position: 'absolute',
                            right: 10,
                            bottom: 10,
                        }}
                        startIcon={<DownloadIcon/>}
                        onClick={handleExport}
                        id='download-button'
                        disabled={disableDownload()}
                    >
                        Export Data
                    </Button>
                </div>
                <ErrorBar
                    errorMessage={errorMsg}
                    setErrorMessage={setErrorMsg}
                />
                
        </Dialog>
    );
};

const ExportTypeSelection = (props: ExportTypeSelectionProps) => {
    const { exportTypes, updateExportTypes, disabled } = props;

    const handleChangeExportTypes = (event: React.ChangeEvent<HTMLInputElement>) => {
        let name = event.target.name
        updateExportTypes(name)
    };

    return (
        <Box >
            <FormControl sx={{ mx: 3 }} component="fieldset" variant="standard" required disabled={disabled}>
                <FormLabel component="legend" id="export-type-label">Export Format</FormLabel>
                
                <FormGroup>
                    <Stack direction='row'>
                    {Object.entries(exportTypes).map(([ export_type, is_selected] ) => (
                        <FormControlLabel
                            key={export_type}
                            control={
                                <Checkbox checked={is_selected} onChange={handleChangeExportTypes} name={export_type} />
                            }
                            label={export_type.replace('_', ' ')}
                        />
                    ))}
                    </Stack>
                    
                    
                </FormGroup>
            </FormControl>
        </Box>
    );
};

const CheckboxesGroup = (props: CheckboxesGroupProps) => {
    const { columns, selected, setSelected, disabled } = props;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const isSelected = event.target.checked;
        const attr = event.target.name;
        const tempSelected = [...selected];
        if (isSelected) {
            tempSelected.push(attr);
        } else {
            const index = tempSelected.indexOf(attr);
            if (index > -1) {
                tempSelected.splice(index, 1);
            }
        }
        setSelected(tempSelected);
    };

    const selectAll = () => {
        if (selected.length < columns.length) setSelected([...columns])
        else setSelected([])
    }

    const getSubfieldTooltipText = (name: string) => {
        const splitName = name?.split("::")
        if (splitName?.length === 2) {
            const parentName = splitName[0]
            const childName = splitName[1]
            const text = `${childName} from table ${parentName}`;
            return text;
        }
        return null;
    }

    return (
        <Box >
            <FormControl sx={{ m: 3 }} component="fieldset" variant="standard" required disabled={disabled}>
                <FormLabel component="legend">Select attributes to export</FormLabel>
                <FormGroup row>
                    <FormControlLabel
                        control={
                            <Checkbox checked={selected.length === columns.length} indeterminate={selected.length < columns.length && selected.length > 0} onChange={selectAll}/>
                        }
                        label={<b>Select All</b>}
                    />
                </FormGroup>
                <FormGroup row>
                    <Grid container columnSpacing={3}>
                        {columns.map((column: string, colIdx: number) => (
                            <Grid
                                key={`${colIdx}_${column}`}
                                item
                                xs={6}
                                sx={{overflowX: "hidden"}}
                            >
                                <FormControlLabel
                                    control={
                                        <Checkbox checked={selected.includes(column)} onChange={handleChange} name={column} />
                                    }
                                    label={
                                        <Tooltip title={column?.includes("::") ? getSubfieldTooltipText(column) : null}>
                                            <span>{column}</span>
                                        </Tooltip>
                                    }
                                />
                            </Grid>
                        ))}
                    </Grid>
                </FormGroup>
            </FormControl>
        </Box>
    );
};

export default ColumnSelectDialog;