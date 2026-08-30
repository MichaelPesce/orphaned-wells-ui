import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import CancelIcon from "@mui/icons-material/Cancel";
import { styles as sharedStyles } from "../../styles";
import { User } from "../../types";

interface UsersTableProps {
  currentUser: User;
  users: User[];
  setSelectedUser: (user: User) => void;
  setShowChangeRoleDialog: (show: boolean) => void;
  setShowDeleteUserModal: (show: boolean) => void;
  hasPermission: (permission: string) => boolean;
}

const formatRoleName = (role: string) => role.replaceAll("_", " ");

const UsersTable = ({
  currentUser,
  users,
  setSelectedUser,
  setShowChangeRoleDialog,
  setShowDeleteUserModal,
  hasPermission,
}: UsersTableProps) => {
  const handleDeleteUser = (user: User) => {
    setShowDeleteUserModal(true);
    setSelectedUser(user);
  };

  const handleClickChangeRole = (row: User) => {
    setSelectedUser(row);
    setShowChangeRoleDialog(true);
  };

  const renderRoles = (row: User) => {
    const systemRoles = row.roles?.system || [];
    const teamRoles = row.roles?.team?.[currentUser.default_team] || [];

    if (!systemRoles.length && !teamRoles.length) return null;

    return (
      <Stack spacing={0.75} alignItems="flex-start">
        {systemRoles.length > 0 && (
          <RoleLine label="System" roles={systemRoles} />
        )}
        {teamRoles.length > 0 && (
          <RoleLine label={currentUser.default_team} roles={teamRoles} />
        )}
      </Stack>
    );
  };

  if (!currentUser) return null;

  return (
    <TableContainer component={Paper}>
      <Box sx={{ p: 2, borderBottom: "1px solid #F5F5F6" }}>
        <Typography variant="h6">Users</Typography>
      </Box>
      <Table sx={{ minWidth: 650 }} aria-label="users table" size="small">
        <TableHead>
          <TableRow>
            {[["Name", "22%"], ["Email", "28%"], ["Roles", "34%"], ["Actions", "16%"]].map((value) => (
              <TableCell width={value[1]} sx={sharedStyles.headerRow} key={value[0]}>{value[0]}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((row) => (
            <TableRow
              key={row.email}
              sx={{
                "&:hover": {
                  background: "#efefef"
                },
              }}
            >
              <TableCell component="th" scope="row">
                {row.name}
              </TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{renderRoles(row)}</TableCell>
              <TableCell>
                {hasPermission("manage_team") && (
                  <Tooltip title="Update roles">
                    <IconButton
                      aria-label={`Update roles for ${row.email}`}
                      color="primary"
                      onClick={()=> handleClickChangeRole(row)}
                    >
                      <ManageAccountsIcon/>
                    </IconButton>
                  </Tooltip>
                )}
                {hasPermission("delete") && (
                  <Tooltip title="Remove user">
                    <IconButton
                      aria-label={`Remove ${row.email}`}
                      color="error"
                      onClick={() => handleDeleteUser(row)}
                    >
                      <CancelIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface RoleLineProps {
  label: string;
  roles: string[];
}

const RoleLine = ({ label, roles }: RoleLineProps) => (
  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
    <Typography variant="body2" sx={{ minWidth: 72, color: "text.secondary" }}>
      {label}
    </Typography>
    {roles.map((role) => (
      <Chip
        key={role}
        label={formatRoleName(role)}
        size="small"
        variant="outlined"
        sx={{ textTransform: "capitalize" }}
      />
    ))}
  </Stack>
);

export default UsersTable;
