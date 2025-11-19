import { useState } from 'react';
import { useParams } from "react-router-dom";
import { Grid, Box, Modal, IconButton, Button, Stack, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { FileUploader } from "react-drag-drop-files";
import { UploadProcessorProps } from '../../types';

const UploadProcessorDialog = (props: UploadProcessorProps) => {
    const params = useParams<{ id: string }>();
    const { setShowModal, handleUploadDocument } = props;
    const [ showWarning, setShowWarning ] = useState(false);
    const [ warningMessage, setWarningMessage ] = useState("");
    const [ file, setFile ] = useState<File | null>(null);
    const maxFileSize = 10;
    const fileTypes: string[] = ["csv"];

    const [name, setName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [processorId, setProcessorId] = useState("");
    const [modelId, setModelId] = useState("");
    const [documentType, setDocumentType] = useState("");
    const [imageLink, setImageLink] = useState("");


    const disabled = !file || !modelId || !processorId || !name || !displayName || !documentType;

    const styles = {
        modalStyle: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            minWidth: 650,
            maxWidth: 650,
            // maxWidth: '80vw',
            bgcolor: 'background.paper',
            border: '1px solid #AEAEAE',
            borderRadius: 2,
            boxShadow: 24,
            p: 2,
            maxHeight: '75vh',
            overflow: 'scroll',
            overflowX: 'hidden'
        },
        header: {
            marginTop: 5
        },
        button: {
            borderRadius: '8px', 
            width: 200,
        },
        sampleFile: {
            textDecoration: "none",
            fontWeight: "bold",
            cursor: 'pointer'
        },
        fileUploaderBox: {
            border: showWarning ? '2px dashed #E07174' : '2px dashed black',
            borderRadius: 2,
            p: 3,
            cursor: "pointer",
            backgroundColor: showWarning ? '#FDF7F7' : 'white',
        },
        uploadIcon: {
            color: showWarning ? "#D3242F" : "#2196F3",
            paddingBottom: 3
        },
        uploadContainerBox: {
            display: 'flex', 
            justifyContent: 'center'
        },
        uploadContainerItem: {
            display: 'flex', 
            justifyContent: 'center'
        },
        processorDeploymentText: {
            margin:'10px'
        },
        textbox: {
            margin: "8px"
        }
    };

    const handleClose = () => {
        setShowModal(false);
    };

    const handleClickUpload = () => {
        if (file === null) {
            setWarningMessage("Please upload a valid file");
            setShowWarning(true);
            setTimeout(() => {
                setShowWarning(false);
            }, 5000);
        } else {
            handleUploadDocument(file, name, displayName, processorId, modelId, documentType);
            setShowWarning(false);
            setShowModal(false);
        }
    };

    const fileTypeError = () => {
        setWarningMessage("Unsupported file type");
        setShowWarning(true);
    };

    const fileSizeError = () => {
        setWarningMessage("File too large");
        setShowWarning(true);
    };

    const fileUploaderContainer = () => {
        return (
            <Box sx={styles.fileUploaderBox}>
                <Box sx={styles.uploadContainerBox}>
                    <IconButton sx={styles.uploadIcon}>
                        <UploadFileIcon/>
                    </IconButton>
                </Box>
                <Box sx={styles.uploadContainerBox}>
                    <h3 style={{marginTop: 0, paddingTop: 0, color: "#2196F3", textDecoration: "underline"}}>Browse files</h3>
                </Box>
                <Box sx={styles.uploadContainerBox}>
                    <p style={{marginTop: 0, paddingTop: 0}}>or Drag and Drop File</p>
                </Box>
                {showWarning && 
                    <Box sx={styles.uploadContainerBox}>
                        <p style={{marginTop: 0, paddingTop: 0, color: "#AD3244", fontWeight: "bold"}}>{warningMessage}</p>
                    </Box>
                }
                <Box sx={styles.uploadContainerBox}>
                    <p style={{margin: 0, padding: 0, color: "#9B9B9B"}}>Choose from supported files:</p>
                </Box>
                <Box sx={styles.uploadContainerBox}>
                    <p style={{marginTop: 0, paddingTop: 0, color: "#9B9B9B"}}>
                        {fileTypes.map((v, i) => {
                            if (i === fileTypes.length - 1) return "or " + v.toUpperCase() + ` (max ${maxFileSize}MB)`;
                            else return v.toUpperCase() + ", ";
                        })}
                    </p>
                </Box>
                <Box sx={styles.uploadContainerBox}>
                    <p style={{margin: 0, padding: 0}}>{file === null ? "" : file.name}</p>
                </Box>
            </Box>
        );
    };

    const DragDrop = () => {
        const handleChange = (file: File) => {
            setWarningMessage("");
            setShowWarning(false);
            setFile(file);
        };
        return (
            <FileUploader 
                handleChange={handleChange} 
                name="file" 
                types={fileTypes}
                children={fileUploaderContainer()}
                onTypeError={fileTypeError}
                onSizeError={fileSizeError}
                maxSize={maxFileSize}
            />
        );
    };

    return (
        <Modal
            open={true}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Grid container sx={styles.modalStyle} spacing={1}>
                <Grid item xs={3}>
                    
                </Grid>
                <Grid item xs={6}>
                    <Box sx={{display: 'flex', justifyContent: 'center'}}>
                        <h2 style={styles.header}>Upload processor</h2>
                    </Box>
                </Grid>
                <Grid item xs={3}>
                    <Box sx={{display: 'flex', justifyContent: 'flex-end', marginRight: '10px'}}>
                        <IconButton onClick={handleClose}><CloseIcon/></IconButton>
                    </Box>
                </Grid>
                
                    
                        <Grid item xs={12}>
                            
                            {DragDrop()}
                        </Grid>
                    <Grid item xs={12}>
                    
                    <Stack direction={'column'}>
                        <Stack direction={'row'}>
                            <TextField
                                sx={styles.textbox}
                                fullWidth
                                label="Processor Name"
                                variant="outlined"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                id="processor-name-textbox"
                            />
                            <TextField
                                sx={styles.textbox}
                                fullWidth
                                label="Processor Display Name"
                                variant="outlined"
                                value={displayName}
                                onChange={(event) => setDisplayName(event.target.value)}
                                id="processor-display-name-textbox"
                            />
                        </Stack>
                        <Stack direction={'row'}>
                            <TextField
                                sx={styles.textbox}
                                fullWidth
                                label="Google Processor ID"
                                variant="outlined"
                                value={processorId}
                                onChange={(event) => setProcessorId(event.target.value)}
                                id="processor-id-textbox"
                            />
                            <TextField
                                sx={styles.textbox}
                                fullWidth
                                label="Primary Model ID"
                                variant="outlined"
                                value={modelId}
                                onChange={(event) => setModelId(event.target.value)}
                                id="model-id-textbox"
                            />
                        </Stack>
                        <Stack direction={'row'}>
                            <TextField
                                sx={styles.textbox}
                                fullWidth
                                label="Document Type"
                                variant="outlined"
                                value={documentType}
                                onChange={(event) => setDocumentType(event.target.value)}
                                id="document-type-textbox"
                            />
                            {/* <TextField
                                disabled
                                sx={styles.textbox}
                                fullWidth
                                label="Sample Image"
                                variant="outlined"
                                value={imageLink}
                                onChange={(event) => setImageLink(event.target.value)}
                                id="image-link-textbox"
                            /> */}
                        </Stack>
                        

                    </Stack>
                        
                    </Grid>
                    <Grid item xs={12}>
                        <Box sx={{display: "flex", justifyContent: "space-around"}}>
                            <Button variant="contained" style={styles.button} onClick={handleClickUpload} disabled={disabled}>
                                Upload File
                            </Button>
                        </Box>
                    </Grid>
                    
                
            </Grid>
            
        </Modal>
    );
};

export default UploadProcessorDialog;

