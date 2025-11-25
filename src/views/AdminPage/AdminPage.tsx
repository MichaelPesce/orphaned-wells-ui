import { useState, useEffect } from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { IconButton, Tooltip } from "@mui/material";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CancelIcon from "@mui/icons-material/Cancel";
import Subheader from "../../components/Subheader/Subheader";
import PopupModal from "../../components/PopupModal/PopupModal";
import ErrorBar from "../../components/ErrorBar/ErrorBar";
import ChangeRoleDialog from "../../components/ChangeRoleDialog/ChangeRoleDialog";
import { getUsers, addUser, deleteUser } from "../../services/app.service";
import { useUserContext } from "../../usercontext";
import { callAPI } from "../../util";
import { User } from "../../types";

const AdminPage = () => {
  const { user, userPermissions } = useUserContext();
  const [users, setUsers] = useState<User[]>([]);
  const [unableToConnect, setUnableToConnect] = useState(false);
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState("");
  const [disableSubmitNewUserButton, setDisableSubmitNewUserButton] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>("");
  const [showChangeRoleDialog, setShowChangeRoleDialog] = useState(false);

  const styles = {
    outerBox: {
      backgroundColor: "#F5F5F6",
      height: "100vh"
    },
    innerBox: {
      paddingY: 5,
      paddingX: 5,
    },
  };

  useEffect(() => {
    callAPI(getUsers, [], handleAuthSuccess, handleAuthError);
  }, []);

  useEffect(() => {
    setDisableSubmitNewUserButton(!emailIsValid(newUser));
  }, [newUser]);

  const emailIsValid = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleAuthSuccess = (data: any[]) => {
    setUsers(data);
  };

  const handleAuthError = (e: any) => {
    console.error(e);
    setUnableToConnect(true);
  };

  const handleAddUser = () => {
    callAPI(addUser, [newUser], handleSuccess, (e) => handleUserError("unable to add user", e));
  };

  const handleDeleteUser = () => {
    callAPI(deleteUser, [selectedUser?.email], handleSuccess, (e) => handleUserError("unable to delete user", e));
  };

  const handleSuccess = () => {
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleClose = () => {
    setSelectedUser(null);
    setShowNewUserModal(false);
    setNewUser("");
    setShowDeleteUserModal(false);
  };

  const handleUserError = (message: string, e: string) => {
    setErrorMsg(e);
  };

  return (
    <Box sx={styles.outerBox}>
      <Subheader
        currentPage="Admin"
        buttonName={(userPermissions && userPermissions.includes("add_user")) ? "+ Add user" : undefined}
        handleClickButton={() => setShowNewUserModal(true)}
      />
      <Box sx={styles.innerBox}>
        {!unableToConnect ?
          <UsersTable
            user={user}
            users={users}
            setSelectedUser={setSelectedUser}
            setShowChangeRoleDialog={setShowChangeRoleDialog}
            setShowDeleteUserModal={setShowDeleteUserModal}
            userPermissions={userPermissions}
          />
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
        userPermissions={userPermissions}
      />
      <ErrorBar 
        duration={10000} 
        setErrorMessage={setErrorMsg} 
        errorMessage={errorMsg} 
      />
    </Box>
  );
};

interface UsersTableProps {
    user: User;
    users: User[];
    setSelectedUser: (user: any) => void;
    setShowChangeRoleDialog: (show: boolean) => void;
    setShowDeleteUserModal: (show: boolean) => void;
    userPermissions: any;
}

const UsersTable = ({ user, users, setSelectedUser, setShowChangeRoleDialog, setShowDeleteUserModal, userPermissions }: UsersTableProps) => {
    

  const styles = {
    headerRow: {
      fontWeight: "bold"
    },
    userRow: {
      "&:hover": {
        background: "#efefef"
      },
    }
  };

  const handleDeleteUser = (user: User) => {
    setShowDeleteUserModal(true);
    setSelectedUser(user);
  };

  const handleClickChangeRole = (row: User) => {
    setSelectedUser(row);
    setShowChangeRoleDialog(true);
  };

  const getRole = (roles: any) => {
    if (roles.team && roles.team[user.default_team]) {
      let team_roles = roles.team[user.default_team];
      return team_roles.map((role: string, idx: number)=> {
        if (idx === team_roles.length-1) return role.replace("_", " ");
        return role.replace("_", " ")+", ";
      });
    }
    return null;
  };

  if (user) return (
    <TableContainer component={Paper}>
      <h1>Users</h1>
      <Table sx={{ minWidth: 650, borderTop: "5px solid #F5F5F6" }} aria-label="pending users table" size="small">
        <TableHead>
          <TableRow>
            {[["Name", "25%"], ["Email", "25%"], ["Roles", "25%"], ["Actions", "25%"]].map((value) => (
              <TableCell width={value[1]} sx={styles.headerRow} key={value[0]}>{value[0]}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((row) => (
            <TableRow
              key={row.email}
              sx={styles.userRow}
            >
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{getRole(row.roles)}</TableCell>
              <TableCell>
                {userPermissions && userPermissions.includes("manage_team") &&
                                <Tooltip title="Update Roles">
                                  <IconButton color="primary" onClick={()=> handleClickChangeRole(row)}>
                                    <ManageAccountsIcon/>
                                  </IconButton>
                                </Tooltip>
                }
                {userPermissions && userPermissions.includes("delete") &&
                                <Tooltip title="Remove User">
                                  <IconButton color="error" onClick={() => handleDeleteUser(row)}><CancelIcon /></IconButton>
                                </Tooltip>
                }
                                
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
  else return (
    <div>

    </div>
  );
};

export default AdminPage;