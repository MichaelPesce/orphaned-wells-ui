import * as React from "react";
import { Tabs, Tab, Box } from "@mui/material";

interface ProjectTabProps {
  options: string[];
  value: number;
  setValue: (newValue: number) => void;
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const styles = {
  tab: {
    "&:hover": {
      background: "#efefef"
    },
  },
};

export default function ProjectTabs({ options, value, setValue }: ProjectTabProps) {

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={value} onChange={handleChange} aria-label="project tabs" centered variant="fullWidth">
          {options.map((v, idx) => (
            <Tab sx={styles.tab} key={v} label={options[idx]} {...a11yProps(idx)} />
          ))}
        </Tabs>
      </Box>
      
    </Box>
  );
}
