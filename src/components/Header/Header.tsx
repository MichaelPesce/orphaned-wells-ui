import './Header.css';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { HeaderStyles as styles } from '../../styles';
import { useUserContext } from '../../usercontext';
import { fetchTeams, updateDefaultTeam } from '../../services/app.service';
import { Menu, MenuItem, IconButton, Avatar, Tabs, Tab, Divider, ListItemIcon, Button } from '@mui/material';
import { logout, callAPI } from '../../util';
import Logout from '@mui/icons-material/Logout';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';


const Header = (props: any) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userName, userPhoto, userPermissions} = useUserContext();
  const [anchorAr, setAnchorAr] = useState<null | HTMLElement>(null);
  const [profileActions, setProfileActions] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [teams, setTeams] = useState<string[]>([])

  useEffect(() => {
    if (window.location.href.includes("project")) {
      setTabValue(0);
    } else if (window.location.href.includes("records")) {
      setTabValue(1);
    } else if (window.location.href.includes("users")) {
      setTabValue(2);
    } else if (window.location.href.includes("schema")) {
      setTabValue(3);
    } else {
      setTabValue(0);
    }
    if (userPermissions && userPermissions.includes('manage_system')) callAPI(fetchTeams, [], fetchedTeams, failedFetchTeams)
  }, [props, userPermissions, location]);

  const handleNavigateHome = () => {
    navigate("/");
  }

  const handleShowProfileActions = (event: React.MouseEvent<HTMLElement>) => {
    setProfileActions(!profileActions);
    setAnchorAr(event.currentTarget);
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    if (newValue !== tabValue) {
      let newLocation: string;
      if (newValue === 0) newLocation = "projects";
      else if (newValue === 1) newLocation = "records";
      else if (newValue === 2) newLocation = "users";
      else if (newValue === 3) newLocation = "schema";
      else newLocation = "/"
      navigate(newLocation, { replace: true });
    }
  };

  const changeTeam = (team: string) => {
    let data = {
      new_team: team
    }
    setProfileActions(false)
    callAPI(updateDefaultTeam, [data], (data) => navigate('/', { replace: true }), (e)=> console.error(e.detail))
  }

  const fetchedTeams = (data: string[]) => {
    setTeams(data)
  }

  const failedFetchTeams = () => {

  }

  return (
    <div id="Header">
      <div className="titlebar">
        <img onClick={handleNavigateHome} style={styles.logo} src={`${process.env.PUBLIC_URL}/img/OGRRE_logo.svg`} alt="Logo"></img>
        <div id="titlebar-name" style={{ cursor: 'pointer' }} onClick={handleNavigateHome}>
          OGRRE
        </div>
        <div style={styles.tabPanel}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="process tabs" centered
            textColor='inherit'
            TabIndicatorProps={{ style: { background: '#727272' } }}
          >
            <Tab label="Projects" {...a11yProps(0)} />
            <Tab label="Records" {...a11yProps(1)} />
            {userPermissions && userPermissions.includes("manage_team") &&
              <Tab label="Users" {...a11yProps(2)} />
            }
            {userPermissions?.includes("manage_schema") &&
              <Tab label="Schema" {...a11yProps(3)} />
            }
          </Tabs>
        </div>

        <div className="right">
          <Button 
            style={styles.issueButton}
            href='https://github.com/orgs/CATALOG-Historic-Records/discussions/171'
            target='_blank'
            endIcon={<OpenInNewIcon/>}
          >
            Report an issue
          </Button>
            
          <IconButton sx={styles.icon} onClick={handleShowProfileActions}>
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
            {userPermissions && userPermissions.includes('manage_system') && (
              <span>
              {teams.map((team) => (
                <MenuItem key={team} onClick={() => changeTeam(team)}>
                  Change to {team}
                </MenuItem>
              ))}
              <Divider />
              </span>
            )
            }
            <MenuItem onClick={logout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </div>
      </div>
    </div>
  );
}

function a11yProps(index: number): { id: string; 'aria-controls': string } {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default Header;