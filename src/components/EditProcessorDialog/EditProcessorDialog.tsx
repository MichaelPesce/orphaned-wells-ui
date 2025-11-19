import { useState } from 'react';
import { TextField, IconButton, Grid, Button, Dialog, DialogTitle, DialogContent, DialogContentText } from '@mui/material';
import { Stack, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { updateProcessor, uploadSampleImage } from '../../services/app.service';
import { callAPI } from '../../util';
import { MongoProcessor } from '../../types';
import ImageField from './ImageField';

interface EditProcessorDialogProps {
    open: boolean;
    onClose: () => void;
    setErrorMsg: (msg: string) => void;
    processorData: MongoProcessor
}

const EditProcessorDialog = ({ open, onClose, setErrorMsg, processorData }: EditProcessorDialogProps) => {
    const [processorName, setProcessorName] = useState(processorData.name);
    const [displayName, setDisplayName] = useState(processorData.displayName);
    const [processorId, setProcessorId] = useState(processorData.processorId);
    const [modelId, setModelId] = useState(processorData.modelId);
    const [documentType, setDocumentType] = useState(processorData.documentType);
    const [imageLink, setImageLink] = useState(processorData.img);
    const dialogHeight = '50vh';
    const dialogWidth = '40vw';

    const disableSaveButton = !processorName || !processorId || !modelId || !documentType;


    const styles = {
        dialogPaper: {
            minHeight: dialogHeight,
            minWidth: dialogWidth,
        },
        textfield: {
            marginBottom: 2
        },
    };


    const handleClose = () => {
        onClose();
    };

    const handleSaveChanges = () => {
        let body = {
            name: processorName,
            displayName,
            processorId,
            modelId,
            documentType,
            img: imageLink,
        };
        callAPI(
            updateProcessor,
            [body],
            updatedProcessor,
            handleError
        )
    };

    const updatedProcessor = (data: any) => {
        console.log("updated processor successfully")
        console.log(data)
        window.location.reload()
        onClose()
    };

    const handleError = (e: string) => {
        console.log("handle error:")
        console.log(e)
        setErrorMsg(e)
        onClose()
    }

    const handleUploadSampleImage = (file: File) => {
        console.log("uploading")
        console.log(file)
        const formData = new FormData();
        formData.append('file', file, file.name);
        callAPI(
            uploadSampleImage,
            [formData, processorName],
            successfulUpload,
            failedUpload,
        )
    }

    const successfulUpload = (data: any) => {
        console.log("success:")
        console.log(data)
        setImageLink(data.url)
    }

    const failedUpload = (data: any) => {
        console.log("error on upload")
        console.log(data)
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            scroll={"paper"}
            aria-labelledby="edit-schema-dialog"
            aria-describedby="edit-schema-dialog-description"
            PaperProps={{
                sx: {
                display: 'flex',
                flexDirection: 'column',
                }
            }}

        >
            <DialogTitle id="edit-schema-dialog-title"><b>Edit {processorData.name}</b></DialogTitle>
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
            <DialogContent dividers={true} sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <DialogContentText
                    id="scroll-dialog-description"
                    tabIndex={-1}
                    aria-labelledby="edit-schema-dialog-content-text"
                    component={'span'}
                >
                    <Grid container>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Display Name"
                                variant="outlined"
                                value={displayName}
                                onChange={(event) => setDisplayName(event.target.value)}
                                sx={styles.textfield}
                                id="processor-name-textbox"
                            />
                            <TextField
                                fullWidth
                                label="Processor ID"
                                variant="outlined"
                                value={processorId}
                                onChange={(event) => setProcessorId(event.target.value)}
                                sx={styles.textfield}
                                id="processor-name-textbox"
                            />
                            <TextField
                                fullWidth
                                label="Model ID"
                                variant="outlined"
                                value={modelId}
                                onChange={(event) => setModelId(event.target.value)}
                                sx={styles.textfield}
                                id="processor-name-textbox"
                            />
                            <TextField
                                fullWidth
                                label="Document Type"
                                variant="outlined"
                                value={documentType}
                                onChange={(event) => setDocumentType(event.target.value)}
                                sx={styles.textfield}
                                id="processor-name-textbox"
                            />
                            <ImageField
                                label="Sample Image"
                                value={imageLink}
                                onChange={handleUploadSampleImage}
                            />
                            {/* <TextField
                                fullWidth
                                label="Sample Image"
                                variant="outlined"
                                value={imageLink}
                                onChange={(event) => setImageLink(event.target.value)}
                                sx={styles.textfield}
                                id="processor-name-textbox"
                            /> */}
                        </Grid>

                        
                    </Grid>
                </DialogContentText>
                <Box sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-around">
                    <Button
                        variant="contained"
                        disabled={disableSaveButton}
                        onClick={handleSaveChanges}
                    >
                        Save changes
                    </Button>
                    </Stack>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

export default EditProcessorDialog;