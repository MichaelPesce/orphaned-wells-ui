import { useState, Fragment, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Grid, IconButton, Box, Menu, MenuItem, Chip } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import LockIcon from "@mui/icons-material/Lock";
import { SubheaderProps } from "../../types";
import { SubheaderStyles as styles } from "../../styles";

const Subheader = (props: SubheaderProps) => {
  const navigate = useNavigate();
  const { currentPage, buttonName, status, verification_status, subtext, handleClickButton, disableButton, previousPages, actions, locked } = props;
  const [showActions, setShowActions] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleNavigate = (path: string) => {
    navigate(path, { replace: true });
  };

  const handleShowActions = (event: MouseEvent<HTMLElement>) => {
    setShowActions(!showActions);
    setAnchorEl(event.currentTarget);
  };

  const handleSelectAction = (action_func: Function) => {
    setShowActions(false);
    action_func();
  };

  const displayStatus = () => {
    if (verification_status === "required") return "Awaiting Verification";
    else if (verification_status === "verified") return `${status}-Verified`;
    else if (locked) return "LOCKED";
    else return `${status}`;
  };

  return (
    <Box sx={styles.box}>
      <Grid container sx={styles.gridContainer}>
        <Grid item xs={9} >
          <div style={styles.directoryDisplay}>
            <IconButton sx={styles.iconButton} onClick={() => handleNavigate("/")}><HomeIcon sx={styles.icon} /></IconButton>
                        /
            {
              previousPages &&
                            Object.entries(previousPages).map(([page, pageAction]) => {
                              if (page && page !== "undefined") return (
                                <Fragment key={page}>
                                  <Button 
                                    sx={styles.iconButton} 
                                    size="small" 
                                    onClick={pageAction}
                                  >
                                    {page}
                                  </Button>
                                        /
                                </Fragment>
                              );
                                
                            })
            }

            <Button sx={styles.iconButton} size="small">{currentPage!== undefined ? currentPage : ""}</Button>
          </div>
          <div style={styles.pageName}>
            {currentPage}&nbsp;
            {actions && Object.keys(actions).length > 0 &&
                            <>
                              <IconButton 
                                id="options-button"
                                onClick={handleShowActions} 
                                disabled={locked}
                              >
                                <MoreHorizIcon sx={styles.icon} />
                              </IconButton>
                              <Menu
                                id="actions"
                                anchorEl={anchorEl}
                                open={showActions}
                                onClose={() => setShowActions(false)}
                              >
                                {Object.entries(actions).map(([action_text, action_func]) => (
                                  <MenuItem key={action_text} onClick={() => handleSelectAction(action_func)}>{action_text}</MenuItem>
                                ))}
                              </Menu>
                            </>
            }

          </div>
          <div style={styles.subtext}>
            {subtext}
          </div>
        </Grid>
        <Grid item xs={3}>
          <Box sx={styles.newProjectColumn}>
            {buttonName &&
                            <Button variant="contained" onClick={handleClickButton} disabled={disableButton}>
                              {buttonName}
                            </Button>
            }
            {!buttonName && status &&
                            <Chip
                              sx={{
                                fontSize: "16px",
                                textTransform: "capitalize",
                                backgroundColor:
                                        status === "unreviewed" ? "default" :
                                          status === "incomplete" ? "#FFECB3" :
                                            status === "defective" ? "#FDCDD2" :
                                              status === "reviewed" ? "#C8E6C9" :
                                                undefined
                              }}
                              label={displayStatus()}
                              id="review_status_chip"
                              icon={locked ? <LockIcon/> : undefined}
                            />
            }
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Subheader;