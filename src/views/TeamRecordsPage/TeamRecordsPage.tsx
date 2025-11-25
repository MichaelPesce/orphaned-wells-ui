import { Box } from "@mui/material";
import Subheader from "../../components/Subheader/Subheader";
import RecordsTable from "../../components/RecordsTable/RecordsTable";
import { useUserContext } from "../../usercontext";

const TeamRecordsPage = () => {
  const { user } = useUserContext();

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

  return (
    <Box sx={styles.outerBox}>
      <Subheader
        currentPage="All Records"
      />
      <Box sx={styles.innerBox}>
        <RecordsTable
          location="team"
          params={{id: user?.default_team || ""}}
          handleUpdate={(e) => {console.log(e);}}
        />
      </Box>
    </Box>
  );
};

export default TeamRecordsPage;