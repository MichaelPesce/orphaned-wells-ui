import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";
import EmptyTable from "../../components/EmptyTable/EmptyTable";
import {
  fetchPermissionCatalog,
  fetchRoles,
  updateRolePermissions,
} from "../../services/app.service";
import { callAPI } from "../../util";
import {
  RoleCategory,
  RoleDefinition,
  UpdateRolePermissionsRequest,
} from "../../types";

interface RolePermissionsPanelProps {
  onError: (message: string | null) => void;
  onSaved: () => void;
}

interface PermissionGroup {
  label: string;
  permissions: string[];
}

const roleCategories: { label: string; value: RoleCategory }[] = [
  { label: "System", value: "system" },
  { label: "Team", value: "team" },
];

const permissionGroups: PermissionGroup[] = [
  {
    label: "Administration",
    permissions: [
      "system_administration",
      "manage_system",
      "manage_team",
      "add_user",
      "create_team",
      "developer",
    ],
  },
  {
    label: "Projects",
    permissions: [
      "create_project",
      "manage_project",
      "view_project",
    ],
  },
  {
    label: "Record Groups",
    permissions: [
      "create_record_group",
      "upload_document",
    ],
  },
  {
    label: "Records",
    permissions: [
      "review_record",
      "verify_record",
      "clean_record",
      "delete",
    ],
  },
  {
    label: "Schema",
    permissions: [
      "manage_schema",
    ],
  },
];

const roleKey = (role: Pick<RoleDefinition, "category" | "id">) => `${role.category}:${role.id}`;

const sortPermissions = (permissions: string[]) => {
  return Array.from(new Set(permissions)).sort((a, b) => a.localeCompare(b));
};

const samePermissions = (first: string[], second: string[]) => {
  const sortedFirst = sortPermissions(first);
  const sortedSecond = sortPermissions(second);
  if (sortedFirst.length !== sortedSecond.length) return false;
  return sortedFirst.every((permission, idx) => permission === sortedSecond[idx]);
};

