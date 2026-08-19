import { DragEvent, useRef, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

interface FileDropzoneProps {
  files: File[];
  onFilesSelected: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  title: string;
  subtitle: string;
  supportedText: string;
  error?: string;
  dataCy?: string;
}

const FileDropzone = ({
  files,
  onFilesSelected,
  accept,
  multiple = false,
  disabled = false,
  title,
  subtitle,
  supportedText,
  error,
  dataCy = "file-dropzone",
}: FileDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || disabled) return;
    const nextFiles = Array.from(fileList);
    onFilesSelected(multiple ? nextFiles : nextFiles.slice(0, 1));
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) setDragActive(true);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <Box
      data-cy={dataCy}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      sx={{
        border: error ? "2px dashed #D3242F" : "2px dashed #9AA6B2",
        borderColor: dragActive ? "#2196F3" : undefined,
        borderRadius: 2,
        backgroundColor: error ? "#FDF7F7" : dragActive ? "#F3F8FF" : "#FAFBFC",
        cursor: disabled ? "default" : "pointer",
        px: 4,
        py: 5,
        textAlign: "center",
      }}
    >
      <input
        ref={inputRef}
        hidden
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => handleFiles(event.target.files)}
      />
      <Stack spacing={1.5} alignItems="center">
        <UploadFileIcon color={error ? "error" : "primary"} fontSize="large" />
        <Typography variant="h6" sx={{ fontSize: 18 }}>
          {title}
        </Typography>
        <Typography color="text.secondary">{subtitle}</Typography>
        <Button variant="outlined" disabled={disabled}>
          Browse Files
        </Button>
        <Typography color="text.secondary" sx={{ fontSize: 13 }}>
          {supportedText}
        </Typography>
        {files.length > 0 && (
          <Typography data-cy={`${dataCy}-files`} sx={{ fontWeight: 600 }}>
            {files.map((file) => file.name).join(", ")}
          </Typography>
        )}
        {error && (
          <Typography color="error" sx={{ fontWeight: 600 }}>
            {error}
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default FileDropzone;
