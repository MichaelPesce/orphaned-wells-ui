import { useState } from "react";
import { Box, Paper, Tabs, Tab, TableContainer } from "@mui/material";
import SchemaSheet from "./SchemaSheet";
import SchemaOverViewSheet from "./SchemaOverviewSheet";
import { MongoProcessor, SchemaOverview } from "../../types";
import TableLoading from "../TableLoading/TableLoading";
import EditProcessorDialog from "../EditProcessorDialog/EditProcessorDialog";
import { SxProps } from "@mui/material";

interface SchemaTableProps {
  loading: boolean;
  updating?: boolean;
  schema?: SchemaOverview;
  setErrorMessage: (v: string | null) => void;
  clickUpdateFields: (v: MongoProcessor) => void;
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
  },
  tableContainer: {
    maxHeight: 600, paddingBottom: 2
  }
};

const SchemaTable = (props: SchemaTableProps) => {
  const [tabValue, setTabValue] = useState(0);
  const [editingProcessor, setEditingProcessor] = useState<number>();
  const {
    schema,
    loading,
    setErrorMessage,
    clickUpdateFields,
    updating,
  } = props;
  const {
    processors
  } = schema || {};

  const tableContainerStyle: SxProps = {...styles.tableContainer};
  if (updating) {
    tableContainerStyle["opacity"] = 0.5;
    tableContainerStyle["pointerEvents"] = "none";
  }

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
          {processors?.map((processor, idx) => (
            <Tab key={`${idx}-${processor.name}`} label={processor.name} />
          ))}
        </Tabs>
      </Box>
      <TableContainer sx={tableContainerStyle}>
        {loading ? (
          <TableLoading/>
        ) : 
          tabValue === 0 ? (
            <SchemaOverViewSheet
              processors={processors || []}
              setTabValue={setTabValue}
              setEditingProcessor={setEditingProcessor}
              setErrorMessage={setErrorMessage}
            />
          ) : (
            <SchemaSheet processor={processors?.[tabValue-1]} />
          )
        }
       
        
      </TableContainer>
      {editingProcessor !== undefined && processors && (
        <EditProcessorDialog
          open={editingProcessor !== undefined}
          onClose={() => setEditingProcessor(undefined)}
          setErrorMsg={(e) => setErrorMessage(e)}
          processorData={processors[editingProcessor]}
          clickUpdateFields={clickUpdateFields}
        />
      )}
    </Paper>
  );
};

export default SchemaTable;