const formatPermissionName = (permission: string) => {
  return permission
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getApiErrorMessage = (error: any, fallback: string) => {
  if (typeof error === "string") return error;
  return error?.message || error?.detail || fallback;
};

function callAPIAsPromise<T>(
  apiFunc: (...args: any[]) => Promise<Response>,
  apiParams: any[]
) {
  return new Promise<T>((resolve, reject) => {
    callAPI(apiFunc, apiParams, resolve, reject);
  });
}

const createDraftPermissions = (roles: RoleDefinition[]) => {
  return roles.reduce<Record<string, string[]>>((draft, role) => {
    draft[roleKey(role)] = sortPermissions(role.permissions || []);
    return draft;
  }, {});
};

const RolePermissionsPanel = ({ onError, onSaved }: RolePermissionsPanelProps) => {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<string[]>([]);
  const [draftPermissions, setDraftPermissions] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<RoleCategory>("system");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addPermissionOpen, setAddPermissionOpen] = useState(false);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedRoles, fetchedPermissions] = await Promise.all([
        callAPIAsPromise<RoleDefinition[]>(fetchRoles, [["system", "team"]]),
        callAPIAsPromise<string[]>(fetchPermissionCatalog, [["system", "team"]]),
      ]);
      const supportedRoles = fetchedRoles
        .filter((role) => role.category === "system" || role.category === "team")
        .sort((a, b) => {
          if (a.category !== b.category) return a.category.localeCompare(b.category);
          return a.name.localeCompare(b.name);
        });
      setRoles(supportedRoles);
      setPermissionCatalog(sortPermissions(fetchedPermissions));
      setDraftPermissions(createDraftPermissions(supportedRoles));
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      onError(getApiErrorMessage(e, "Unable to load role permissions."));
    }
  }, [onError]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const categoryRoles = useMemo(() => {
    return roles.filter((role) => role.category === selectedCategory);
  }, [roles, selectedCategory]);

  const allPermissionOptions = useMemo(() => {
    const permissions = new Set<string>();
    permissionGroups.forEach((group) => {
      group.permissions.forEach((permission) => permissions.add(permission));
    });
    permissionCatalog.forEach((permission) => permissions.add(permission));
    Object.values(draftPermissions).forEach((rolePermissions) => {
      rolePermissions.forEach((permission) => permissions.add(permission));
    });
    return sortPermissions(Array.from(permissions));
  }, [permissionCatalog, draftPermissions]);

  const displayedPermissionGroups = useMemo(() => {
    const activePermissions = new Set(allPermissionOptions);
    const groupedPermissions = new Set<string>();
    const displayedGroups = permissionGroups
      .map((group) => {
        group.permissions.forEach((permission) => groupedPermissions.add(permission));
        return {
          label: group.label,
          permissions: group.permissions.filter((permission) => activePermissions.has(permission)),
        };
      })
      .filter((group) => group.permissions.length > 0);

    const otherPermissions = allPermissionOptions.filter((permission) => !groupedPermissions.has(permission));
    if (otherPermissions.length > 0) {
      displayedGroups.push({
        label: "Other",
        permissions: otherPermissions,
      });
    }
    return displayedGroups;
  }, [allPermissionOptions]);

  const changedRoles = useMemo(() => {
    return roles.filter((role) => {
      return !samePermissions(draftPermissions[roleKey(role)] || [], role.permissions || []);
    });
  }, [roles, draftPermissions]);

  const isDirty = changedRoles.length > 0;

  const handleChangeCategory = (_event: any, nextCategory: RoleCategory | null) => {
    if (nextCategory) setSelectedCategory(nextCategory);
  };

  const roleHasPermission = (role: RoleDefinition, permission: string) => {
    return (draftPermissions[roleKey(role)] || []).includes(permission);
  };

  const handleTogglePermission = (role: RoleDefinition, permission: string) => {
    setDraftPermissions((currentDraft) => {
      const key = roleKey(role);
      const currentPermissions = currentDraft[key] || [];
      const nextPermissions = currentPermissions.includes(permission)
        ? currentPermissions.filter((currentPermission) => currentPermission !== permission)
        : sortPermissions([...currentPermissions, permission]);
      return {
        ...currentDraft,
        [key]: nextPermissions,
      };
    });
  };

  const handleAddPermission = (permission: string, selectedRoleKeys: string[]) => {
    const normalizedPermission = permission.trim();
    if (!normalizedPermission || selectedRoleKeys.length === 0) return;

    setPermissionCatalog((currentCatalog) => sortPermissions([...currentCatalog, normalizedPermission]));
    setDraftPermissions((currentDraft) => {
      const nextDraft = {...currentDraft};
      selectedRoleKeys.forEach((selectedRoleKey) => {
        const currentPermissions = nextDraft[selectedRoleKey] || [];
        if (!currentPermissions.includes(normalizedPermission)) {
          nextDraft[selectedRoleKey] = sortPermissions([...currentPermissions, normalizedPermission]);
        }
      });
      return nextDraft;
    });
    setAddPermissionOpen(false);
  };

  const handleDiscardChanges = () => {
    setDraftPermissions(createDraftPermissions(roles));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      for (const role of changedRoles) {
        const data: UpdateRolePermissionsRequest = {
          role_id: role.id,
          category: role.category,
          permissions: draftPermissions[roleKey(role)] || [],
        };
        await callAPIAsPromise<RoleDefinition>(updateRolePermissions, [data]);
      }
      await loadRoles();
      setSaving(false);
      onSaved();
    } catch (e: any) {
      setSaving(false);
      onError(getApiErrorMessage(e, "Unable to update role permissions."));
    }
  };

  return (
    <Paper>
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #F5F5F6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="h6">Roles & Permissions</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <ToggleButtonGroup
            color="primary"
            exclusive
            size="small"
            value={selectedCategory}
            onChange={handleChangeCategory}
            aria-label="role category"
          >
            {roleCategories.map((roleCategory) => (
              <ToggleButton key={roleCategory.value} value={roleCategory.value}>
                {roleCategory.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Button
            data-cy="add-role-permission"
            startIcon={<AddIcon />}
            variant="outlined"
            disabled={loading || saving || categoryRoles.length === 0}
            onClick={() => setAddPermissionOpen(true)}
          >
            Add permission
          </Button>
        </Stack>
      </Box>
      {(loading || saving) && <LinearProgress />}
      {!loading && categoryRoles.length === 0 ? (
        <EmptyTable
          title="No roles found"
          message={`No ${selectedCategory} roles are available.`}
        />
      ) : (
        <TableContainer sx={{ maxHeight: "60vh" }}>
          <Table stickyHeader sx={{ minWidth: 760 }} size="small" aria-label="role permissions table">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: "bold",
                    width: 280,
                    backgroundColor: "white",
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                  }}
                >
                  Permission
                </TableCell>
                {categoryRoles.map((role) => (
                  <TableCell
                    key={roleKey(role)}
                    align="center"
                    sx={{ fontWeight: "bold", minWidth: 150 }}
                  >
                    {role.name}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedPermissionGroups.map((group) => (
                <Fragment key={group.label}>
                  <TableRow>
                    <TableCell
                      colSpan={categoryRoles.length + 1}
                      sx={{
                        fontWeight: "bold",
                        backgroundColor: "#F5F5F6",
                        borderTop: "1px solid #E0E0E0",
                      }}
                    >
                      {group.label}
                    </TableCell>
                  </TableRow>
                  {group.permissions.map((permission) => (
                    <TableRow
                      key={permission}
                      hover
                      data-cy="role-permission-row"
                      data-permission={permission}
                    >
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          backgroundColor: "white",
                          position: "sticky",
                          left: 0,
                          zIndex: 1,
                        }}
                      >
                        <Stack spacing={0.25}>
                          <Typography variant="body2">{formatPermissionName(permission)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {permission}
                          </Typography>
                        </Stack>
                      </TableCell>
                      {categoryRoles.map((role) => (
                        <TableCell key={`${roleKey(role)}:${permission}`} align="center">
                          <Tooltip title={`${role.name}: ${permission}`}>
                            <Checkbox
                              checked={roleHasPermission(role, permission)}
                              disabled={saving}
                              onChange={() => handleTogglePermission(role, permission)}
                              inputProps={{
                                "aria-label": `${role.name} ${permission}`,
                              }}
                            />
                          </Tooltip>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {isDirty && (
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid #F5F5F6",
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button
            startIcon={<UndoIcon />}
            disabled={saving}
            onClick={handleDiscardChanges}
          >
            Discard
          </Button>
          <Button
            data-cy="save-role-permissions"
            startIcon={<SaveIcon />}
            variant="contained"
            disabled={saving}
            onClick={handleSaveChanges}
          >
            Save changes
          </Button>
        </Box>
      )}
      <AddPermissionDialog
        open={addPermissionOpen}
        roles={categoryRoles}
        permissionOptions={allPermissionOptions}
        onClose={() => setAddPermissionOpen(false)}
        onAdd={handleAddPermission}
      />
    </Paper>
  );
};

interface AddPermissionDialogProps {
  open: boolean;
  roles: RoleDefinition[];
  permissionOptions: string[];
  onClose: () => void;
  onAdd: (permission: string, selectedRoleKeys: string[]) => void;
}

const AddPermissionDialog = ({
  open,
  roles,
  permissionOptions,
  onClose,
  onAdd,
}: AddPermissionDialogProps) => {
  const [permission, setPermission] = useState("");
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setPermission("");
      setSelectedRoleKeys([]);
    }
  }, [open]);

  const handleToggleRole = (selectedRoleKey: string) => {
    setSelectedRoleKeys((currentRoleKeys) => (
      currentRoleKeys.includes(selectedRoleKey)
        ? currentRoleKeys.filter((currentRoleKey) => currentRoleKey !== selectedRoleKey)
        : [...currentRoleKeys, selectedRoleKey]
    ));
  };

  const handleAdd = () => {
    onAdd(permission, selectedRoleKeys);
  };

  const normalizedPermission = permission.trim();
  const canAddPermission = normalizedPermission !== "" && selectedRoleKeys.length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="add-permission-dialog-title"
    >
      <DialogTitle id="add-permission-dialog-title">Add permission</DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: "absolute",
          right: 0,
          top: 8,
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Autocomplete
            freeSolo
            options={permissionOptions}
            inputValue={permission}
            onInputChange={(_event, value) => setPermission(value)}
            onChange={(_event, value) => {
              if (typeof value === "string") setPermission(value);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                autoFocus
                label="Permission"
                variant="standard"
              />
            )}
          />
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Roles
            </Typography>
            <Stack spacing={0.5}>
              {roles.map((role) => {
                const selectedRoleKey = roleKey(role);
                return (
                  <FormControlLabel
                    key={selectedRoleKey}
                    control={
                      <Checkbox
                        checked={selectedRoleKeys.includes(selectedRoleKey)}
                        onChange={() => handleToggleRole(selectedRoleKey)}
                      />
                    }
                    label={role.name}
                  />
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!canAddPermission}
          onClick={handleAdd}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RolePermissionsPanel;
