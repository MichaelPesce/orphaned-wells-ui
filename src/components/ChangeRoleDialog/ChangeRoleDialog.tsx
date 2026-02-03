import React, { useEffect, useState, useRef } from "react";
import { callAPI } from "../../util";
import { fetchRoles, updateUserRoles } from "../../services/app.service";
import { IconButton, Grid, Button, Chip } from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogContentText } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ErrorBar from "../ErrorBar/ErrorBar";
import CheckIcon from "@mui/icons-material/Check";

interface ChangeRoleDialogProps {
    open: boolean;
    selectedUser: any;
    onClose: () => void;
    team: string;
    hasPermission: (permission: string) => boolean;
}

const ChangeRoleDialog = ({ open, selectedUser, onClose, team, hasPermission }: ChangeRoleDialogProps) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [newRoles, setNewRoles] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const dialogHeight = "30vh";
  const dialogWidth = "40vw";
  const is_sys_admin = hasPermission("system_administration");

  const descriptionElementRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
      const role_categories = ["team"];
      if (is_sys_admin) role_categories.push("system");
      callAPI(fetchRoles, [role_categories], handleFetchedAvailableRoles, handleFailedFetchRoles);
    }
  }, [open]);

  useEffect(() => {
    let initialRoles = selectedUser?.roles;
    if (initialRoles) {
      const teamRoles = initialRoles.team[team];
      const sysRoles = initialRoles.system;
      setNewRoles({system: sysRoles, team: teamRoles});
    }
  }, [selectedUser]);


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
    dialogTitle: {
      mx: 2
    }
  };

  const handleFetchedAvailableRoles = (data: any) => {
    setAvailableRoles(data);
    setLoading(false);
  };

  const handleFailedFetchRoles = (e: any) => {
    setLoading(false);
    console.error("unable to fetch roles "+e);
  };

  const handleClose = () => {
    onClose();
  };

  const handleUpdateRoles = () => {
    let data;
    if (is_sys_admin) {
      data = {
        role_category: "system",
        new_roles: newRoles.system,
        email: selectedUser?.email
      };
      callAPI(updateUserRoles, [data], (data: any) => console.debug("successfully updated system roles"), failedUpdate);
    }
    data = {
      role_category: "team",
      new_roles: newRoles.team,
      email: selectedUser?.email
    };
    callAPI(updateUserRoles, [data], (data: any) => window.location.reload(), failedUpdate);
  };

  const handleSelect = (role: any) => {
    const role_id = role?.id;
    const role_category = role?.category;

    const tempNewRoles = {...newRoles};
    if (tempNewRoles[role_category] !== undefined) {
      // check if this role is already there
      const role_index = tempNewRoles[role_category].indexOf(role_id);
      if (role_index > -1) {
        tempNewRoles[role_category].splice(role_index, 1);
      } else {
        tempNewRoles[role_category].push(role_id);
      }
    } else {
      tempNewRoles[role_category] = [role_id];
    }
    setNewRoles(tempNewRoles);
  };

  const failedUpdate = (e: string) => {
    setErrorMsg(e);
  };

  const hasRole = (role: any) => {
    const role_id = role?.id;
    const role_category = role?.category;
    if (newRoles?.[role_category]?.includes(role_id)) return true;
    else return false;
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      scroll={"paper"}
      aria-labelledby="new-dg-dialog"
      aria-describedby="new-dg-dialog-description"
      PaperProps={{
        sx: styles.dialogPaper
      }}
    >
      <DialogTitle sx={styles.dialogTitle} id="new-dg-dialog-title">Assign roles for {selectedUser?.name || selectedUser?.email || ""}</DialogTitle>
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
          aria-labelledby="new-dg-dialog-content-text"
          component={"span"}
        >
          {
            !loading && (
              <Grid container>
                {
                  is_sys_admin && (
                    <Grid item xs={12}>
                      <h6 style={{padding: 0, margin: 0}}>System Roles</h6>
                      {availableRoles.map((role) => {
                        if (role.category === "system")
                          return (
                            <Chip 
                              key={role.id}
                              color={"primary"}
                              sx={hasRole(role) ? styles.chip.filled : styles.chip.unfilled}
                              label={role.name}
                              variant={hasRole(role) ? "filled" : "outlined"}
                              icon={hasRole(role) ? <CheckIcon /> : undefined}
                              onClick={() => handleSelect(role)}
                            />
                          );
                      })}
                    </Grid>
                  )
                }
                                

                <Grid item xs={12}>
                  <h6 style={{padding: 0, margin: 0}}>Team Roles for {team}</h6>
                  {availableRoles.map((role) => {
                    if (role.category === "team")
                      return (
                        <Chip 
                          key={role.id}
                          color={"primary"}
                          sx={hasRole(role) ? styles.chip.filled : styles.chip.unfilled}
                          label={role.name}
                          variant={hasRole(role) ? "filled" : "outlined"}
                          icon={hasRole(role) ? <CheckIcon /> : undefined}
                          onClick={() => handleSelect(role)}
                        />
                      );
                  })}
                </Grid>
                                
              </Grid>
            )
          }
        </DialogContentText>
        <Button
          variant="contained"
          sx={{
            position: "absolute",
            right: 10,
            bottom: 10,
          }}
          onClick={handleUpdateRoles}
        >
                    Update Roles
        </Button>
      </DialogContent>
      <ErrorBar
        errorMessage={errorMsg}
        setErrorMessage={setErrorMsg}
      />
    </Dialog>
  );
};

export default ChangeRoleDialog;