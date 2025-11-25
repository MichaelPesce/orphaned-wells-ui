import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogTitle, DialogContent } from "@mui/material";
import { IconButton, Tooltip, TextField, Button, Stack, Box, Typography, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ReplyIcon from "@mui/icons-material/Reply";
import CheckIcon from "@mui/icons-material/Check";
import DeleteIcon from "@mui/icons-material/Delete";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { updateRecord, getRecordNotes } from "../../services/app.service";
import { callAPI, formatDateTime } from "../../util";
import { RecordNote, RecordNotesDialogProps } from "../../types";
import { useUserContext } from "../../usercontext";
import PopupModal from "../PopupModal/PopupModal";
import ErrorBar from "../ErrorBar/ErrorBar";

const RecordNotesDialog = ({ record_id, open, onClose }: RecordNotesDialogProps) => {
  const { userEmail } = useUserContext();
  const [ recordNotes, setRecordNotes ] = useState([] as RecordNote[]);
  const [ replyToIdx, setReplyToIdx ] = useState<number>();
  const [ editIdx, setEditIdx ] = useState<number>();
  const [ deleteIdx, setDeleteIdx ] = useState<number>();
  const [ newNoteText, setNewNoteText ] = useState("");
  const [ disableButton, setDisableButton ] = useState(true);
  const [ loading, setLoading ] = useState(true);
  const [ showResolved, setShowResolved ] = useState(false);
  const [ errorMsg, setErrorMsg ] = useState<string | null>(null);
  const descriptionElementRef = useRef<HTMLDivElement | null>(null);
  const dialogHeight = "80vh";
  const dialogWidth = "35vw";
  useEffect(() => {
    if (open) {
      setLoading(true);
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
      callAPI(
        getRecordNotes,
        [record_id],
        (recordNotes) => reset(recordNotes),
        handleFailed,
      );
    } else reset();
  }, [open]);

  const styles = {
    dialogPaper: {
      minHeight: dialogHeight,
      maxHeight: dialogHeight,
      minWidth: dialogWidth,
      maxWidth: dialogWidth,
      display: "flex",
      flexDirection: "column",
    },
    dialogContent: {
      flex: 1, // Make content area take up available vertical space
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between", // Ensure bottom section stays at the bottom
    },
    boxTop: {
      overflow: "scroll"
    },
    boxBottom: {
      marginTop: 2
    },
    replyToText: {
      opacity: 0.5,
      fontStyle: "italic",
      overflow: "hidden",
      margin: 0
    },
    textfield: {
      "& .MuiOutlinedInput-root": {
        // Default border
        "& fieldset": {
          borderWidth: "1px",
          borderColor: "black"
        },
        // On hover
        "&:hover fieldset": {
          borderWidth: "1.5px",
          borderColor: "black"
        },
        // On focus
        "&.Mui-focused fieldset": {
          borderWidth: "2px",
          borderColor: "black"
        },
      },
    },
    resolvedCommentsDiv: {
      backgroundColor: "#E7E7E7",
      borderRadius: "2px"
    },
    resolvedCommentsText: {
      // opacity: 0.6,
      fontSize: "13px",
      fontWeight: "bold",
      paddingLeft: "8px"
    },
    icon: {
      fontSize: "14px",
      color: "black"
    },
  };

  const handleAddNote = () => {
    handleUpdateRecordNotes("add", recordNotes.length, newNoteText);
  };

  const handleEditNote = (idx: number, newValue: string) => {
    handleUpdateRecordNotes("edit", idx, newValue);
  };

  const handleResolveNote = (idx: number) => {
    if (recordNotes[idx].resolved) handleUpdateRecordNotes("unresolve", idx);
    else handleUpdateRecordNotes("resolve", idx);
  };

  const handleDeleteNote = () => {
    if (deleteIdx !== undefined) handleUpdateRecordNotes("delete", deleteIdx);
  };

  const handleClickAction = (idx: number, action: string, newValue?: string, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (action === "edit") {
      if (editIdx === idx)  {
        handleEditNote(idx, newValue || "");
      }
      else setEditIdx(idx);
    }
    else if (action === "reply") {
      if (replyToIdx === idx) setReplyToIdx(undefined);
      else { 
        setTimeout(() => {
          document.getElementById("reply-textfield")?.focus();
        }, 0);
                
        setReplyToIdx(idx);
      }
    }
    else if (action === "resolve") {
      handleResolveNote(idx);
    }
    else if (action === "delete") {
      setDeleteIdx(idx);
    } else if (action === "submit reply") {
      handleUpdateRecordNotes("add", recordNotes.length, newValue, true);
    }
  };

  const handleUpdateRecordNotes = (updateType: string, index: number, text?: string, isReply?: boolean) => {
    const data: {
          [key: string]: string | number | boolean;
        } = {
          update_type: updateType,
          index: index
        };
    if (text) data["text"] = text;
    if (isReply)  {
      data["isReply"] = true;
      if (replyToIdx !== undefined) data["replyToIndex"] = replyToIdx;
    }
    callAPI(
      updateRecord,
      [record_id, { data: data, type: "record_notes" }],
      (newNotes) => handleSuccessfulNoteUpdate(newNotes),
      handleFailed,
    );
  };   

  const reset = (newNotes?: RecordNote[]) => {
    setReplyToIdx(undefined);
    setEditIdx(undefined);
    setDeleteIdx(undefined);
    setNewNoteText("");
    setDisableButton(false);
    setLoading(false);
    if (newNotes === undefined) setRecordNotes([]);
    else setRecordNotes(newNotes);
  };

  const handleSuccessfulNoteUpdate = (data: RecordNote[]) => {
    reset(data);
  };

  const handleFailed = (e: string) => {
    setErrorMsg(e);
  };

  const checkForResolved = () => {
    for (let note of recordNotes) {
      if (note.resolved) return true;
    }
    return false;
  };

  return (
    <Dialog
      open={open}
      onClose={() => onClose(record_id, recordNotes)}
      scroll={"paper"}
      aria-labelledby="new-dg-dialog"
      aria-describedby="new-dg-dialog-description"
      PaperProps={{
        sx: styles.dialogPaper
      }}
    >
      <DialogTitle id="new-dg-dialog-title">Notes</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={() => onClose(record_id, recordNotes)}
        sx={{
          position: "absolute",
          right: 0,
          top: 8,
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent
        sx={styles.dialogContent}
      >
        {/* Top content */}
        <Box sx={styles.boxTop}>
          {
            !loading && 
                        recordNotes.map((note, idx) => {
                          if (!note.isReply && !note.deleted && !note.resolved)  {
                            return (
                              <div key={note.timestamp}>
                                <IndividualNote
                                  recordNotes={recordNotes}
                                  note={note}
                                  idx={idx}
                                  editMode={editIdx === idx}
                                  handleClickAction={handleClickAction}
                                  userEmail={userEmail}
                                  replyToIdx={replyToIdx}
                                  editIdx={editIdx}
                                />
                              </div>
                            );
                          }
                        })
          }
          {
            (!loading && checkForResolved()) &&
                        <div style={styles.resolvedCommentsDiv}>
                          <div>
                            <Divider sx={{marginBottom: 1}}/>
                            <Stack direction={"row"} justifyContent={"space-between"} alignItems='start'>
                              <Typography sx={styles.resolvedCommentsText}>
                                        Resolved comments
                              </Typography>
                              <Tooltip title='show resolved comment'>
                                <IconButton onClick={() => setShowResolved((showResolved) => !showResolved)}>
                                  {showResolved ? 
                                    <KeyboardArrowUpIcon sx={styles.icon}/>
                                    :
                                    <KeyboardArrowDownIcon sx={styles.icon}/>
                                  }
                                </IconButton> 
                              </Tooltip>
                                    
                            </Stack>
                                
                          </div>
                          {
                            showResolved &&
                                recordNotes.map((note, idx) => {
                                  if (note.resolved)  {
                                    return (
                                      <div key={note.timestamp}>
                                        <IndividualNote
                                          recordNotes={recordNotes}
                                          note={note}
                                          idx={idx}
                                          editMode={editIdx === idx}
                                          handleClickAction={handleClickAction}
                                          userEmail={userEmail}
                                          replyToIdx={replyToIdx}
                                          editIdx={editIdx}
                                        />
                                      </div>
                                    );
                                  }
                                })
                          }
                        </div>
                        
          }

          <Divider/>
                    
          {
            loading ? 
              <p style={{color: "grey"}}>
                            loading...
              </p>
              :
              recordNotes.length === 0 && 
                        <p style={{color: "grey"}}>
                            No notes added yet
                        </p>
          }
        </Box>

        {/* Bottom section */}
        <Box sx={styles.boxBottom}>
          <TextField
            id='new-note-textfield'
            fullWidth
            required
            variant='outlined'
            placeholder='Type in a new note'
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            multiline
            minRows={2}
            disabled={disableButton}
            sx={styles.textfield}
          />
          <Box display="flex" justifyContent='space-between' mt={1}>
            <Typography noWrap paragraph sx={styles.replyToText}>
            </Typography>
            <Button variant="contained" onClick={handleAddNote} disabled={newNoteText==="" || disableButton}>
                            Add new note
            </Button>
          </Box>
        </Box>
        <PopupModal
          open={deleteIdx !== undefined}
          handleClose={() => setDeleteIdx(undefined)}
          text="Are you sure you want to delete this comment?"
          handleSave={handleDeleteNote}
          buttonText='Delete'
          buttonColor='error'
          buttonVariant='contained'
          width={400}
        />
      </DialogContent>
      <ErrorBar
        errorMessage={errorMsg}
        setErrorMessage={setErrorMsg}
      />
            
    </Dialog>
  );
};


interface IndividualNoteProps {
    recordNotes: RecordNote[];
    note: RecordNote;
    idx: number,
    editMode?: boolean;
    handleClickAction: (idx: number, action: string, newText?: string, event?: React.MouseEvent<HTMLButtonElement>) => void;
    userEmail: string;
    replyToIdx?: number;
    editIdx?: number;
    childOfResolved?: boolean;
}

const IndividualNote = ({ recordNotes, note, idx, editMode, handleClickAction, userEmail, replyToIdx, editIdx, childOfResolved }: IndividualNoteProps) => {
  const [ newText, setNewText ] = useState<string>(note.text);
  const [ disableSaveEdit, setDisableSaveEdit ] = useState(false);
  const [ replyText, setReplyText ] = useState("");
  if (note.deleted) return null;
  const styles = {
    outerDiv: {
      backgroundColor: (note.resolved || childOfResolved) ? "#F5F5F6" : undefined,
    },
    innerDiv: {
      paddingX: 1,
      paddingY: 1,
      paddingBottom: 1,
      marginLeft: note?.isReply ? 4 : 0,
      borderRadius: 1, // Rounded corners
    },
    metadata: {
      opacity: 0.9,
      fontSize: "13px"
    },
    icon: {
      fontSize: "14px",
      color: "black"
    },
    indentedDivider: {
      paddingLeft: "24px",
    },
    resolvedTypography: {
      paddingX: 1,
      paddingY: 1,
      paddingBottom: 1,
      marginLeft: 4,
      borderRadius: 1, // Rounded corners
    },
    textfield: {
      "& .MuiOutlinedInput-root": {
        // Default border
        "& fieldset": {
          borderWidth: "1px",
          borderColor: "black"
        },
        // On hover
        "&:hover fieldset": {
          borderWidth: "1.5px",
        },
        // On focus
        "&.Mui-focused fieldset": {
          borderWidth: "2px",
          borderColor: "black"
        },
      },
    },
    replyDiv: {
      marginLeft: "32px",
      marginTop: "8px"
    }
  };

  const clickCancel = () => {
    setReplyText("");
    handleClickAction(idx, "reply");
  };

  const clickSubmit = () => {
    handleClickAction(idx, "submit reply", replyText);
    setReplyText("");
  };

  const handleUpdateText = (e: any) => {
    let newValue = e.target.value;
    setNewText(newValue);
    if (newValue === "") setDisableSaveEdit(true);
    else setDisableSaveEdit(false);
  };
  return (
    <div style={styles.outerDiv}>
      <div style={note?.isReply ? styles.indentedDivider : undefined}>
        <Divider />
      </div>
      <Typography component={"div"} sx={styles.innerDiv}>
        <div>
          <Stack direction={"row"} justifyContent={"space-between"} alignItems='start'>
            <div style={{ maxWidth: "70%"}}>
              {editMode ? 
                <TextField
                  fullWidth
                  variant='standard'
                  defaultValue={note.text}
                  multiline
                  onChange={handleUpdateText}
                />
                : 
                <Typography>
                  {note.text}
                </Typography>
              }
            </div>
                        

            <Stack direction='row'>
              {
                note.resolved ? 
                  <div>
                    <Tooltip title='reopen'>
                      <IconButton onClick={(e) => handleClickAction(idx, "resolve", undefined, e)}>
                        <AutorenewIcon sx={styles.icon}/>
                      </IconButton> 
                    </Tooltip>
                  </div>
                                    
                  : 
                  !childOfResolved &&
                            <div>
                              {note.creator === userEmail &&
                                    <Tooltip title='edit'>
                                      <IconButton disabled={disableSaveEdit} onClick={() => handleClickAction(idx, "edit", newText)}>
                                        {editMode ? <DoneAllIcon sx={styles.icon}/> : <EditIcon sx={styles.icon}/>}
                                      </IconButton>
                                    </Tooltip>
                              }
                              {!note.isReply && 
                                    <Tooltip title='resolve'>
                                      <IconButton disabled={editMode} onClick={() => handleClickAction(idx, "resolve")}>
                                        <CheckIcon sx={styles.icon}/>
                                      </IconButton>
                                    </Tooltip>
                              }
                              {!note.isReply && 
                                    <Tooltip title='reply'>
                                      <IconButton disabled={editMode} onClick={() => handleClickAction(idx, "reply")}>
                                        <ReplyIcon sx={styles.icon}/>
                                      </IconButton>
                                    </Tooltip>
                              }
                              {note.creator === userEmail &&
                                    <Tooltip title='delete'>
                                      <IconButton disabled={editMode} onClick={() => handleClickAction(idx, "delete")}>
                                        <DeleteIcon sx={styles.icon}/>
                                      </IconButton>
                                    </Tooltip>
                              }
                            </div>
              } 
                            
            </Stack>
          </Stack>
          <Tooltip title={`last updated on ${formatDateTime(note.lastUpdated || -1)}`} enterDelay={1000}>
            <Typography sx={styles.metadata}>
                            - <i>{note.creator || "unknown"}</i>, {formatDateTime(note.timestamp || -1)}
            </Typography>
          </Tooltip>
                    
        </div>
                
      </Typography>

      {note.replies && note.replies.map((replyIdx) => {
        return <IndividualNote
          recordNotes={recordNotes}
          key={replyIdx}
          note={recordNotes[replyIdx]}
          idx={replyIdx}
          editMode={editIdx === replyIdx}
          handleClickAction={handleClickAction}
          userEmail={userEmail}
          replyToIdx={replyToIdx}
          editIdx={editIdx}
          childOfResolved={note.resolved}
        />;
      })}
      {note.resolved && 
                <div>
                  <div style={styles.indentedDivider}>
                    <Divider />
                  </div>
                  <Typography component={"div"} sx={styles.resolvedTypography}>
                    <i style={styles.metadata}>
                            Resolved by {note.lastUpdatedUser || "unknown"}, {formatDateTime(note.lastUpdated || -1)}
                    </i>
                  </Typography>
                </div>
      }
      {
        replyToIdx === idx && 
                <div style={styles.replyDiv}>
                  <TextField
                    id='reply-textfield'
                    fullWidth
                    required
                    variant='outlined'
                    placeholder='Reply to note...'
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    sx={styles.textfield}
                  />
                  <Stack direction={"row"} justifyContent={"space-between"}>
                    <div></div>
                    <div style={{padding: "8px"}}>
                      <Button onClick={clickCancel}>Cancel</Button>
                      <Button 
                        variant='contained'
                        onClick={clickSubmit}
                        disabled={replyText === ""}
                      >
                                Reply
                      </Button>
                    </div>
                  </Stack>
                </div>
                

      }
            
    </div>
        
  );
};
export default RecordNotesDialog;