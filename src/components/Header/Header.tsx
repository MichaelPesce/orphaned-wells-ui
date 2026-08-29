import "./Header.css";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { HeaderStyles as styles } from "../../styles";
import { useUserContext } from "../../usercontext";
import { changeCollaborator, changeTeam, fetchTeams, getOgrreVersion } from "../../services/app.service";
import { ChangeTeamResponse } from "../../types";
import ChangeCollaboratorDialog from "./ChangeCollaboratorDialog";
import ChangeTeamDialog from "./ChangeTeamDialog";
import OgrreVersionDialog, { OgrreVersionInfo } from "./OgrreVersionDialog";
import {
  Avatar,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Tab,
  Tabs,
} from "@mui/material";
import { logout, callAPI } from "../../util";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Logout from "@mui/icons-material/Logout";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";

const getApiErrorMessage = (error: any, fallback: string) => {
  if (typeof error === "string") return error;
  return error?.message || error?.detail || fallback;
};

const Header = (props: any) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userName, userPhoto, hasPermission, handleSuccessfulAuthentication } = useUserContext();
  const [anchorAr, setAnchorAr] = useState<null | HTMLElement>(null);
  const [profileActions, setProfileActions] = useState(false);
  const [tabValue, setTabValue] = useState("projects");
  const [teams, setTeams] = useState<string[]>([]);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [teamChangeLoading, setTeamChangeLoading] = useState(false);
  const [teamChangeError, setTeamChangeError] = useState("");
  const [collaboratorDialogOpen, setCollaboratorDialogOpen] = useState(false);
  const [collaboratorChangeLoading, setCollaboratorChangeLoading] = useState(false);
  const [collaboratorChangeError, setCollaboratorChangeError] = useState("");
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [versionInfo, setVersionInfo] = useState<OgrreVersionInfo | null>(null);
  const [versionLoading, setVersionLoading] = useState(false);
  const [versionError, setVersionError] = useState("");

  useEffect(() => {
    if (location.pathname.includes("project")) {
      setTabValue("projects");
    } else if (location.pathname.includes("records")) {
      setTabValue("records");
    } else if (location.pathname.includes("admin") || location.pathname.includes("users")) {
      setTabValue("admin");
    } else if (location.pathname.includes("schema")) {
      setTabValue("schema");
    } else {
      setTabValue("projects");
    }
    if (hasPermission("manage_system")) callAPI(fetchTeams, [], fetchedTeams, failedFetchTeams);
  }, [props, hasPermission, location]);

  const handleNavigateHome = () => {
    navigate("/");
  };

  const handleShowProfileActions = (event: React.MouseEvent<HTMLElement>) => {
    setProfileActions(!profileActions);
    setAnchorAr(event.currentTarget);
  };

  const handleTabChange = (event: React.SyntheticEvent, newLocation: string) => {
    setTabValue(newLocation);
    if (newLocation !== tabValue) {
      navigate(newLocation, { replace: true });
    } else navigate("/", { replace: true });
  };

  const handleOpenTeamDialog = () => {
    setProfileActions(false);
    setTeamChangeError("");
    setTeamDialogOpen(true);
    callAPI(fetchTeams, [], fetchedTeams, failedFetchTeams);
  };

  const handleCloseTeamDialog = () => {
    if (teamChangeLoading) return;
    setTeamDialogOpen(false);
    setTeamChangeError("");
  };

  const handleChangeTeam = (team: string) => {
    setTeamChangeLoading(true);
    setTeamChangeError("");
    callAPI(
      changeTeam,
      [{ new_team: team }],
      handleChangedTeam,
      handleFailedChangeTeam
    );
  };

  const handleChangedTeam = (data: ChangeTeamResponse) => {
    setTeamChangeLoading(false);
    setTeamDialogOpen(false);
    if (data?.team) {
      setTeams((prevTeams) => {
        if (prevTeams.includes(data.team)) return prevTeams;
        return [...prevTeams, data.team].sort((a, b) => a.localeCompare(b));
      });
    }
    handleSuccessfulAuthentication();
    navigate("/", { replace: true });
  };

  const handleFailedChangeTeam = (error: any) => {
    setTeamChangeLoading(false);
    setTeamChangeError(getApiErrorMessage(error, "Unable to change team."));
  };

  const handleOpenCollaboratorDialog = () => {
    setProfileActions(false);
    setCollaboratorChangeError("");
    setCollaboratorDialogOpen(true);
  };

  const handleCloseCollaboratorDialog = () => {
    if (collaboratorChangeLoading) return;
    setCollaboratorDialogOpen(false);
    setCollaboratorChangeError("");
  };

  const handleChangeCollaborator = (collaborator: string) => {
    setCollaboratorChangeLoading(true);
    setCollaboratorChangeError("");
    callAPI(
      changeCollaborator,
      [{ new_collaborator: collaborator }],
      handleChangedCollaborator,
      handleFailedChangeCollaborator
    );
  };

  const handleChangedCollaborator = () => {
    setCollaboratorChangeLoading(false);
    setCollaboratorDialogOpen(false);
    handleSuccessfulAuthentication();
  };

  const handleFailedChangeCollaborator = (error: any) => {
    setCollaboratorChangeLoading(false);
    setCollaboratorChangeError(getApiErrorMessage(error, "Unable to change collaborator."));
  };

  const fetchedTeams = (data: string[]) => {
    setTeams(data);
  };

  const failedFetchTeams = (error: any) => {
    setTeamChangeError(getApiErrorMessage(error, "Unable to load teams."));
  };

  const handleViewOgrreVersion = () => {
    setProfileActions(false);
    setVersionDialogOpen(true);
    setVersionInfo(null);
    setVersionError("");
    setVersionLoading(true);
    callAPI(getOgrreVersion, [], handleFetchedVersion, handleFailedFetchVersion);
  };

  const handleFetchedVersion = (data: OgrreVersionInfo) => {
    setVersionInfo(data);
    setVersionLoading(false);
  };

  const handleFailedFetchVersion = (error: any) => {
    setVersionLoading(false);
    setVersionError(getApiErrorMessage(error, "Unable to load OGRRE version."));
  };

  return (
    <div id="Header">
      <div className="titlebar">
        <img onClick={handleNavigateHome} style={styles.logo} src={`${process.env.PUBLIC_URL}/img/OGRRE_logo.svg`} alt="Logo"></img>
        <div id="titlebar-name" style={{ cursor: "pointer" }} onClick={handleNavigateHome}>
          OGRRE
        </div>
        <div style={styles.tabPanel}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="process tabs" centered
            textColor='inherit'
            TabIndicatorProps={{ style: { background: "#727272" } }}
          >
            <Tab data-cy="header-tab-projects" label="Projects" value="projects" {...a11yProps(0)} />
            <Tab data-cy="header-tab-records" label="Records" value="records" {...a11yProps(1)} />
            {hasPermission("manage_team") &&
              <Tab data-cy="header-tab-admin" label="Admin" value="admin" {...a11yProps(2)} />
            }
            {hasPermission("manage_schema") &&
              <Tab data-cy="header-tab-schema" label="Schema" value="schema" {...a11yProps(3)} />
            }
          </Tabs>
        </div>

        <div className="right">
          <Button 
            style={styles.issueButton}
            href='https://catalog-historic-records.github.io/orphaned-wells-ui/'
            target='_blank'
            endIcon={<OpenInNewIcon/>}
          >
            View Documentation
          </Button>
          <Button 
            style={styles.issueButton}
            href='https://github.com/orgs/CATALOG-Historic-Records/discussions/171'
            target='_blank'
            endIcon={<OpenInNewIcon/>}
          >
            Report an issue
          </Button>
            
          <IconButton data-cy="profile-menu-button" sx={styles.icon} onClick={handleShowProfileActions}>
            <Avatar sx={styles.avatar} alt={userName} src={userPhoto}/>
            
          </IconButton>
          <Menu
            id="actions-list"
            anchorEl={anchorAr}
            open={profileActions}
            onClose={() => setProfileActions(false)}
            slotProps={
              styles.menuSlotProps
            }
          >
            {(hasPermission("manage_system") || hasPermission("system_administration")) && (
              <span>
                {hasPermission("manage_system") && (
                  <MenuItem onClick={handleOpenTeamDialog}>
                    <ListItemIcon>
                      <GroupsOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    Change team
                  </MenuItem>
                )}
                {hasPermission("system_administration") && (
                  <MenuItem onClick={handleOpenCollaboratorDialog}>
                    <ListItemIcon>
                      <AccountTreeOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    Change collaborator
                  </MenuItem>
                )}
                <Divider />
              </span>
            )
            }
            {hasPermission("manage_schema") && (
              <MenuItem data-cy="ogrre-version-menu-item" onClick={handleViewOgrreVersion}>
                <ListItemIcon>
                  <InfoOutlinedIcon fontSize="small" />
                </ListItemIcon>
                OGRRE Version
              </MenuItem>
            )}
            <MenuItem onClick={logout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </div>
      </div>
      <ChangeTeamDialog
        open={teamDialogOpen}
        teams={teams}
        currentTeam={user?.default_team}
        allowCustomTeam={!user?.anonymous}
        loading={teamChangeLoading}
        error={teamChangeError}
        onClose={handleCloseTeamDialog}
        onChangeTeam={handleChangeTeam}
      />
      <ChangeCollaboratorDialog
        open={collaboratorDialogOpen}
        currentCollaborator={user?.collaborator || process.env.REACT_APP_COLLABORATOR}
        loading={collaboratorChangeLoading}
        error={collaboratorChangeError}
        onClose={handleCloseCollaboratorDialog}
        onChangeCollaborator={handleChangeCollaborator}
      />
      <OgrreVersionDialog
        open={versionDialogOpen}
        versionInfo={versionInfo}
        loading={versionLoading}
        error={versionError}
        onClose={() => setVersionDialogOpen(false)}
      />
    </div>
  );
};

function a11yProps(index: number): { id: string; "aria-controls": string } {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

export default Header;
