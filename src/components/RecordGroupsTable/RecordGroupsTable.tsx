import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { formatDate } from "../../util";
import { RecordGroup } from "../../types";
import { styles, ERROR_TEXT_COLOR } from "../../styles";
import WarningIcon from "@mui/icons-material/Warning";
import TableLoading from "../TableLoading/TableLoading";
import EmptyTable from "../EmptyTable/EmptyTable";

interface RecordGroupsTableProps {
  record_groups: RecordGroup[];
  sortRecordGroups: (sortBy: string, sortAscending: number) => void;
  loading?: boolean;
}
type ColumnConfig = {
  displayKey: string;
  align?: "left" | "right" | "center";
};

const COLUMNS: Record<string, ColumnConfig> = {
  name: {
    displayKey: "Record Group Name",
    align: "left"
  },
  description: {
    displayKey: "Description",
    align: "left"
  },
  documentType: {
    displayKey: "Document Type",
    align: "left"
  },
  progress: {
    displayKey: "Progress",
    align: "right"
  },
  dateCreated: {
    displayKey: "Date Created",
    align: "right"
  }
};

const RecordGroupsTable = ({ record_groups, sortRecordGroups, loading }: RecordGroupsTableProps) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("dateCreated");
  const [sortAscending, setSortAscending] = useState(1);

  useEffect(() => {
    sortRecordGroups(sortBy, sortAscending);
  }, [sortBy, sortAscending]);

  const handleSort = (key: string) => {
    if (Object.keys(COLUMNS).includes(key)) {
      if (sortBy === key) setSortAscending((sortAscending || 1) * -1);
      else {
        setSortBy(key);
        setSortAscending(1);
      }
    }
  };

  const getParagraphStyle = (key: string) => {
    let paragraphStyle: React.CSSProperties = { margin: 0, whiteSpace: "nowrap" };
    if (Object.keys(COLUMNS).includes(key)) paragraphStyle["cursor"] = "pointer";
    return paragraphStyle;
  };

  const handleClickRecordGroup = (rg_id: string) => {
    navigate("/record_group/" + rg_id);
  };
  
  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="Record Groups table">
          <TableHead>
            <TableRow>
              {Object.entries(COLUMNS).map(( [key, column]) => (
                <TableCell sx={styles.headerRow} key={key} align={column.align}>
                  <p style={getParagraphStyle(key)} onClick={() => handleSort(key)}>
                    {key === sortBy &&
                      <IconButton>
                        {
                          sortAscending === 1 ? 
                            <KeyboardArrowUpIcon /> :
                            sortAscending === -1 &&
                            <KeyboardArrowDownIcon />
                        }
                      </IconButton>
                    }
                    {column.displayKey}
                  </p>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {record_groups.map((row: RecordGroup, idx: number) => (
              <TableRow
                key={row.name + " " + idx}
                sx={styles.tableRow}
                onClick={() => handleClickRecordGroup(row._id)}
                id={row.name.replaceAll(" ", "")+"_record_group_row"}
                className="record_group_row"
              >
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
                <TableCell>{row.description}</TableCell>
                <TableCell>{row.documentType}</TableCell>
                <TableCell align='right'>
                  {row.error_amt ? 
                    <Tooltip title='This record group contains cleaning errors'>
                      <IconButton sx={{color: ERROR_TEXT_COLOR}} size='small'><WarningIcon/></IconButton>
                    </Tooltip>
                    :
                    null
                  }
                  {row.reviewed_amt || 0} / {row.total_amt || 0}
                </TableCell>
                <TableCell align='right'>{formatDate(row.dateCreated || null)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {
        loading ? <TableLoading/> :
          !record_groups?.length ? 
            <EmptyTable
              title="No record groups found."
              message="Please create a new record group or contact a team lead to get started."
            /> :
            null
      }
    </>
  );
};

export default RecordGroupsTable;