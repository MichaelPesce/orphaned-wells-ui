import { useState, useEffect, useCallback } from "react";
import { Alert, Box, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import Subheader from "../../components/Subheader/Subheader";
import PopupModal from "../../components/PopupModal/PopupModal";
import ErrorBar from "../../components/ErrorBar/ErrorBar";
import ChangeRoleDialog from "../../components/ChangeRoleDialog/ChangeRoleDialog";
import { useNavigate } from "react-router-dom";
import { getUsers, addUser, deleteUser } from "../../services/app.service";
import { useUserContext } from "../../usercontext";
import { callAPI } from "../../util";
import { User } from "../../types";
import UsersTable from "./UsersTable";
import RolePermissionsPanel from "./RolePermissionsPanel";
import UploadHistoryPanel from "../../components/UploadHistory/UploadHistoryPanel";

type AdminSection = "users" | "roles" | "uploads";

const AdminPage = () => {
  const navigate = useNavigate();
  const { user, hasPermission, handleSuccessfulAuthentication } = useUserContext();
  const compactTabs = useMediaQuery(useTheme().breakpoints.down("sm"));
  const [users, setUsers] = useState<User[]>([]);
  const [unableToConnect, setUnableToConnect] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState("");
  const [disableSubmitNewUserButton, setDisableSubmitNewUserButton] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>("");
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
  const [search, setSearch] = useSearchParams();
  const canManageRolePermissions = hasPermission("system_administration");
  const tab = search.get("tab");
  const activeSection: AdminSection = tab === "uploads" ? "uploads" : tab === "roles" && canManageRolePermissions ? "roles" : "users";
  const changeSection = (section: AdminSection) => {
    setSearch(section === "users" ? {} : {tab: section});
  };

  const styles = {
    outerBox: {
      backgroundColor: "#F5F5F6",
      minHeight: "90vh"
    },
    innerBox: {
      paddingY: 3,
      paddingX: {xs: 2, md: 4},
    },
  };

  const handleAuthSuccess = useCallback((data: any[]) => {
    setUsers(data);
    setUnableToConnect(false);
  }, []);

  const handleAuthError = useCallback((e: any) => {
    console.error(e);
    setUnableToConnect(true);
  }, []);

  const fetchUsers = useCallback(() => {
    callAPI(getUsers, [], handleAuthSuccess, handleAuthError);
  }, [handleAuthSuccess, handleAuthError]);

  useEffect(() => {
    const hasAccess = hasPermission("manage_team");
    if(!hasAccess) {
      navigate("/");
      return;
    }
    if (activeSection === "users") fetchUsers();
  }, [fetchUsers, activeSection]);

  useEffect(() => {
    setDisableSubmitNewUserButton(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser));
  }, [newUser]);

  const handleAddUser = () => {
    callAPI(addUser, [newUser], handleSuccess, (e) => handleUserError("unable to add user", e));
  };

  const handleDeleteUser = () => {
    callAPI(deleteUser, [selectedUser?.email], handleSuccess, (e) => handleUserError("unable to delete user", e));
  };

  const handleSuccess = () => {
    handleClose();
    fetchUsers();
  };

  const handleClose = () => {
    setSelectedUser(null);
    setShowNewUserModal(false);
    setNewUser("");
    setShowDeleteUserModal(false);
  };

  const handleUserError = (message: string, e: any) => {
    if (typeof e === "string") setErrorMsg(e);
    else setErrorMsg(e?.detail || e?.message || message);
  };

  const handleSavedUserRoles = () => {
    setShowChangeRoleDialog(false);
    setSelectedUser(null);
    fetchUsers();
    handleSuccessfulAuthentication();
  };

  return (
    <Box sx={styles.outerBox}>
      <Subheader
        currentPage="Admin"
        buttonName={(activeSection === "users" && hasPermission("add_user")) ? "+ Add user" : undefined}
        handleClickButton={() => setShowNewUserModal(true)}
      />
      <Box sx={styles.innerBox}>
        <Tabs
          value={activeSection}
          onChange={(_event, value: AdminSection) => changeSection(value)}
          variant={compactTabs ? "fullWidth" : "scrollable"}
          scrollButtons="auto"
          sx={{ mb: 3, borderBottom: 1, borderColor: "divider", "& .MuiTab-root": {textTransform: "none", fontWeight: 600, minWidth: {xs: 0, sm: 90}, px: {xs: 1, sm: 2}, fontSize: {xs: 13, sm: 14}} }}
          aria-label="admin sections"
        >
          <Tab data-cy="admin-users-section" id="admin-tab-users" aria-controls="admin-panel-users" label="Users" value="users" />
          {canManageRolePermissions && <Tab wrapped data-cy="admin-roles-section" id="admin-tab-roles" aria-controls="admin-panel-roles" label="Roles & Permissions" value="roles" />}
          <Tab data-cy="admin-uploads-section" id="admin-tab-uploads" aria-controls="admin-panel-uploads" label="Upload history" value="uploads" />
        </Tabs>
        <Box role="tabpanel" id={`admin-panel-${activeSection}`} aria-labelledby={`admin-tab-${activeSection}`}>
          {activeSection === "users" && (unableToConnect ? <Alert severity="error">Unable to load users. Check your connection and access, then try again.</Alert> :
            <UsersTable
              currentUser={user}
              users={users}
              setSelectedUser={setSelectedUser}
              setShowChangeRoleDialog={setShowChangeRoleDialog}
              setShowDeleteUserModal={setShowDeleteUserModal}
              hasPermission={hasPermission}
            />
          )}
          {activeSection === "roles" && canManageRolePermissions && (
            <RolePermissionsPanel
              onError={setErrorMsg}
              onSaved={handleSuccessfulAuthentication}
            />
          )}
          {activeSection === "uploads" && <UploadHistoryPanel key={user?.default_team || ""} />}
        </Box>
      </Box>
      <PopupModal
        input
        open={showNewUserModal}
        handleClose={handleClose}
        text={newUser}
        textLabel='Enter email address of new user.'
        handleEditText={(e) => setNewUser(e.target.value)}
        handleSave={handleAddUser}
        buttonText='Submit'
        buttonColor='primary'
        buttonVariant='contained'
        width={600}
        disableSubmit={disableSubmitNewUserButton}
      />
      <PopupModal
        open={showDeleteUserModal}
        handleClose={handleClose}
        text="Are you sure you would like to remove this user?"
        handleSave={handleDeleteUser}
        buttonText='Remove'
        buttonColor='error'
        buttonVariant='contained'
        width={400}
      />
      <ChangeRoleDialog
        open={showChangeRoleDialog}
        selectedUser={selectedUser}
        onClose={() => setShowChangeRoleDialog(false)}
        team={user?.default_team}
        hasPermission={hasPermission}
        onSaved={handleSavedUserRoles}
      />
      <ErrorBar 
        duration={10000} 
        setErrorMessage={setErrorMsg} 
        errorMessage={errorMsg} 
      />
    </Box>
  );
};

export default AdminPage;
