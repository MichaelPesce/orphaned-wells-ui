import React, { useEffect, Fragment, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter, TablePagination, Icon } from '@mui/material';
import { Button, Box, Paper, IconButton, Grid } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import IosShareIcon from '@mui/icons-material/IosShare';
import ErrorIcon from '@mui/icons-material/Error';
import CachedIcon from '@mui/icons-material/Cached';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StickyNote2Icon from '@mui/icons-material/StickyNote2';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LastPageIcon from '@mui/icons-material/LastPage';
import { formatDate, average, formatConfidence, callAPI, convertFiltersToMongoFormat } from '../../assets/helperFunctions';
import { styles } from '../../assets/styles';
import Notes from '../Notes/Notes';
import TableFilters from '../TableFilters/TableFilters';
import { RecordData, RecordsTableProps } from '../../types';
import { getRecords } from '../../services/app.service';
import ColumnSelectDialog from '../ColumnSelectDialog/ColumnSelectDialog';

const TABLE_ATTRIBUTES = {
  displayNames: ["Record Name", "Date Uploaded", "API Number", "Mean Confidence", "Lowest Confidence", "Notes", "Digitization Status", "Review Status"],
  keyNames: ["name", "dateCreated", "API_NUMBER", "confidence_median", "confidence_lowest", "notes", "status", "review_status"],
}

const SORTABLE_COLUMNS = ["name", "dateCreated", "status", "review_status"]

