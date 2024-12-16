import { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import { useUserContext } from '../../usercontext';
import { Grid, Box, Button, Stack, FormControlLabel, Switch, Tooltip } from '@mui/material';
import { UploadDirectoryProps } from '../../types';
import { uploadDocument } from '../../services/app.service';
import { callAPI } from '../../assets/util';
import CircularProgress from '@mui/material/CircularProgress';

const UploadDirectory = (props: UploadDirectoryProps) => {
    const params = useParams<{ id: string }>();
    const { userEmail } = useUserContext();
    const { directoryName, directoryFiles } = props;
    const [ uploading, setUploading ] = useState(false)
    const [ finishedUploading, setFinishedUploading ] = useState(false)
    const [ uploadedAmt, setUploadedAmt ] = useState(0)
    const [ progress, setProgress ] = useState(0)
    const [ preventDuplicates, setPreventDuplicates ] = useState(true)
    const [ uploadedFiles, setUploadedFiles ] = useState<string[]>([])
    const [ duplicateFiles, setDuplicateFiles ] = useState<string[]>([])
    const [ errorFiles, setErrorFiles ] = useState<string[]>([])

    useEffect(() => {
        if (uploadedAmt === directoryFiles.length) {
            setFinishedUploading(true)
            // setTimeout(()=> {
            //     window.location.reload()
            // },3000)
        }
        try {
            if (directoryFiles.length!== 0) {
                setProgress( (uploadedAmt / directoryFiles.length) * 100)
            }
        } catch(e) {
            setProgress(0)
        }
    },[uploadedAmt])

    const styles = {
        button: {
            borderRadius: '8px', 
            width: 200,
        },
        stack: {
            height: '30vh',
            overflow: 'scroll',
            boxShadow: 1,
            padding: 2
        }
    };

    const upload = () => {
        setUploading(true)
        directoryFiles.map((file) => {
            let formData = new FormData();
            formData.append('file', file, file.name);
            callAPI(
                uploadDocument,
                [formData, params.id, userEmail, false, preventDuplicates],
                () => handleSuccessfulDocumentUpload(file),
                (e, status) => handleAPIErrorResponse(file, status)
            );
        })
    }

    const handleSuccessfulDocumentUpload = (file: File) => {
        setUploadedFiles((uploadedFiles) => [...uploadedFiles, file.name]);
        setUploadedAmt((uploadedAmt) => uploadedAmt+1)
    }

    const handleAPIErrorResponse = (file: File, status_code?: number) => {
        if (status_code === 208) {
            // this document has already been processed
            setUploadedFiles((uploadedFiles) => [...uploadedFiles, file.name]);
            setDuplicateFiles((duplicateFiles) => [...duplicateFiles, file.name]);
        } else {
            console.error(`error uploading ${file.name} with status code ${status_code}`)
            setErrorFiles((errorFiles) => [...errorFiles, file.name]);
        }
        setUploadedAmt((uploadedAmt) => uploadedAmt+1)
    }

    const handlePreventDuplicates = (e: any) => {
        setPreventDuplicates(e.target.checked);
    }

    const formatFileName = (filename: string) => {
        // todo: format files that were duplicates (or errored out) differently
        let style = {
            color: 'black'
        }
        // if (errorFiles.includes(filename)) style.color = 'red'
        // if (duplicateFiles.includes(filename)) style.color = 'blue'
        if (uploadedFiles.includes(filename)) return <s style={style}>{`- ${filename}`}</s> 
        else return `- ${filename}`
    }

    return (
        <Grid container>
            <Grid item xs={12}>
                <p>Upload {directoryFiles.length} files from the directory <i>{directoryName}</i>:</p>
            </Grid>
            <Grid item xs={12}>
                <Stack direction='column' sx={styles.stack}>
                    {directoryFiles.map((file) =>  (
                        <p style={{margin: 3}} key={file.name}>
                            {formatFileName(file.name)}
                        </p>
                    ))}
                </Stack>
            </Grid>
            <Grid item xs={12}>
                <Box sx={{display: "flex", justifyContent: "space-around", marginTop: 3}}>
                    {!uploading && !finishedUploading && 
                        <Button variant="contained" sx={styles.button} onClick={upload}>
                            Upload
                        </Button>
                    }
                    {uploading && 
                        <CircularProgress variant="determinate" value={progress} />
                    }
                    <div>
                        <Tooltip title={'When selected, filenames that are already present in database will not be uploaded.'}>
                            <FormControlLabel 
                                disabled={uploading}
                                control={<Switch/>} 
                                label="Prevent Duplicates" 
                                onChange={handlePreventDuplicates}
                                checked={preventDuplicates}
                            />
                        </Tooltip>
                    </div>
                </Box>
            </Grid>
        </Grid>
    );
};

export default UploadDirectory;