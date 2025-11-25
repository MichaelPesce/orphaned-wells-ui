import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useUserContext } from "../../usercontext";
import { Grid, Box, Button, Stack, FormControlLabel, Switch, Tooltip, TextField } from "@mui/material";
import { UploadDirectoryProps } from "../../types";
import { uploadDocument, checkForDuplicateRecords } from "../../services/app.service";
import { callAPI } from "../../util";
import CircularProgress from "@mui/material/CircularProgress";

const UploadDirectory = (props: UploadDirectoryProps) => {
  const params = useParams<{ id: string }>();
  const { userEmail } = useUserContext();
  const { directoryName, directoryFiles, runCleaningFunctions, setRunCleaningFunctions, uploading, setUploading } = props;
  const [ amountToUpload, setAmountToUpload ] = useState(directoryFiles.length);
  const [ filesToUpload, setFilesToUpload ] = useState<File[]>([]);
  const [ finishedUploading, setFinishedUploading ] = useState(false);
  const [ progress, setProgress ] = useState(0);
  const [ preventDuplicates, setPreventDuplicates ] = useState(true);
  const [ uploadedFiles, setUploadedFiles ] = useState<string[]>([]);
  const [ duplicateFiles, setDuplicateFiles ] = useState<string[]>();
  const [ errorFiles, setErrorFiles ] = useState<string[]>([]);
  const [ disabled, setDisabled ] = useState(false);
  const MAX_UPLOAD_AMT = 500;

  useEffect(() => {
    let uploadedAmt = uploadedFiles.length;
    if (uploading && uploadedAmt === filesToUpload.length) {
      setFinishedUploading(true);
      setTimeout(()=> {
        window.location.reload();
      },3000);
    }
    try {
      if (filesToUpload.length!== 0) {
        setProgress( (uploadedAmt / filesToUpload.length) * 100);
      }
    } catch(e) {
      setProgress(0);
    }
  },[uploadedFiles]);

  useEffect(() => {
    if (isNaN(amountToUpload) || amountToUpload <=0) {
      setDisabled(true);
      setFilesToUpload([]);
      return;
    } 
    if (duplicateFiles !== undefined) {
      if(amountToUpload > MAX_UPLOAD_AMT) setDisabled(true);
      else setDisabled(false);
      let tempFilesToUpload = [];
      for (let file of directoryFiles) {
        if (!preventDuplicates || !duplicateFiles.includes(file.name.split(".")[0])) {
          tempFilesToUpload.push(file);
        }
        if (tempFilesToUpload.length >= amountToUpload) break;
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
      (r) => setDuplicateFiles(r),
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

  const upload = () => {
    setUploading(true);
    filesToUpload.map((file) => {
      let formData = new FormData();
      formData.append("file", file, file.name);
      callAPI(
        uploadDocument,
        [formData, params.id, userEmail, false, preventDuplicates, runCleaningFunctions, false],
        () => handleSuccessfulDocumentUpload(file),
        (e, status) => handleAPIErrorResponse(file, status)
      );
    });
  };

  const handleSuccessfulDocumentUpload = (file: File) => {
    setUploadedFiles((uploadedFiles) => [...uploadedFiles, file.name]);
  };

  const handleAPIErrorResponse = (file: File, status_code?: number) => {
    if (status_code === 208) {
      console.log("duplicate: "+file.name);
    } else {
      console.error(`error uploading ${file.name} with status code ${status_code}`);
      setErrorFiles((errorFiles) => [...errorFiles, file.name]);
    }
    setUploadedFiles((uploadedFiles) => [...uploadedFiles, file.name]);
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
        <Stack direction='row' alignItems={"baseline"} justifyContent={"center"}>
          <TextField 
            id="amt-to_upload" 
            label="Upload Amount" 
            variant="standard" 
            type="number"
            defaultValue={amountToUpload}
            onChange={handleUpdateAmountToUpload}
            disabled={uploading}
          />
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
                disabled={uploading}
                control={<Switch/>} 
                label="Prevent Duplicates" 
                onChange={handlePreventDuplicates}
                checked={preventDuplicates}
              />
            </Tooltip>
            <FormControlLabel 
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
                        <CircularProgress variant="determinate" value={progress} />
          }
        </Box>
      </Grid>
    </Grid>
  );
};

export default UploadDirectory;