import { ChangeEvent, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Dialog, DialogTitle, IconButton, Tab, Tabs, Typography, useMediaQuery, useTheme } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { UploadDocumentsModalProps } from "../../types";
import { useUserContext } from "../../usercontext";
import UploadDirectory from "./UploadDirectory";
import UploadGcsDirectory from "./UploadGcsDirectory";
import SingleFileUpload from "./SingleFileUpload";
import UploadProcessorStatus from "./UploadProcessorStatus";

const UploadDocumentsModal = ({setShowModal, handleUploadDocument}: UploadDocumentsModalProps) => {
  const {id = ""} = useParams<{id: string}>();
  const {hasPermission} = useUserContext();
  const fullScreen = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [mode, setMode] = useState("file");
  const [directory, setDirectory] = useState<{name: string; files: File[]; selection: number}>();
  const [clean, setClean] = useState(true);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const permitted = hasPermission("upload_document");
  const close = () => {if (!busy) setShowModal(false);};
  const chooseDirectory = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;
    const files = selected.filter((file) => /\.(pdf|tiff?|png|jpe?g)$/i.test(file.name));
    setDirectory((previous) => ({name: selected[0].webkitRelativePath?.split("/")[0] || "Selected directory", files, selection: (previous?.selection || 0) + 1}));
    setMode("directory");
    event.target.value = "";
  };
  return <Dialog open onClose={close} fullScreen={fullScreen} maxWidth={false} aria-labelledby="upload-dialog-title" data-cy="upload-documents-modal"
    PaperProps={{sx: {
      width: 860, height: fullScreen ? "100dvh" : 660,
      maxHeight: fullScreen ? "100dvh" : "90dvh", m: fullScreen ? 0 : 2,
      borderRadius: fullScreen ? 0 : 2,
      "& .MuiButton-root": {textTransform: "none"},
      "& .MuiDialogContent-root": {borderTop: 0, borderBottom: 0, px: 3, py: 2.5},
    }}}>
    <DialogTitle id="upload-dialog-title" component="div" sx={{display: "flex", alignItems: "flex-start", gap: 2, px: 3, pt: 2.5, pb: 1.5}}>
      <Box sx={{flex: 1}}>
        <Typography component="h2" variant="h6" fontWeight={600}>Upload records</Typography>
        <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>Choose a source to add documents to this record group.</Typography>
      </Box>
      <IconButton aria-label="Close upload dialog" disabled={busy} onClick={close}><CloseIcon /></IconButton>
    </DialogTitle>
    <Box sx={{display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", px: 3, gap: {xs: 0, sm: 1}, borderBottom: 1, borderColor: "divider", flexShrink: 0}}>
      <Tabs value={mode} aria-label="Upload source" variant="scrollable" scrollButtons="auto" sx={{minHeight: 48, order: {xs: 1, sm: 0}, width: {xs: "100%", sm: "auto"}, "& .MuiTab-root": {minHeight: 48, minWidth: 0, px: {xs: 1.5, sm: 2}, textTransform: "none", fontWeight: 500}}}>
        <Tab id="upload-source-file" aria-controls="upload-source-panel" data-cy="upload-back-button" label="File / ZIP" value="file" disabled={busy} onClick={() => setMode("file")} />
        <Tab id="upload-source-directory" aria-controls="upload-source-panel" data-cy="local-directory-button" label="Local directory" value="directory" disabled={busy || !ready || !permitted} onClick={() => input.current?.click()} />
        <Tab id="upload-source-gcs" aria-controls="upload-source-panel" data-cy="gcs-directory-button" label="GCS directory" value="gcs" disabled={busy || !ready || !permitted} onClick={() => setMode("gcs")} />
      </Tabs>
      <UploadProcessorStatus recordGroupId={id} busy={busy} permitted={permitted} onReady={setReady} />
    </Box>
    <input data-cy="local-directory-input" aria-label="Select local directory files" ref={input} type="file" multiple hidden onChange={chooseDirectory} {...{webkitdirectory: "", directory: ""}} />
    <Box role="tabpanel" id="upload-source-panel" aria-labelledby={`upload-source-${mode}`} sx={{display: "flex", flexDirection: "column", flex: 1, minHeight: 0}}>
      {mode === "file" && <SingleFileUpload disabled={!ready || !permitted} onUpload={(file, cleaning) => {handleUploadDocument(file, cleaning, true); close();}} />}
      {mode === "directory" && directory && <UploadDirectory key={directory.selection} directoryName={directory.name} directoryFiles={directory.files} runCleaningFunctions={clean} setRunCleaningFunctions={setClean} uploading={busy} setUploading={setBusy} onClose={close} processorReady={ready} />}
      {mode === "gcs" && <UploadGcsDirectory runCleaningFunctions={clean} setRunCleaningFunctions={setClean} uploading={busy} setUploading={setBusy} onClose={close} processorReady={ready} />}
    </Box>
  </Dialog>;
};
export default UploadDocumentsModal;