const RecordsTable = (props: RecordsTableProps) => {
  let navigate = useNavigate();
  const {
    location,
    params,
    filter_options,
    handleUpdate
  } = props;

  const [ showNotes, setShowNotes ] = useState(false);
  const [ notesRecordId, setNotesRecordId ] = useState<string | null | undefined>(null);
  const [ notes, setNotes ] = useState<string | null | undefined>(null);
  const [ openColumnSelect, setOpenColumnSelect ] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [sortBy, setSortBy] = useState('dateCreated');
  const [sortAscending, setSortAscending] = useState(1);
  const [filterBy, setFilterBy] = useState<any[]>(
    JSON.parse(localStorage.getItem("appliedFilters") || '{}')[params.id || ""] || []
);

  useEffect(() => {
    loadData();
  }, [params.id, pageSize, currentPage, sortBy, sortAscending, filterBy]);

  useEffect(() => {
    setCurrentPage(0);
  }, [sortBy, sortAscending, filterBy]);

  const loadData = () => {
    const body = {
      sort: [sortBy, sortAscending],
      filter: convertFiltersToMongoFormat(filterBy),
      id: params.id,
    };
    const args = [location, body, currentPage, pageSize];
    callAPI(
        getRecords,
        args,
        handleSuccess,
        (e: Error) => { console.error('error getting record group data: ', e); }
    );
  };

  const handleSuccess = (data: { records: any[], record_count: number }) => {
      setRecords(data.records);
      setRecordCount(data.record_count);
  };

  const handleClickRecord = (record_id: string) => {
    navigate("/record/" + record_id);
  }

  const handleApplyFilters = (appliedFilters: any) => {
    setFilterBy(appliedFilters);
    let newAppliedFilters;
    let currentAppliedFilters = localStorage.getItem("appliedFilters");
    if (currentAppliedFilters === null) newAppliedFilters = {};
    else newAppliedFilters = JSON.parse(currentAppliedFilters);
    newAppliedFilters[params.id || ""] = appliedFilters;
    localStorage.setItem("appliedFilters", JSON.stringify(newAppliedFilters));
  }

  const calculateAverageConfidence = (attributes: Array<{ confidence?: number }>) => {
    let confidences: number[] = [];
    try {
      for (let attr of attributes) {
        if (attr.confidence) confidences.push(attr.confidence);
      }
      return formatConfidence(average(confidences));
    } catch (e) {
      return null;
    }
  }

  const calculateLowestConfidence = (attributes: Array<{ confidence?: number }>) => {
    let lowestConfidence = 1;
    for (let attr of attributes) {
      if (attr.confidence && attr.confidence < lowestConfidence) {
        lowestConfidence = attr.confidence;
      }
    }
    return formatConfidence(lowestConfidence);
  }

  const getAPINumber = (record: RecordData) => {
    try {
      for (let attr of record.attributesList) {
        if (attr.key === "API_NUMBER")  {
          return attr.value;
        }
      }
      return "";
    } catch (e) {
      return "";
    }
  }

  const handleClickNotes = (event: React.MouseEvent<HTMLButtonElement>, row: RecordData) => {
    event.stopPropagation();
    setShowNotes(true);
    setNotesRecordId(row._id);
    setNotes(row.notes || null);
  }

  const handleCloseNotesModal = (record_id: string | null | undefined, newNotes: string | null | undefined) => {
    setShowNotes(false);
    setNotesRecordId(null);
    setNotes(null);
    if (record_id) {
      const rowIdx = records.findIndex(r => r._id === record_id);
      if (rowIdx > -1) {
        let tempRecords = [...records];
        let tempRecord = {...tempRecords[rowIdx]};
        tempRecord.notes = newNotes;
        tempRecords[rowIdx] = tempRecord;
        setRecords(tempRecords);
      }
    }
  }

  const handleChangePage = (newPage: any) => {
    setCurrentPage(newPage);
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newSize = parseInt(event.target.value);
    setPageSize(newSize);
  }

  const handleSort = (key: string) => {
    if (SORTABLE_COLUMNS.includes(key)) {
      if (sortBy === key) setSortAscending((sortAscending || 1) * -1);
      else {
        setSortBy(key);
        setSortAscending(1);
      }
    }
  }

  const getParagraphStyle = (key: string) => {
    let paragraphStyle: React.CSSProperties = { margin: 0 };
    if (SORTABLE_COLUMNS.includes(key)) paragraphStyle['cursor'] = 'pointer';
    return paragraphStyle;
  }

  const tableRow = (row: RecordData, idx: number) => {
    return (
      <TableRow
        sx={styles.tableRow}
        onClick={() => handleClickRecord(row._id)}
        key={row._id}
        id={row.name+"_record_row"}
      >
        <TableCell align="right">{row.recordIndex}.</TableCell>
        <TableCell>{row.name}</TableCell>
        <TableCell align="right">{formatDate(row.dateCreated)}</TableCell>
        <TableCell align="right">{row.status === "digitized" ? getAPINumber(row) : null}</TableCell>
        <TableCell align="right">{row.status === "digitized" ? calculateAverageConfidence(row.attributesList) : null}</TableCell>
        <TableCell align="right">{row.status === "digitized" ? calculateLowestConfidence(row.attributesList) : null}</TableCell>
        <TableCell align="right">
          <IconButton sx={(row.notes === "" || !row.notes) ? {} : { color: "#F2DB6F" }} onClick={(e) => handleClickNotes(e, row)}>
            <StickyNote2Icon />
          </IconButton>
        </TableCell>
        <TableCell align="right">
          {
            row.status === "processing" ? 
            <IconButton>
              <CachedIcon sx={{ color: "#EF6C0B" }} /> 
            </IconButton> :
            row.status === "digitized" ? 
            <IconButton>
              <CheckCircleOutlineIcon sx={{ color: "green" }} />
            </IconButton> :
            row.status === "error" ? 
            <IconButton>
              <ErrorIcon color="error" />
            </IconButton> :
            null
          }
          {row.status}
        </TableCell>
        <TableCell align="right">
          <IconButton>
            {
              row.review_status === "unreviewed" ? 
                <ErrorIcon /> 
              :
              row.review_status === "incomplete" ? 
                <ErrorIcon sx={{ color: "#E3B62E" }} /> 
              :
              row.review_status === "defective" ? 
                <WarningIcon sx={{ color: "#9F0100" }} /> 
              :
              row.review_status === "reviewed" ? 
                <CheckCircleIcon sx={{ color: "green" }} /> 
              :
              null
            }
          </IconButton>
          {row.review_status}
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Box sx={styles.topSection}>
        <Grid container>
          <Grid item sx={styles.topSectionLeft} xs={6}>
            {filterBy && 
              <TableFilters applyFilters={handleApplyFilters} appliedFilters={filterBy} filter_options={filter_options} />
            }
          </Grid>
          <Grid item sx={styles.topSectionRight} xs={6}>
            <Button variant="contained" onClick={() => setOpenColumnSelect(true)} startIcon={<IosShareIcon />}>
              Export {location.replaceAll("_", " ")}
            </Button>
          </Grid>
        </Grid>
      </Box>
      <Table sx={{ minWidth: 650, marginTop: 1 }} aria-label="records table" size="small">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            {
              TABLE_ATTRIBUTES.displayNames.map((attribute, idx) => (
                <TableCell sx={styles.headerCell} key={idx} align={idx > 0 ? "right" : "left"}>
                  <p style={getParagraphStyle(TABLE_ATTRIBUTES.keyNames[idx])} onClick={() => handleSort(TABLE_ATTRIBUTES.keyNames[idx])}>
                    {TABLE_ATTRIBUTES.keyNames[idx] === sortBy &&
                      <IconButton onClick={() => setSortAscending((sortAscending || 1) * -1)}>
                        {
                          sortAscending === 1 ? 
                            <KeyboardArrowUpIcon /> :
                          sortAscending === -1 &&
                            <KeyboardArrowDownIcon />
                        }
                      </IconButton>
                    }
                    {attribute}
                  </p>
                </TableCell>
              ))
            }
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((row, idx) => (
            <Fragment key={idx}>
              {tableRow(row, idx)}
            </Fragment>
          ))}
        </TableBody>
        
          {pageSize && 
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50, 100, { label: 'All', value: -1 }]}
                  colSpan={3}
                  count={recordCount}
                  rowsPerPage={pageSize}
                  page={currentPage}
                  slotProps={{
                    select: {
                      inputProps: {
                        'aria-label': 'rows per page',
                      },
                      native: true,
                    },
                  }}
                  onPageChange={(e) => handleChangePage(e)}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={TablePaginationActions}
                />
              </TableRow>
            </TableFooter>
          }
          
        
      </Table>
      <Notes
        record_id={notesRecordId}
        notes={notes}
        open={showNotes}
        onClose={handleCloseNotesModal}
      />
      <ColumnSelectDialog
          open={openColumnSelect}
          onClose={() => setOpenColumnSelect(false)}
          location={location}
          handleUpdate={handleUpdate}
          _id={params.id}
      />
    </TableContainer>
  );
}

const TablePaginationActions = (props: any) => {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}

export default RecordsTable;