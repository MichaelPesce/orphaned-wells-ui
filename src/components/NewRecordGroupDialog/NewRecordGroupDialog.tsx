import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { Box, TextField, IconButton, Grid, Button, Tooltip } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, DialogContentText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { addRecordGroup, getProcessors } from '../../services/app.service';
import { callAPI } from '../../util';
import { MongoProcessor as Processor } from '../../types';
import ErrorBar from '../ErrorBar/ErrorBar';

interface NewRecordGroupDialogProps {
    open: boolean;
    onClose: () => void;
    project_id: string;
}

const NewRecordGroupDialog = ({ open, onClose, project_id }: NewRecordGroupDialogProps) => {
    const navigate = useNavigate();
    const [recordGroupName, setRecordGroupName] = useState("");
    const [recordGroupDescription, setRecordGroupDescription] = useState("");
    const [processors, setProcessors] = useState<Processor[]>([])
    const [selectedProcessor, setSelectedProcessor] = useState<Processor>({} as Processor);
    const [disableCreateButton, setDisableCreateButton] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const dialogHeight = '85vh';
    const dialogWidth = '60vw';
    const defaultProcessorPath = `${process.env.PUBLIC_URL}/img/Default Extractor.png`

    const descriptionElementRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (open) {
            const { current: descriptionElement } = descriptionElementRef;
            if (descriptionElement !== null) {
                descriptionElement.focus();
            }
        }
    }, [open]);

    useEffect(() => {
        if (recordGroupName !== "" && selectedProcessor['processorId'] && disableCreateButton) {
            setDisableCreateButton(false);
        } else if ((recordGroupName === "" || !selectedProcessor['processorId']) && !disableCreateButton) {
            setDisableCreateButton(true);
        }
    }, [recordGroupName, selectedProcessor]);

    useEffect(() => {
        if (open) {
            callAPI(
                getProcessors,
                [],
                handleSuccessGetProcessors,
                (e: Error) => console.error('error on getting processors ', e)
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
        recordGroupName: {
            marginBottom: 2
        },
        processorGridItem: {
            paddingX: 1,
            paddingBottom: 5
        },
        processorTextBox: {
            display: "flex",
            justifyContent: "center",
        },
        processorImageBox: {
            display: "flex",
            justifyContent: "center",
            cursor: "pointer",
        },
        processorImage: {
            maxHeight: "20vh"
        }
    };

    const handleSuccessGetProcessors = (processor_data: Processor[]) => {
        setProcessors(processor_data)
    }

    const handleClose = () => {
        onClose();
    };

    const handleSelectProcessor = (processorData: Processor) => {
        if (selectedProcessor['processorId'] === processorData['processorId']) setSelectedProcessor({ } as Processor);
        else {
            setSelectedProcessor(processorData);
        }
    };

    const getImageStyle = (processorId: string): React.CSSProperties => {
        let styling: React.CSSProperties = { ...styles.processorImage };
        if (selectedProcessor['processorId'] === processorId) {
            styling["border"] = "1px solid #2196F3";
        }
        return styling;
    };

    const handleCreateRecordGroup = () => {
        let body = {
            name: recordGroupName,
            description: recordGroupDescription,
            history: [],
            documentType: selectedProcessor.documentType || selectedProcessor["name"],
            processorId: selectedProcessor['processorId'],
            project_id: project_id,
        };
        callAPI(
            addRecordGroup,
            [body],
            handleSuccessfulRecordGroupCreation,
            (e: string) => setErrorMsg(e)
            // (e: Error) => console.error('error on recordGroup add ', e)
        );
    };

    const handleSuccessfulRecordGroupCreation = (new_id: string) => {
        setTimeout(() => {
            navigate('/record_group/'+new_id)
        }, 500);
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            scroll={"paper"}
            aria-labelledby="new-dg-dialog"
            aria-describedby="new-dg-dialog-description"
            PaperProps={{
                sx: styles.dialogPaper
            }}
        >
            <DialogTitle id="new-dg-dialog-title">New Record Group</DialogTitle>
            <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{
                    position: 'absolute',
                    right: 0,
                    top: 8,
                }}
            >
                <CloseIcon />
            </IconButton>
            <DialogContent dividers={true}>
                <DialogContentText
                    id="scroll-dialog-description"
                    ref={descriptionElementRef}
                    tabIndex={-1}
                    aria-labelledby="new-dg-dialog-content-text"
                    component={'span'}
                >
                    <Grid container>
                        <Grid item xs={5}>
                            <TextField
                                fullWidth
                                label="Record Group Name"
                                variant="outlined"
                                value={recordGroupName}
                                onChange={(event) => setRecordGroupName(event.target.value)}
                                sx={styles.recordGroupName}
                                id="dg-name-textbox"
                            />
                            <TextField
                                fullWidth
                                label="Description"
                                variant="outlined"
                                value={recordGroupDescription}
                                onChange={(event) => setRecordGroupDescription(event.target.value)}
                                multiline
                                rows={4}
                            />
                        </Grid>

                        <Grid item xs={2}></Grid>
                        <Grid item xs={5}></Grid>

                        <Grid item xs={12}>
                            <h4>
                                Select document type
                            </h4>
                            <p>
                                Select from following document types of well completion records.
                                Data extraction will work best with one of the following document types.
                            </p>
                        </Grid>
                        <Grid item xs={12}>
                            <Grid container>
                                {processors.map((processorData, idx) => {
                                    if (processorData.processorId && processorData.modelId)
                                    return (
                                        <Grid key={idx} item xs={4} sx={styles.processorGridItem}>
                                            <p style={styles.processorTextBox}>
                                                {idx + 1}. {processorData['name']}
                                            </p>
                                            <Box sx={styles.processorImageBox} onClick={() => handleSelectProcessor(processorData)}>
                                                <Tooltip title={processorData.documentType}>
                                                    <img 
                                                        id={`processor_${idx}`}
                                                        src={`${process.env.PUBLIC_URL}/img/${processorData['name']}.png`}
                                                        style={getImageStyle(processorData['processorId'])}
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = defaultProcessorPath;
                                                        }}
                                                    />
                                                </Tooltip>
                                            </Box>
                                        </Grid>
                                    )
                                })}
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContentText>
                <Button
                    variant="contained"
                    sx={{
                        position: 'absolute',
                        right: 10,
                        bottom: 10,
                    }}
                    disabled={disableCreateButton}
                    onClick={handleCreateRecordGroup}
                >
                    Create Record Group
                </Button>
            </DialogContent>
            <ErrorBar
                errorMessage={errorMsg}
                setErrorMessage={setErrorMsg}
            />
        </Dialog>
    );
}

export default NewRecordGroupDialog;