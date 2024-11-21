import { useState } from 'react';
import { useParams } from "react-router-dom";
import { useUserContext } from '../../usercontext';
import Notes from '../Notes/Notes';
import SplitButton from '../SplitButton/SplitButton';
import DefectiveDialog from '../DefectiveDialog/DefectiveDialog';
import { BottombarProps } from '../../types';
import { BottomBarStyles as styles } from '../../assets/styles';
import { Grid, Box, Paper, Button, CssBaseline } from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CancelIcon from '@mui/icons-material/Cancel';
import WarningIcon from '@mui/icons-material/Warning';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import TonalityIcon from '@mui/icons-material/Tonality';

const Bottombar = (props: BottombarProps) => {
  let params = useParams(); 
  let { userPermissions } = useUserContext();
  const { 
    recordData, 
    onPreviousButtonClick, 
    onNextButtonClick, 
    onReviewButtonClick, 
    handleUpdateReviewStatus, 
    promptResetRecord,
    locked
  } = props;
  const [openNotesModal, setOpenNotesModal] = useState(false);
  const [openDefectiveDialog, setOpenDefectiveDialog] = useState(false);
  
  const splitButtonOptions: Record<string, Array<{ text: string; onClick: () => void; icon: JSX.Element; selected?: boolean }>> = {
    unreviewed: [
      {
        text: "Mark as incomplete",
        onClick: () => handleUpdateReviewStatus("incomplete"),
        icon: <TonalityIcon sx={{ color: "#E3B62E" }} />,
        selected: true
      },
      {
        text: "Needs Verification",
        onClick: () => handleUpdateReviewStatus("verification_required"),
        icon: <NewReleasesIcon sx={{ color: "#FFC130" }} />,
      },
      {
        text: "Mark as defective",
        onClick: () => setOpenDefectiveDialog(true),
        icon: <CancelIcon sx={{ color: "#9F0100" }} />,
      }
    ],
    incomplete: [
      {
        text: "Reset to unreviewed",
        onClick: promptResetRecord,
        icon: <PanoramaFishEyeIcon sx={{ color: "#828282" }} />,
        selected: true
      },
      {
        text: "Needs Verification",
        onClick: () => handleUpdateReviewStatus("verification_required"),
        icon: <NewReleasesIcon sx={{ color: "#FFC130" }} />,
      },
      {
        text: "Mark as defective",
        onClick: () => setOpenDefectiveDialog(true),
        icon: <CancelIcon sx={{ color: "#9F0100" }} />,
      },
      userPermissions && userPermissions.includes('verify_records') && {
        text: "Mark as reviewed-verified",
        onClick: () => handleUpdateReviewStatus("reviewed-verified"),
        icon: <CheckCircleIcon sx={{ color: "#3A9227" }} />,
      }
    ],
    defective: [
      {
        text: "Reset to unreviewed",
        onClick: promptResetRecord,
        icon: <PanoramaFishEyeIcon sx={{ color: "#828282" }} />,
        selected: true
      },
      {
        text: "Mark as incomplete",
        onClick: () => handleUpdateReviewStatus("incomplete"),
        icon: <TonalityIcon sx={{ color: "#E3B62E" }} />,
      },
      {
        text: "Needs Verification",
        onClick: () => handleUpdateReviewStatus("verification_required"),
        icon: <NewReleasesIcon sx={{ color: "#FFC130" }} />,
      },
    ],
    reviewed: [
      {
        text: "Reset to unreviewed",
        onClick: promptResetRecord,
        icon: <PanoramaFishEyeIcon sx={{ color: "#828282" }} />,
      },
      {
        text: "Mark as incomplete",
        onClick: () => handleUpdateReviewStatus("incomplete"),
        icon: <TonalityIcon sx={{ color: "#E3B62E" }} />,
        selected: true
      },
      {
        text: "Needs Verification",
        onClick: () => handleUpdateReviewStatus("verification_required"),
        icon: <NewReleasesIcon sx={{ color: "#FFC130" }} />,
      },
      (userPermissions && userPermissions.includes('verify_record')) && {
        text: "Mark as reviewed-verified",
        onClick: () => handleUpdateReviewStatus("reviewed-verified"),
        icon: <CheckCircleIcon sx={{ color: "#3A9227" }} />,
      }
    ],
  };

  

  const handleMarkDefective = (categories: string[], description: string) => {
    handleUpdateReviewStatus("defective", categories, description);
  }

  return ( 
    <Box sx={{ width: 500 }}>
      <CssBaseline />
      <Paper sx={styles.paper} elevation={3}>
        <Grid container sx={{ marginTop: '10px' }}>
          <Grid item xs={3}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', marginLeft: '10px' }}>
              <Button 
                variant="outlined" 
                startIcon={<KeyboardArrowLeftIcon />}
                onClick={onPreviousButtonClick}
              > 
                Previous
              </Button>
            </Box>
          </Grid>
          <Grid item xs={9}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginRight: '10px' }}>
              <Button 
                sx={styles.button} 
                variant="outlined" 
                startIcon={<BorderColorIcon />}
                onClick={() => setOpenNotesModal(true)}
              >
                notes
              </Button>

              {recordData.review_status && 
                <SplitButton
                  options={splitButtonOptions[recordData.review_status]}
                  disabled={locked}
                />
              }
              
              {
                (recordData.review_status === "reviewed" || recordData.review_status === "defective" || locked) ?
                <Button 
                  sx={styles.button} 
                  variant="contained" 
                  endIcon={<KeyboardArrowRightIcon />}
                  onClick={onNextButtonClick}
                >
                  next
                </Button>
                :
                (recordData.review_status === "unreviewed" || recordData.review_status === "incomplete") && 
                  <Button 
                    sx={styles.button} 
                    variant="contained" 
                    startIcon={<CheckCircleIcon sx={{ color: "#43A047" }} />}
                    endIcon={<KeyboardArrowRightIcon />}
                    onClick={onReviewButtonClick}
                  > 
                    Mark as reviewed & next 
                  </Button>
              }
            </Box>
          </Grid>
        </Grid>
        <DefectiveDialog
          open={openDefectiveDialog}
          handleMarkDefective={handleMarkDefective}
          onClose={() => setOpenDefectiveDialog(false)}
        />
        <Notes
          record_id={params.id}
          notes={recordData.notes}
          open={openNotesModal}
          onClose={() => setOpenNotesModal(false)}
        />
      </Paper>
    </Box>
  );
}

export default Bottombar;