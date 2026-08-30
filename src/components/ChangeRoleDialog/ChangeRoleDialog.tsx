import { useEffect, useState, useRef } from "react";
import { callAPI } from "../../util";
import { fetchRoles, updateUserRoles } from "../../services/app.service";
import { IconButton, Grid, Button, Chip } from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ErrorBar from "../ErrorBar/ErrorBar";
import CheckIcon from "@mui/icons-material/Check";
import { RoleCategory, RoleDefinition, UpdateUserRolesRequest, User } from "../../types";

interface ChangeRoleDialogProps {
    open: boolean;
    selectedUser: User | null;
    onClose: () => void;
    team?: string;
    hasPermission: (permission: string) => boolean;
    onSaved?: () => void;
}

const emptyRoles: Record<RoleCategory, string[]> = {
  system: [],
  team: [],
};

const getApiErrorMessage = (error: any, fallback: string) => {
  if (typeof error === "string") return error;
  return error?.message || error?.detail || fallback;
};

const ChangeRoleDialog = ({ open, selectedUser, onClose, team, hasPermission, onSaved }: ChangeRoleDialogProps) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<RoleDefinition[]>([]);
  const [newRoles, setNewRoles] = useState<Record<RoleCategory, string[]>>(emptyRoles);
  const [loading, setLoading] = useState(false);
  const dialogHeight = "30vh";
  const dialogWidth = "40vw";
  const isSysAdmin = hasPermission("system_administration");

  const descriptionElementRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
      setLoading(true);
      const role_categories: RoleCategory[] = ["team"];
      if (isSysAdmin) role_categories.push("system");
      callAPI(fetchRoles, [role_categories], handleFetchedAvailableRoles, handleFailedFetchRoles);
    }
  }, [open, isSysAdmin]);

  useEffect(() => {
    if (selectedUser) {
      const teamRoles = team ? selectedUser.roles?.team?.[team] || [] : [];
      const sysRoles = selectedUser.roles?.system || [];
      setNewRoles({system: [...sysRoles], team: [...teamRoles]});
    }
  }, [selectedUser, team]);


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
    setErrorMsg(getApiErrorMessage(e, "Unable to fetch roles."));
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  const updateUserRolesRequest = (data: UpdateUserRolesRequest) => {
    return new Promise<void>((resolve, reject) => {
      callAPI(updateUserRoles, [data], () => resolve(), reject);
    });
  };

  const handleUpdateRoles = async () => {
    if (!selectedUser?.email || !team) return;

    setLoading(true);
    setErrorMsg(null);
    const updates: UpdateUserRolesRequest[] = [];
    if (isSysAdmin) {
      updates.push({
        role_category: "system",
        new_roles: newRoles.system,
        email: selectedUser?.email
      });
    }
    updates.push({
      role_category: "team",
      new_roles: newRoles.team,
      email: selectedUser?.email
    });

    try {
      for (const update of updates) {
        await updateUserRolesRequest(update);
      }
      setLoading(false);
      if (onSaved) onSaved();
      else onClose();
    } catch (e: any) {
      setLoading(false);
      failedUpdate(e);
    }
  };

  const handleSelect = (role: RoleDefinition) => {
    const role_id = role?.id;
    const role_category = role?.category;
    const currentRoles = newRoles[role_category] || [];
    const nextRoles = currentRoles.includes(role_id)
      ? currentRoles.filter((currentRole) => currentRole !== role_id)
      : [...currentRoles, role_id];
    setNewRoles({...newRoles, [role_category]: nextRoles});
  };

  const failedUpdate = (e: any) => {
    setErrorMsg(getApiErrorMessage(e, "Unable to update roles."));
  };

  const hasRole = (role: RoleDefinition) => {
    const role_id = role?.id;
    const role_category = role?.category;
    return newRoles?.[role_category]?.includes(role_id);
  };

  const systemRoles = availableRoles.filter((role) => role.category === "system");
  const teamRoles = availableRoles.filter((role) => role.category === "team");

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
                  isSysAdmin && (
                    <Grid item xs={12}>
                      <h6 style={{padding: 0, margin: 0}}>System Roles</h6>
                      {systemRoles.map((role) => (
                        <Chip 
                          key={role.id}
                          color={"primary"}
                          sx={hasRole(role) ? styles.chip.filled : styles.chip.unfilled}
                          label={role.name}
                          variant={hasRole(role) ? "filled" : "outlined"}
                          icon={hasRole(role) ? <CheckIcon /> : undefined}
                          onClick={() => handleSelect(role)}
                        />
                      ))}
                    </Grid>
                  )
                }


                <Grid item xs={12}>
                  <h6 style={{padding: 0, margin: 0}}>Team Roles for {team}</h6>
                  {teamRoles.map((role) => (
                    <Chip
                      key={role.id}
                      color={"primary"}
                      sx={hasRole(role) ? styles.chip.filled : styles.chip.unfilled}
                      label={role.name}
                      variant={hasRole(role) ? "filled" : "outlined"}
                      icon={hasRole(role) ? <CheckIcon /> : undefined}
                      onClick={() => handleSelect(role)}
                    />
                  ))}
                </Grid>
                                
              </Grid>
            )
          }
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          disabled={loading}
          onClick={handleUpdateRoles}
        >
          Update Roles
        </Button>
      </DialogActions>
      <ErrorBar
        errorMessage={errorMsg}
        setErrorMessage={setErrorMsg}
      />
    </Dialog>
  );
};

export default ChangeRoleDialog;
