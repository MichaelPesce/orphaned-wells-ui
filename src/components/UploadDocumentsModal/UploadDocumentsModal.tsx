import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { Grid, Box, Modal, IconButton, Button, Switch, FormControlLabel, Badge, CircularProgress, Stack, Tooltip } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FileUploader } from "react-drag-drop-files";
import { UploadDocumentsModalProps } from '../../types';
import UploadDirectory from './UploadDirectory';
import { checkProcessorStatus, deployProcessor, undeployProcessor } from '../../services/app.service';
import { callAPI } from '../../util';

const UploadDocumentsModal = (props: UploadDocumentsModalProps) => {
    const params = useParams<{ id: string }>();
    const { setShowModal, handleUploadDocument } = props;
    const [ showWarning, setShowWarning ] = useState(false);
    const [ warningMessage, setWarningMessage ] = useState("");
    const [ file, setFile ] = useState<File | null>(null);
    const [uploadDirectory, setUploadDirectory] = useState<string>()
    const [uploadDirectoryFiles, setUploadDirectoryFiles ] = useState<any>([])
    const [ runCleaningFunctions, setRunCleaningFunctions ] = useState(true);
    const [ processorState, setProcessorState ] = useState(10)
    const [ uploadingDirectory, setUploadingDirectory ] = useState(false)
    const maxFileSize = 10;
    const fileTypes: string[] = ["tiff", "tif", "pdf", "png", "jpg", "jpeg", "zip"];
    const validFileTypes = ['image/png', 'application/pdf', 'image/tiff', 'image/jpeg']
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        callAPI(
            checkProcessorStatus,
            [params.id],
            (data) => handleCheckedProcessorStatus(data),
            (e, status) => console.error(e)
        );
    }, [params.id])

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
            p: 8,
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
        }
    };

    const handleCheckedProcessorStatus = (state: number) => {
        setProcessorState(state)
    }

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
            handleUploadDocument(file, runCleaningFunctions, true);
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

    const handleChooseDirectory = (e: ChangeEvent<HTMLInputElement>) => {
        handleDirectoryInput(e.target.files)
        setShowWarning(false);
    }

    const handleBack = () => {
        setUploadDirectory(undefined)
        setUploadDirectoryFiles([])
        setFile(null)
    }

    const handleDirectoryInput = (f: FileList | null) => {
        let files = f || [] as any
        let validFiles = []
        let directoryName
        // console.log(`handling ${files.length} files`)
        for (let file of files) {
            if (validFileTypes.includes(file.type)) {
                validFiles.push(file)
            }
        }
        // console.log(`found ${validFiles.length} valid document files`)
        if (files && files.length && files.length > 0) {
            let filePath = files[0].webkitRelativePath
            let splitPath = filePath.split('/')
            directoryName = splitPath[0]
        }
        setUploadDirectory(directoryName)
        setUploadDirectoryFiles(validFiles)
    }

    const handleDeployProcessor = () => {
        let apiFunc;
        if (processorState === 1) {
            apiFunc = undeployProcessor
        }
        else if (processorState === 3) {
            apiFunc = deployProcessor
        }
        else return
        callAPI(
            apiFunc,
            [params.id],
            (data) => handleSuccessfulDeploy(data),
            (data) => handleFailedDeploy(data),
        )
    }

    const handleSuccessfulDeploy = (response: number) => {
        if (response) setProcessorState(response)
    }

    const handleFailedDeploy = (response: any) => {
        console.error('failed to deploy')
        if (response) setProcessorState(response)
    }

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
                disabled={processorState > 1}
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
                {/** TODO: convert the below 3 items to a stack? */}
                <Grid item xs={3}>
                    {uploadDirectory && 
                        <Box sx={{display: 'flex', justifyContent: 'flex-start', marginLeft: '10px'}}>
                            <IconButton onClick={handleBack}><ArrowBackIcon/></IconButton>
                        </Box>
                    }
                </Grid>
                <Grid item xs={6}>
                    <Box sx={{display: 'flex', justifyContent: 'center'}}>
                        <h2 style={styles.header}>Upload document(s)</h2>
                    </Box>
                </Grid>
                <Grid item xs={3}>
                    <Box sx={{display: 'flex', justifyContent: 'flex-end', marginRight: '10px'}}>
                        <IconButton onClick={handleClose}><CloseIcon/></IconButton>
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <Stack direction={'row'} justifyContent={'space-between'}>
                        <span style={styles.processorDeploymentText}>
                        Processor status: &nbsp; 
                            {
                                processorState > 3 ? (
                                    <span>
                                         <CircularProgress color='primary' size='16px'/>
                                    </span>
                                )
                                : 
                                processorState === 3 ? (
                                    <span>
                                         &nbsp;
                                        <Badge color="error" variant="dot"/>
                                        &nbsp;
                                        undeployed
                                    </span>
                                )
                                : 
                                processorState === 2 ? (
                                    <span>
                                         &nbsp;
                                        <Badge color="warning" variant="dot"/>
                                        &nbsp;
                                        deploying
                                    </span>
                                )
                                : (
                                    <span>
                                         &nbsp;
                                        <Badge color="secondary" variant="dot"/>
                                        &nbsp;
                                        deployed
                                    </span>
                                )
                            }
                        </span>
                        <span>
                            <Button 
                                variant='outlined' 
                                endIcon={<RocketLaunchIcon/>} 
                                disabled={processorState > 3 || processorState === 2 || uploadingDirectory}
                                onClick={handleDeployProcessor}    
                            >
                                {processorState === 1 ? 'Undeploy' : 'Deploy'} Processor
                            </Button>
                        </span>
                    </Stack>
                    
                        
                </Grid>
                {uploadDirectory ? 
                    <UploadDirectory
                        setShowModal={setShowModal}
                        directoryName={uploadDirectory}
                        directoryFiles={uploadDirectoryFiles}
                        runCleaningFunctions={runCleaningFunctions}
                        setRunCleaningFunctions={setRunCleaningFunctions}
                        uploading={uploadingDirectory}
                        setUploading={setUploadingDirectory}
                    />  :
                    <>
                        <Tooltip title={processorState > 1 && 'Processor must be deployed to upload files'}>
                            <Grid item xs={12}>
                                
                                {DragDrop()}
                            </Grid>
                        </Tooltip>
                        <Grid item xs={12}>
                        <input
                            ref={inputRef}
                            type="file"
                            onChange={handleChooseDirectory}
                            style={{ display: "none" }}
                            multiple
                            {...{ webkitdirectory: '', mozdirectory: '', directory: '' }}
                        />
                        <Box style={{display: "flex", justifyContent: "center"}}>
                        </Box>
                            
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{display: "flex", justifyContent: "space-around", marginBottom: 1}}>
                                <FormControlLabel 
                                    control={<Switch/>} 
                                    label="Run cleaning functions" 
                                    onChange={(e: any) => setRunCleaningFunctions(e.target.checked)}
                                    checked={runCleaningFunctions}
                                />
                            </Box>
                            <Box sx={{display: "flex", justifyContent: "space-around"}}>
                                <Button variant="contained" style={styles.button} onClick={handleClickUpload} disabled={file === null}>
                                    Upload File
                                </Button>
                                <p style={{display: 'flex', margin:0, alignItems: 'center'}}>or</p>
                                <Button variant="outlined" style={styles.button} onClick={() => inputRef.current?.click()} disabled={processorState > 1}>
                                    Choose Directory
                                </Button>
                            </Box>
                        </Grid>
                    </>
                }
                
            </Grid>
            
        </Modal>
    );
};

export default UploadDocumentsModal;

