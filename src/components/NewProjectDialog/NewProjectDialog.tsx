import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TextField, IconButton, Grid, Button, Dialog, DialogTitle, DialogContent, DialogContentText } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { addProject } from "../../services/app.service";
import { callAPI } from "../../util";

interface NewProjectDialogProps {
    open: boolean;
    onClose: () => void;
    setErrorMsg: (msg: string) => void;
}

const NewProjectDialog = ({ open, onClose, setErrorMsg }: NewProjectDialogProps) => {
  const navigate = useNavigate();
    
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [disableCreateButton, setDisableCreateButton] = useState(true);
  const dialogHeight = "50vh";
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

  useEffect(() => {
    if (projectName === "") setDisableCreateButton(true);
    else if(projectName) setDisableCreateButton(false);
  }, [projectName]);

  const styles = {
    dialogPaper: {
      minHeight: dialogHeight,
      minWidth: dialogWidth,
    },
    projectName: {
      marginBottom: 2
    },
  };


  const handleClose = () => {
    onClose();
  };

  const handleCreateProject = () => {
    let body = {
      name: projectName,
      description: projectDescription,
    };
    callAPI(
      addProject,
      [body],
      handleSuccessfulProjectCreation,
      handleError
    );
  };

  const handleSuccessfulProjectCreation = (new_id: string) => {
    setTimeout(() => {
      navigate("/project/" + new_id);
    }, 500);
  };

  const handleError = (e: string) => {
    setErrorMsg(e);
    onClose();
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
      <DialogTitle id="new-project-dialog-title"><b>New Project</b></DialogTitle>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Project Name"
                variant="outlined"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                sx={styles.projectName}
                id="project-name-textbox"
              />
              <TextField
                fullWidth
                label="Description"
                variant="outlined"
                value={projectDescription}
                onChange={(event) => setProjectDescription(event.target.value)}
                multiline
                rows={4}
              />
            </Grid>

                        
          </Grid>
        </DialogContentText>
        <Button
          variant="contained"
          sx={{
            position: "absolute",
            right: 10,
            bottom: 10,
          }}
          disabled={disableCreateButton}
          onClick={handleCreateProject}
        >
                    Create Project
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default NewProjectDialog;