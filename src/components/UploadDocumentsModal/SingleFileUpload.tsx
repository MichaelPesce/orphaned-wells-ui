import { useState } from "react";
import { Alert, Box, Button, DialogContent, FormControlLabel, Switch, Typography } from "@mui/material";
import { FileUploader } from "react-drag-drop-files";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import UploadFooter from "./UploadFooter";

const SingleFileUpload = ({disabled, onUpload}: {disabled: boolean; onUpload: (file: File, clean: boolean) => void}) => {
  const [file, setFile] = useState<File>();
  const [clean, setClean] = useState(true);
  const [error, setError] = useState("");
  return <>
    <DialogContent dividers>
      <Typography variant="subtitle2" sx={{mb: 1.5}}>Select a document or ZIP archive</Typography>
      <FileUploader name="file" types={["tiff", "tif", "pdf", "png", "jpg", "jpeg", "zip"]} maxSize={10} disabled={disabled}
        handleChange={(selected: File) => {setFile(selected); setError("");}}
        onTypeError={() => setError("Unsupported file type")}
        onSizeError={() => setError("File too large. Maximum size is 10 MB.")}>
        <Box data-cy="upload-dropzone" sx={{height: 200, boxSizing: "border-box", border: "1px dashed", borderColor: error ? "error.main" : "grey.400", borderRadius: 1.5, bgcolor: "grey.50", p: 2.5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", cursor: disabled ? "default" : "pointer", "&:hover": {borderColor: disabled ? "grey.400" : "text.secondary"}}}>
          <UploadFileOutlinedIcon sx={{fontSize: 32, color: "text.secondary", mb: 1.5}} />
          <Typography variant="body1"><Box component="span" sx={{fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px"}}>Browse files</Box> or drag and drop a file</Typography>
          <Typography variant="caption" color="text.secondary" sx={{mt: 0.5}}>PDF, TIFF, PNG, JPEG, or ZIP · Maximum 10 MB</Typography>
          <Typography variant="body2" color="text.secondary" title={file?.name} noWrap sx={{mt: 2, maxWidth: "100%"}}>{file?.name || "No file selected"}</Typography>
        </Box>
      </FileUploader>
      <FormControlLabel data-cy="upload-run-cleaning-toggle" labelPlacement="start" sx={{mt: 2, mx: 0, py: 1, width: "100%", justifyContent: "space-between"}}
        label={<Box><Typography variant="body2" fontWeight={500}>Run cleaning functions</Typography><Typography variant="caption" color="text.secondary">Apply cleaning rules to the extracted fields.</Typography></Box>}
        control={<Switch checked={clean} onChange={(event) => setClean(event.target.checked)} />} disabled={disabled} />
    </DialogContent>
    <UploadFooter compact status={error ? <Alert severity="error">{error}</Alert> : <Typography variant="body2">{disabled ? "A deployed processor and upload permission are required." : "Upload one document or a ZIP containing supported documents."}</Typography>}>
      <Button data-cy="upload-file-button" variant="contained" disabled={disabled || !file} onClick={() => file && onUpload(file, clean)}>Upload file</Button>
    </UploadFooter>
  </>;
};
export default SingleFileUpload;
