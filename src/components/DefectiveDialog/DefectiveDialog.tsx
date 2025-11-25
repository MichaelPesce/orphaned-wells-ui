import React, { useEffect, useState, useRef } from "react";
import { Chip, IconButton, Grid, Button, Stack, Dialog, DialogTitle, DialogContent, DialogContentText, TextField } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CancelIcon from "@mui/icons-material/Cancel";
import CheckIcon from "@mui/icons-material/Check";

interface DefectiveDialogProps {
    open: boolean;
    handleMarkDefective: (categories: string[], description: string) => void;
    onClose: () => void;
}

const DefectiveDialog = ({ open, handleMarkDefective, onClose }: DefectiveDialogProps) => {
  const [categoryOptions, setCategeoryOptions] = useState([
    "Wrong document type", "Some fields not detected", "Fields in wrong position on document", "Complex fields not split correctly", "Document Illegible", "Other"
  ]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [defectiveDescription, setDefectiveDescription] = useState("");
  const dialogHeight = "25vh";
  const dialogWidth = "40vw";

  const descriptionElementRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);


  const styles = {
    dialogPaper: {
      minHeight: dialogHeight,
      minWidth: dialogWidth,
    },
    chip: {
      filled: {
        m: 1,
        cursor: "pointer",
      },
      unfilled: {
        m: 1,
        cursor: "pointer",
        border: "1px dashed"
      }
    },
    submitButton: {
      mt: 2
    },
    chipBox: {
      mx: 2
    },
    description: {
      borderRadius: "12px"
    },
  };

  const handleClose = () => {
    onClose();
  };

  const handleSelect = (option: string) => {
    let tempSelected = [...selectedCategories];
    const index = tempSelected.indexOf(option);
    if (index > -1) {
      tempSelected.splice(index, 1);
    } else {
      tempSelected.push(option);
    }

    setSelectedCategories(tempSelected);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      scroll={"paper"}
      aria-labelledby="new-project-dialog"
      aria-describedby="new-project-dialog-description"
      PaperProps={{
        sx: styles.dialogPaper
      }}
    >
      <DialogTitle id="new-project-dialog-title"><b>Mark Defective</b></DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{
          position: "absolute",
          right: 0,
          top: 8,
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers={true}>
        <DialogContentText
          id="scroll-dialog-description"
          ref={descriptionElementRef}
          tabIndex={-1}
          aria-labelledby="new-project-dialog-content-text"
          component={"span"}
        >
          <Grid container>
            <div>
                            Please select at least one category for why this record is defective:
            </div>
            <Grid item xs={12} sx={styles.chipBox}>
              {categoryOptions.map((option) => (
                <Chip 
                  key={option}
                  color={"primary"}
                  sx={selectedCategories.includes(option) ? styles.chip.filled : styles.chip.unfilled}
                  label={option}
                  variant={selectedCategories.includes(option) ? "filled" : "outlined"}
                  icon={selectedCategories.includes(option) ? <CheckIcon /> : undefined}
                  onClick={() => handleSelect(option)}
                />
              ))}
            </Grid>
            <Grid item xs={12} sx={styles.chipBox}>
              <p>Add more details about the issues:</p>
            </Grid>
            <Grid item xs={12} sx={styles.chipBox}>
              <TextField
                id='defective-description'
                value={defectiveDescription}
                fullWidth
                multiline
                rows={3}
                InputProps={{
                  style: styles.description,
                }}
                placeholder='Type in a new note'
                onChange={(e)=>setDefectiveDescription(e.target.value)}
              />
            </Grid>
          </Grid>
          <Stack
            direction={"row-reverse"}
            sx={{
              gap: 2,
              flexShrink: 0,
              alignSelf: { xs: "flex-end"},
            }}
          >
            <Button
              variant="contained"
              sx={
                styles.submitButton
              }
              disabled={selectedCategories.length === 0}
              onClick={() => handleMarkDefective(selectedCategories, defectiveDescription)}
              startIcon={<CancelIcon sx={{ color: selectedCategories.length === 0 ? "grey" : "#F44336" }} />}
            >
                            Mark As Defective
            </Button>
          </Stack>
        </DialogContentText>
                
      </DialogContent>
    </Dialog>
  );
};

export default DefectiveDialog;