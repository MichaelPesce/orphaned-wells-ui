import { useState, useEffect, useCallback } from "react";
import { Box, Tab, Tabs } from "@mui/material";
import Subheader from "../../components/Subheader/Subheader";
import PopupModal from "../../components/PopupModal/PopupModal";
import ErrorBar from "../../components/ErrorBar/ErrorBar";
import ChangeRoleDialog from "../../components/ChangeRoleDialog/ChangeRoleDialog";
import { getUsers, addUser, deleteUser } from "../../services/app.service";
import { useUserContext } from "../../usercontext";
import { callAPI } from "../../util";
import { User } from "../../types";
import UsersTable from "./UsersTable";
import RolePermissionsPanel from "./RolePermissionsPanel";

type AdminSection = "users" | "roles";

const AdminPage = () => {
  const { user, hasPermission, handleSuccessfulAuthentication } = useUserContext();
  const [users, setUsers] = useState<User[]>([]);
  const [unableToConnect, setUnableToConnect] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState("");
  const [disableSubmitNewUserButton, setDisableSubmitNewUserButton] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>("");
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);
  const [activeSection, setActiveSection] = useState<AdminSection>("users");
  const canManageRolePermissions = hasPermission("system_administration");

  const styles = {
    outerBox: {
      backgroundColor: "#F5F5F6",
      minHeight: "100vh"
    },
    innerBox: {
      paddingY: 5,
      paddingX: 5,
    },
  };

  const handleAuthSuccess = useCallback((data: any[]) => {
    setUsers(data);
  }, []);

  const handleAuthError = useCallback((e: any) => {
    console.error(e);
    setUnableToConnect(true);
  }, []);

  const fetchUsers = useCallback(() => {
    callAPI(getUsers, [], handleAuthSuccess, handleAuthError);
  }, [handleAuthSuccess, handleAuthError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setDisableSubmitNewUserButton(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser));
  }, [newUser]);

  useEffect(() => {
    if (!canManageRolePermissions && activeSection === "roles") {
      setActiveSection("users");
    }
  }, [canManageRolePermissions, activeSection]);

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
        {!unableToConnect ?
          <>
            {canManageRolePermissions && (
              <Tabs
                value={activeSection}
                onChange={(_event, value: AdminSection) => setActiveSection(value)}
                sx={{ mb: 2 }}
                aria-label="admin sections"
              >
                <Tab data-cy="admin-users-section" label="Users" value="users" />
                <Tab data-cy="admin-roles-section" label="Roles & Permissions" value="roles" />
              </Tabs>
            )}
            {activeSection === "users" && (
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
          </>
          :
          <h1>You are not authorized to view this page.</h1>
        }
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
