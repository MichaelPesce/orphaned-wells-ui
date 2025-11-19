import React, { useRef } from "react";
import { Box, TextField, IconButton, Typography, Button, Paper } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import EditIcon from "@mui/icons-material/Edit";

interface ImageFieldProps {
  label: string;
  value?: string;
  onChange: (newValue: File) => void;
  sx?: any;
}

const ImageField: React.FC<ImageFieldProps> = ({ label, value, onChange, sx }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file: File | null) => {
    if (!file) return;
    onChange(file)
    // const reader = new FileReader();
    // reader.onload = () => {
    //   if (typeof reader.result === "string") onChange(reader.result);
    // };
    // reader.readAsDataURL(file);
  };

  return (
    <Box sx={{ ...sx }}>
      {!value && (
        <Box>
          <TextField
            fullWidth
            label={label}
            variant="outlined"
            value={value}
            // onChange={(e) => onChange(e.target.value)}
          />
          <Button
            startIcon={<PhotoCameraIcon />}
            variant="contained"
            sx={{ mt: 1 }}
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Image
          </Button>
        </Box>
      )}

      {value && (
        <Paper
          variant="outlined"
          sx={{
            p: 1,
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            component="img"
            src={value}
            alt="preview"
            sx={{
              width: 60,
              height: 60,
              objectFit: "cover",
              borderRadius: 1,
              border: "1px solid #ccc",
            }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {label}
            </Typography>
            {/* <Typography
              variant="body2"
              sx={{
                wordBreak: "break-all",
                fontSize: "0.75rem",
                opacity: 0.8,
                mt: 0.5,
              }}
            >
              {value.substring(0, 60)}...
            </Typography> */}
          </Box>
          <IconButton onClick={() => fileInputRef.current?.click()}>
            <EditIcon />
          </IconButton>
        </Paper>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
    </Box>
  );
};

export default ImageField;
