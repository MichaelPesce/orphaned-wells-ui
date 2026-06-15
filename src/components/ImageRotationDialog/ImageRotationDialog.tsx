import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
} from "@mui/material";

interface ImageRotationDialogProps {
  open: boolean;
  imageFiles: string[];
  onClose: () => void;
  onSubmit: (selectedImageIndices: number[], rotationDegrees: number) => void;
}

const ImageRotationDialog: React.FC<ImageRotationDialogProps> = ({
  open,
  imageFiles,
  onClose,
  onSubmit,
}) => {
  const [selectedImages, setSelectedImages] = useState<boolean[]>([]);
  const [rotationDegrees, setRotationDegrees] = useState<number>(90);

  // Initialize selected images to all true when dialog opens
  useEffect(() => {
    if (open && imageFiles.length > 0) {
      setSelectedImages(new Array(imageFiles.length).fill(true));
    }
  }, [open, imageFiles]);

  const handleImageToggle = (index: number) => {
    const newSelected = [...selectedImages];
    newSelected[index] = !newSelected[index];
    setSelectedImages(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedImages(new Array(imageFiles.length).fill(true));
  };

  const handleDeselectAll = () => {
    setSelectedImages(new Array(imageFiles.length).fill(false));
  };

  const handleSubmit = () => {
    const selectedIndices = selectedImages
      .map((isSelected, index) => (isSelected ? index : -1))
      .filter((index) => index !== -1);

    if (selectedIndices.length > 0) {
      onSubmit(selectedIndices, rotationDegrees);
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Rotate Images</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          {/* Rotation Degrees Selection */}
          <Box sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Rotation Degrees</InputLabel>
              <Select
                value={rotationDegrees}
                label="Rotation Degrees"
                onChange={(e) => setRotationDegrees(e.target.value as number)}
              >
                <MenuItem value={90}>90°</MenuItem>
                <MenuItem value={180}>180°</MenuItem>
                <MenuItem value={270}>270°</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Select/Deselect All Buttons */}
          <Box sx={{ mb: 2, display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={handleSelectAll}
            >
              Select All
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleDeselectAll}
            >
              Deselect All
            </Button>
          </Box>

          {/* Image Selection Grid */}
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Select images to rotate:
          </Typography>
          <FormGroup>
            <Grid container spacing={2}>
              {imageFiles.map((imageFile, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Box
                    sx={{
                      border: selectedImages[index]
                        ? "2px solid #1976d2"
                        : "2px solid #e0e0e0",
                      borderRadius: 1,
                      p: 1,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      backgroundColor: selectedImages[index]
                        ? "rgba(25, 118, 210, 0.08)"
                        : "transparent",
                      "&:hover": {
                        borderColor: "#1976d2",
                      },
                    }}
                    onClick={() => handleImageToggle(index)}
                  >
                    {/* Image Preview */}
                    <Box
                      sx={{
                        mb: 1,
                        width: "100%",
                        height: "120px",
                        overflow: "hidden",
                        borderRadius: 0.5,
                        backgroundColor: "#f5f5f5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={imageFile}
                        alt={`Image ${index + 1}`}
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </Box>

                    {/* Checkbox and Label */}
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedImages[index]}
                          onChange={() => handleImageToggle(index)}
                          size="small"
                        />
                      }
                      label={`Image ${index + 1}`}
                      sx={{
                        width: "100%",
                        m: 0,
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedImages.some((isSelected) => isSelected)}
        >
          Apply Rotation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageRotationDialog;
