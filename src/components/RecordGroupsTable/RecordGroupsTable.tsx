import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Checkbox, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Tooltip } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import FilterListIcon from "@mui/icons-material/FilterList";
import IosShareIcon from "@mui/icons-material/IosShare";
import { formatDate } from "../../util";
import { FilterOption, RecordGroup } from "../../types";
import { styles, ERROR_TEXT_COLOR } from "../../styles";
import WarningIcon from "@mui/icons-material/Warning";
import TableLoading from "../TableLoading/TableLoading";
import EmptyTable from "../EmptyTable/EmptyTable";
import ColumnSelectDialog from "../ColumnSelectDialog/ColumnSelectDialog";
import { useDownload } from "../../context/DownloadContext";

interface RecordGroupsTableProps {
  record_groups: RecordGroup[];
  sortRecordGroups: (sortBy: string, sortAscending: number) => void;
  projectId: string;
  handleUpdate: (update: any) => void;
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

const RecordGroupsTable = ({ record_groups, sortRecordGroups, projectId, handleUpdate, loading }: RecordGroupsTableProps) => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("dateCreated");
  const [sortAscending, setSortAscending] = useState(1);
  const [openColumnSelect, setOpenColumnSelect] = useState(false);
  const [selectedRecordGroupIds, setSelectedRecordGroupIds] = useState<string[]>([]);
  const { isDownloading } = useDownload();

  useEffect(() => {
    sortRecordGroups(sortBy, sortAscending);
  }, [sortBy, sortAscending]);

  useEffect(() => {
    setSelectedRecordGroupIds((currentSelected) => (
      currentSelected.filter((id) => record_groups.some((rg) => rg._id === id))
    ));
  }, [record_groups]);

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

  const handleToggleRecordGroup = (event: React.ChangeEvent<HTMLInputElement>, rg_id: string) => {
    event.stopPropagation();
    setSelectedRecordGroupIds((currentSelected) => (
      event.target.checked ?
        [...currentSelected, rg_id] :
        currentSelected.filter((id) => id !== rg_id)
    ));
  };

  const selectedRecordGroupFilters: FilterOption[] = [
    {
      key: "record_group_id",
      displayName: "Record Group",
      type: "checkbox",
      operator: "equals",
      options: record_groups.map((rg) => ({
        name: rg.name,
        checked: selectedRecordGroupIds.includes(rg._id),
        value: rg._id,
      })),
      selectedOptions: record_groups
        .filter((rg) => selectedRecordGroupIds.includes(rg._id))
        .map((rg) => rg.name),
    },
    {
      key: "documentType",
      displayName: "Document Type",
      type: "checkbox",
      operator: "equals",
      options: record_groups
        .filter((rg) => selectedRecordGroupIds.includes(rg._id))
        .map((rg) => rg.documentType)
        .filter((documentType): documentType is string => Boolean(documentType))
        .filter((documentType, idx, documentTypes) => documentTypes.indexOf(documentType) === idx)
        .map((documentType) => ({
          name: documentType,
          checked: true,
          value: documentType,
        })),
      selectedOptions: record_groups
        .filter((rg) => selectedRecordGroupIds.includes(rg._id))
        .map((rg) => rg.documentType)
        .filter((documentType): documentType is string => Boolean(documentType)),
    }
  ];

  const selectedDocumentTypes = record_groups
    .filter((rg) => selectedRecordGroupIds.includes(rg._id))
    .map((rg) => rg.documentType)
    .filter((documentType): documentType is string => Boolean(documentType))
    .filter((documentType, idx, documentTypes) => documentTypes.indexOf(documentType) === idx);
  
  return (
    <>
      <TableContainer component={Paper}>
        <Box sx={styles.topSection}>
          <Grid container>
            <Grid item sx={styles.topSectionLeft} xs={6}>
              <Button startIcon={<FilterListIcon />} disabled>
                Filter
              </Button>
              <Button
                data-cy="record-groups-export-button"
                onClick={() => setOpenColumnSelect(true)}
                startIcon={<IosShareIcon />}
                disabled={selectedRecordGroupIds.length === 0 || isDownloading || !projectId}
              >
                Export
              </Button>
            </Grid>
          </Grid>
        </Box>
        <Table sx={{ minWidth: 650 }} aria-label="Record Groups table">
          <TableHead>
            <TableRow>
              <TableCell />
              {Object.entries(COLUMNS).map(( [key, column]) => (
                <TableCell sx={styles.headerRow} key={key} align={column.align}>
                  <p data-cy={`record-groups-sort-${key}`} style={getParagraphStyle(key)} onClick={() => handleSort(key)}>
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
                data-cy="record-group-row"
                data-record-group-id={row._id}
                data-record-group-name={row.name}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    data-cy="record-group-select"
                    checked={selectedRecordGroupIds.includes(row._id)}
                    onChange={(event) => handleToggleRecordGroup(event, row._id)}
                    onClick={(event) => event.stopPropagation()}
                  />
                </TableCell>
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
        {
          openColumnSelect && !isDownloading && (
            <ColumnSelectDialog
              open={openColumnSelect}
              onClose={() => setOpenColumnSelect(false)}
              location="documentType"
              handleUpdate={handleUpdate}
              _id={projectId}
              appliedFilters={selectedRecordGroupFilters}
              sortBy={sortBy}
              sortAscending={sortAscending}
              documentTypes={selectedDocumentTypes}
              selectedRecordGroups={selectedRecordGroupIds}
            />
          )
        }
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
