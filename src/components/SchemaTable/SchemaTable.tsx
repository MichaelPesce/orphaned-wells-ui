import React from "react";
import { Box, Paper, Tabs, Tab, TableContainer } from "@mui/material";
import SchemaSheet from "./SchemaSheet";
import SchemaOverViewSheet from "./SchemaOverviewSheet";
import { SchemaOverview } from "../../types";
import TableLoading from "../TableLoading/TableLoading";

interface SheetData {
  id: number;
  name: string;
  data: any[];
}

interface SchemaTableProps {
  loading: boolean;
  schema?: SchemaOverview;
}

const styles = {
  tabs: {
    minHeight: 36,
    "& .MuiTab-root": {
      textTransform: "none",
      fontSize: 14,
      fontWeight: 500,
      minHeight: 32,
      px: 2,
      mr: 1.5,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },
    "& .Mui-selected": {
      background: "#fff",
      boxShadow: "0px 2px 6px rgba(0,0,0,0.15)",
      fontWeight: "bold",
    },
    "& .MuiTabs-indicator": {
      display: "none",
    },
  }
}

const SchemaTable = (props: SchemaTableProps) => {
  const [tabValue, setTabValue] = React.useState(0);
  const {
    schema,
    loading
  } = props;
  const {
    processors
  } = schema || {};


  return (
    <Paper
      elevation={2}
      sx={{
        width: "100%",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      
      <Box
        sx={{
          borderBottom: "1px solid #e0e0e0",
          px: 2,
          // pt: 1.5,
          background: "#fafafa",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons={false}
          sx={styles.tabs}
        >
          <Tab label="Overview"/>
          {processors?.map((processor) => (
            <Tab key={processor.name} label={processor.name} />
          ))}
        </Tabs>
      </Box>
      <TableContainer sx={{ maxHeight: 600 }}>
        {loading ? (
          <TableLoading/>
        ) : 
          tabValue === 0 ? (
             <SchemaOverViewSheet data={processors} setTabValue={setTabValue}/>
          ) : (
            <SchemaSheet processor={processors?.[tabValue-1]} />
          )
        }
       
        
      </TableContainer>
    </Paper>
  );
};

export default SchemaTable;
