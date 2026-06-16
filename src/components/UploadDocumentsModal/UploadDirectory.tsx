import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useUserContext } from "../../usercontext";
import { Grid, Box, Button, Stack, FormControlLabel, Switch, Tooltip, TextField, LinearProgress } from "@mui/material";
import { UploadDirectoryProps } from "../../types";
import { checkForDuplicateRecords, uploadDocumentsBatchWithProgress, UploadProgressInfo } from "../../services/app.service";
import { callAPI } from "../../util";

const UploadDirectory = (props: UploadDirectoryProps) => {
  const params = useParams<{ id: string }>();
  const { userEmail } = useUserContext();
  const { directoryName, directoryFiles, runCleaningFunctions, setRunCleaningFunctions, uploading, setUploading } = props;
  const [ amountToUpload, setAmountToUpload ] = useState(directoryFiles.length);
  const [ filesToUpload, setFilesToUpload ] = useState<File[]>([]);
  const [ finishedUploading, setFinishedUploading ] = useState(false);
  const [ progress, setProgress ] = useState(0);
  const [ remainingSeconds, setRemainingSeconds ] = useState<number | null>(null);
  const [ uploadedBytes, setUploadedBytes ] = useState(0);
  const [ totalBytes, setTotalBytes ] = useState(0);
  const [ preventDuplicates, setPreventDuplicates ] = useState(true);
  const [ uploadedFiles, setUploadedFiles ] = useState<string[]>([]);
  const [ duplicateFiles, setDuplicateFiles ] = useState<string[]>();
  const [ unduplicateFiles, setUnduplicateFiles ] = useState<File[]>();
  const [ errorFiles, setErrorFiles ] = useState<string[]>([]);
  const [ disabled, setDisabled ] = useState(true);
  const MAX_UPLOAD_AMT = 1000;

  useEffect(() => {
    if (isNaN(amountToUpload) || amountToUpload <=0) {
      setDisabled(true);
      setFilesToUpload([]);
      return;
    } 
    // TODO CONFIRM THE BELOW CODE WORKS:
    // rather than determine the files that are duplicates EVERY time we update amountToUpload,
    // let's create a list of files that are not duplicates one time (after fetching duplicate records)
    // then, in this function we can just set filesToUpload to be the first X (amountToUpload) files from
    // either the unduplicate list, or the entire list, depending on whether preventDuplicates is true
    if (duplicateFiles !== undefined) {
      if(amountToUpload > MAX_UPLOAD_AMT) setDisabled(true);
      else setDisabled(false);
      let tempFilesToUpload: File[];
      if (preventDuplicates) {
        if ((unduplicateFiles?.length || 0) > amountToUpload) {
          tempFilesToUpload = unduplicateFiles?.slice(0,amountToUpload) || [];
        } else {
          tempFilesToUpload = [...unduplicateFiles || []];
        }
      } else {
        if ((directoryFiles.length || 0) > amountToUpload) {
          tempFilesToUpload = directoryFiles?.slice(0,amountToUpload);
        } else {
          tempFilesToUpload = [...directoryFiles || []];
        }
      }
      setFilesToUpload(tempFilesToUpload);
    }
  },[amountToUpload, duplicateFiles, preventDuplicates]);

  useEffect(() => {
    setAmountToUpload(directoryFiles.length);

    let data = {
      file_list: directoryFiles.map((directoryFile) => directoryFile.name)
    };
    callAPI(
      checkForDuplicateRecords,
      [data, params.id],
      fetchedDuplicateRecords,
      (e, status) => console.error(e)
    );
  },[directoryFiles]);


  const styles = {
    button: {
      borderRadius: "8px", 
      width: 200,
    },
    stack: {
      height: "30vh",
      overflow: "scroll",
      boxShadow: 1,
      padding: 2,
      marginTop: 2
    }
  };

  const fetchedDuplicateRecords = (r: string[]) => {
    setDuplicateFiles(r);
    const temp_unduplicateFiles = directoryFiles.filter((f) => !r.includes(f.name.split(".")[0]));
    // console.log(r.length)
    // console.log(temp_unduplicateFiles.length)
    // console.log(directoryFiles.length)
    setUnduplicateFiles(temp_unduplicateFiles);
    setDisabled(false);
  };

  const updateUploadedFilesFromProgress = (uploadProgress: UploadProgressInfo) => {
    const selectedFilesSize = filesToUpload.reduce((total, file) => total + file.size, 0);
    if (selectedFilesSize === 0) return;
    if (uploadProgress.percent >= 100) {
      setUploadedFiles(filesToUpload.map((file) => file.name));
      return;
    }

    const uploadedSelectedFileBytes = (uploadProgress.percent / 100) * selectedFilesSize;
    let cumulativeBytes = 0;
    const completedFiles: string[] = [];
    for (let file of filesToUpload) {
      cumulativeBytes += file.size;
      if (cumulativeBytes <= uploadedSelectedFileBytes) completedFiles.push(file.name);
    }
    setUploadedFiles(completedFiles);
  };

  const formatTimeRemaining = (seconds: number | null) => {
    if (seconds === null || !isFinite(seconds)) return "Calculating";
    if (seconds < 1) return "Less than 1 sec";
    const roundedSeconds = Math.round(seconds);
    const minutes = Math.floor(roundedSeconds / 60);
    const remainderSeconds = roundedSeconds % 60;
    if (minutes === 0) return `${remainderSeconds} sec remaining`;
    return `${minutes} min ${remainderSeconds.toString().padStart(2, "0")} sec remaining`;
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 MB";
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const upload = () => {
    const recordGroupId = params.id;
    if (!recordGroupId) return;
    if (filesToUpload.length === 0) return;
    setUploading(true);
    setFinishedUploading(false);
    setProgress(0);
    setRemainingSeconds(null);
    setUploadedBytes(0);
    setTotalBytes(0);
    setUploadedFiles([]);
    setErrorFiles([]);

    const formData = new FormData();
    filesToUpload.forEach((file) => {
      formData.append("files", file, file.name);
    });

    uploadDocumentsBatchWithProgress(
      formData,
      recordGroupId,
      userEmail,
      false,
      preventDuplicates,
      runCleaningFunctions,
      (uploadProgress) => {
        setProgress(uploadProgress.percent);
        setRemainingSeconds(uploadProgress.remainingSeconds);
        setUploadedBytes(uploadProgress.loaded);
        setTotalBytes(uploadProgress.total);
        updateUploadedFilesFromProgress(uploadProgress);
      }
    ).then((response) => handleSuccessfulBatchUpload(response))
      .catch((error) => handleBatchUploadError(error));
  };

  const handleSuccessfulBatchUpload = (response: any) => {
    const duplicateNames = response?.duplicates || [];
    const skippedNames = (response?.skipped || []).map((file: any) => file.filename);
    if (duplicateNames.length || skippedNames.length) {
      console.log("files skipped during batch upload", { duplicateNames, skippedNames });
    }
    setProgress(100);
    setRemainingSeconds(0);
    setUploadedFiles(filesToUpload.map((file) => file.name));
    setFinishedUploading(true);
    setTimeout(()=> {
      window.location.reload();
    },3000);
  };

  const handleBatchUploadError = (error: any) => {
    console.error("batch upload failed", error);
    setUploading(false);
    setFinishedUploading(false);
    setErrorFiles(filesToUpload.map((file) => file.name));
  };

  const handlePreventDuplicates = (e: any) => {
    setPreventDuplicates(e.target.checked);
  };

  const formatFileName = (filename: string) => {
    let style = {
      color: "black"
    };
    if (errorFiles.includes(filename)) style.color = "red";
    if (uploadedFiles.includes(filename)) return <s style={style}>{`- ${filename}`}</s>; 
    else return <span style={style}>{`- ${filename}`}</span>;
  };

  const handleUpdateAmountToUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newamount = parseInt(event.target.value);
    if (isNaN(newamount)) setAmountToUpload(0);
    else setAmountToUpload(newamount);
  };


  return (
    <Grid container>
      <Grid item xs={12}>
        <p style={{marginBottom: 0}}>How many files would you like to upload from the directory <i>{directoryName}</i>? Please enter an amount between 0 and {MAX_UPLOAD_AMT}.</p>
        <Stack direction='row' alignItems={"baseline"} justifyContent="space-around">
          <TextField 
            id="amt-to_upload" 
            label="Upload Amount" 
            variant="standard" 
            type="number"
            defaultValue={amountToUpload}
            onChange={handleUpdateAmountToUpload}
            disabled={uploading}
          />
          <p><b>{filesToUpload.length}</b> files to be uploaded</p>
        </Stack>
                
                
      </Grid>
      <Grid item xs={12}>
        <Stack direction='column' sx={styles.stack}>
          {filesToUpload.map((file, idx) =>  (
            <p style={{margin: 3}} key={`${file.name}_${idx}`}>
              {formatFileName(file.name)}
            </p>
          ))}
        </Stack>
      </Grid>
      <Grid item xs={12}>
        <Box sx={{display: "flex", justifyContent: "space-around", marginTop: 1}}>
          <Stack direction={"row"}>
            <Tooltip title={"When selected, filenames that are already present in database will not be uploaded."}>
              <FormControlLabel 
                disabled={uploading || disabled}
                control={<Switch/>} 
                label="Prevent Duplicates" 
                onChange={handlePreventDuplicates}
                checked={preventDuplicates}
              />
            </Tooltip>
            <FormControlLabel 
              disabled={uploading || disabled}
              control={<Switch/>} 
              label="Run cleaning functions" 
              onChange={(e: any) => setRunCleaningFunctions(e.target.checked)}
              checked={runCleaningFunctions}
            />
          </Stack>
        </Box>
        <Box sx={{display: "flex", justifyContent: "space-around", marginTop: 1}}>
          {!uploading && !finishedUploading && 
                        <Button variant="contained" sx={styles.button} onClick={upload} disabled={disabled}>
                            Upload
                        </Button>
          }
          {uploading && 
                        <Box sx={{width: "100%"}}>
                          <LinearProgress variant="determinate" value={Math.min(progress, 100)} />
                          <Stack direction={"row"} justifyContent={"space-between"} sx={{marginTop: 1}}>
                            <p style={{margin: 0}}>{progress.toFixed(0)}%</p>
                            <p style={{margin: 0}}>{formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}</p>
                            <p style={{margin: 0}}>{formatTimeRemaining(remainingSeconds)}</p>
                          </Stack>
                        </Box>
          }
        </Box>
      </Grid>
    </Grid>
  );
};

export default UploadDirectory;
