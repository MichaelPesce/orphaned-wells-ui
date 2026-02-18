import React, { useEffect, Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter, TablePagination } from "@mui/material";
import { Button, Box, Paper, IconButton, Grid, Typography, Menu, MenuItem } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import IosShareIcon from "@mui/icons-material/IosShare";
import ErrorIcon from "@mui/icons-material/Error";
import CachedIcon from "@mui/icons-material/Cached";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LastPageIcon from "@mui/icons-material/LastPage";
import PublishedWithChangesOutlinedIcon from "@mui/icons-material/PublishedWithChangesOutlined";
import { formatDate, average, formatConfidence, callAPI, convertFiltersToMongoFormat, TABLE_ATTRIBUTES, ISGS_TABLE_ATTRIBUTES, OSAGE_TABLE_ATTRIBUTES } from "../../util";
import { styles } from "../../styles";
import RecordNotesDialog from "../RecordNotesDialog/RecordNotesDialog";
import TableFilters from "../TableFilters/TableFilters";
import { RecordData, RecordsTableProps, RecordNote } from "../../types";
import { getRecords, deleteRecords } from "../../services/app.service";
import ColumnSelectDialog from "../ColumnSelectDialog/ColumnSelectDialog";
import EmptyTable from "../EmptyTable/EmptyTable";
import TableLoading from "../TableLoading/TableLoading";
import PopupModal from "../PopupModal/PopupModal";
import { useDownload } from "../../context/DownloadContext";
import { useUserContext } from "../../usercontext";

const SORTABLE_COLUMNS = {
  dateCreated: "toplevel",
  api_number: "toplevel",
  Sec: "attribute",
  R: "attribute",
  T: "attribute",
} as const;

type SortableColumnKey = keyof typeof SORTABLE_COLUMNS;

const RecordsTable = (props: RecordsTableProps) => {
  let navigate = useNavigate();
  const {
    location,
    params,
    filter_options,
    handleUpdate,
    recordGroups,
  } = props;

  const { hasPermission} = useUserContext();
  const [loading, setLoading] = useState(true);
  const [ showNotes, setShowNotes ] = useState(false);
  const [ notesRecordId, setNotesRecordId ] = useState<string>();
  const [ openColumnSelect, setOpenColumnSelect ] = useState(false);
  const [records, setRecords] = useState<RecordData[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(100);
  const [showDownloadMessage, setShowDownloadMessage] = useState(false);
  const [openDeleteRecordsModal, setOpenDeleteRecordsModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [ menuAnchor, setMenuAnchor ] = useState<HTMLElement>();
  const [filterBy, _setFilterBy] = useState<any[]>(
    JSON.parse(localStorage.getItem("appliedFilters") || "{}")[params.id || ""] || []
  );
  const [sorted, _setSorted] = useState(JSON.parse(localStorage.getItem("sorted") || "{}")[params.id || ""] || ["dateCreated", 1]
  );
  const { isDownloading, estimatedTotalBytes, progress } = useDownload();

  useEffect(() => {
    if (isDownloading) {
      setOpenColumnSelect(false);
      // If downloda is bigger than 10mb
      if ((estimatedTotalBytes || 0) > 10000000 && (progress || 0) < 0.01) setShowDownloadMessage(true);
    } else {
      setShowDownloadMessage(false);
    }
  }, [isDownloading]);

  const setFilterBy = (newFilterBy: any) => {
    _setFilterBy(newFilterBy);
    setCurrentPage(0);
  };

  const setSorted = (newSorted: any) => {
    _setSorted(newSorted);
    setCurrentPage(0);
  };

  const table_columns = 
    process.env.REACT_APP_COLLABORATOR === "isgs" ? ISGS_TABLE_ATTRIBUTES[location] : 
      process.env.REACT_APP_COLLABORATOR === "osage" ? OSAGE_TABLE_ATTRIBUTES[location] :
        TABLE_ATTRIBUTES[location];

  useEffect(() => {
    setRecords([]);
    setLoading(true);
    loadData();
  }, [params.id, pageSize, currentPage, filterBy, sorted]);

  const loadData = () => {
    const body = {
      sort: sorted,
      filter: convertFiltersToMongoFormat(filterBy),
      id: params.id,
    };
    const args = [location, body, currentPage, pageSize];
    callAPI(
      getRecords,
      args,
      handleSuccess,
      handleAPIError,
    );
  };

  const handleSuccess = (data: { records: any[], record_count: number }) => {
    setLoading(false);
    setRecords(data.records);
    setRecordCount(data.record_count);
  };

  const handleAPIError = (e: Error) => {
    setLoading(false);
    console.error("error getting record group data: ", e);
  };

  const handleClickRecord = (record_id: string) => {
    navigate("/record/" + record_id, { state: {group_id: params.id, location: location}});
  };

  const handleApplyFilters = (appliedFilters: any) => {
    setFilterBy(appliedFilters);
    let newAppliedFilters;
    let currentAppliedFilters = localStorage.getItem("appliedFilters");
    if (currentAppliedFilters === null) newAppliedFilters = {};
    else newAppliedFilters = JSON.parse(currentAppliedFilters);
    newAppliedFilters[params.id || ""] = appliedFilters;
    localStorage.setItem("appliedFilters", JSON.stringify(newAppliedFilters));
  };

  const calculateAverageConfidence = (attributes: Array<{ confidence?: number }>) => {
    let confidences: number[] = [];
    try {
      for (let attr of attributes) {
        if (attr?.confidence) confidences.push(attr?.confidence);
      }
      return formatConfidence(average(confidences));
    } catch (e) {
      return null;
    }
  };

  const calculateLowestConfidence = (attributes: Array<{ confidence?: number }>) => {
    let lowestConfidence = 1;
    for (let attr of attributes) {
      if (attr?.confidence && attr?.confidence < lowestConfidence) {
        lowestConfidence = attr.confidence;
      }
    }
    return formatConfidence(lowestConfidence);
  };

  const handleClickNotes = (event: React.MouseEvent<HTMLButtonElement>, row: RecordData) => {
    event.stopPropagation();
    setShowNotes(true);
    setNotesRecordId(row._id);
    // setNotes(row.record_notes);
  };

  const handleCloseNotesModal = (record_id?: string, newNotes?: RecordNote[]) => {
    setShowNotes(false);
    setNotesRecordId(undefined);
    // setNotes(undefined);
    if (record_id) {
      const rowIdx = records.findIndex(r => r._id === record_id);
      if (rowIdx > -1) {
        let tempRecords = [...records];
        let tempRecord = {...tempRecords[rowIdx]};
        tempRecord.record_notes = newNotes;
        tempRecords[rowIdx] = tempRecord;
        setRecords(tempRecords);
      }
    }
  };

  const handleChangePage = (newPage: any) => {
    setCurrentPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    let newSize = parseInt(event.target.value);
    setPageSize(newSize);
  };

  const handleClickShowActions = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setShowActions(!showActions);
    setMenuAnchor(event.currentTarget);
  };

  const handleDeleteRecords = () => {
    setOpenDeleteRecordsModal(false);
    const body = {
      record_ids: records.map((r) => r._id)
    };
    // TODO: 
    // 1) set loader
    // 2) replace error call back function in callAPI with a function that displays an error using the ErrorBar component
    callAPI(
      deleteRecords,
      [body],
      () => window.location.reload(),
      (e) => console.error(e)
    );
  };

  const handleSort = (key: SortableColumnKey) => {
    if (Object.keys(SORTABLE_COLUMNS).includes(key)) {
      let new_sort_key = `${key}`;
      const sort_by_key = sorted[0];
      const sort_direction = sorted[1];
      const new_sorted = [];
      if (SORTABLE_COLUMNS[key] === "attribute") new_sort_key = `attributesList.${key}`;
      if (sort_by_key === new_sort_key) { // change direction, keep key the same
        new_sorted.push(sort_by_key);
        new_sorted.push((sort_direction || 1) * -1);
      }
      else {
        new_sorted.push(new_sort_key);
        new_sorted.push(1);
      }
      setSorted(new_sorted);
      let new_saved_sort;
      let current_saved_sorted = localStorage.getItem("sorted");
      if (current_saved_sorted === null) new_saved_sort = {};
      else new_saved_sort = JSON.parse(current_saved_sorted);
      new_saved_sort[params.id || ""] = new_sorted;
      localStorage.setItem("sorted", JSON.stringify(new_saved_sort));
    }
  };

  const getParagraphStyle = (key: string) => {
    let paragraphStyle: React.CSSProperties = { margin: 0 };
    if (Object.keys(SORTABLE_COLUMNS).includes(key)) paragraphStyle["cursor"] = "pointer";
    return paragraphStyle;
  };

  const getRecordGroupName = (rg_id: string) => {
    const tempRecordGroups = recordGroups || [];
    const rg = tempRecordGroups.find((element) => element._id === rg_id);
    if (rg) return rg.name;
    else return "";
  };

  const getDocumentType = (rg_id: string) => {
    const tempRecordGroups = recordGroups || [];
    const rg = tempRecordGroups.find((element) => element._id === rg_id);
    if (rg) return rg.documentType;
    else return "";
  };

  const tableCell = (row: any, key: string) => {
    // determine colors of status icons. this is getting more and more complicated...
    let digitizationStatusIconColor = row.has_errors ? "#B71D1C" : "green";
    let reviewStatusIconColor = row.has_errors ? "#B71D1C" : "green";
    if (row.status === "processing") digitizationStatusIconColor = "#EF6C0B";
    if (row.verification_status === "required" || row.review_status === "incomplete") reviewStatusIconColor = "#E3B62E";
    else if (row.review_status === "defective") reviewStatusIconColor = "#9F0100";
    else if (row.review_status === "unreviewed") reviewStatusIconColor = "grey";
    
    if (key === "name") return <TableCell key={key}>{row.name}</TableCell>;
    else if (key === "dateCreated") return <TableCell key={key} align="right">{formatDate(row.dateCreated)}</TableCell>;
    else if (key === "api_number") return <TableCell key={key} align="right">{row.api_number}</TableCell>;
    else if (key === "confidence_median") return <TableCell key={key} align="right">{(row.status === "digitized" || row.status === "redigitized") && calculateAverageConfidence(row.attributesList)}</TableCell>;
    else if (key === "confidence_lowest") return <TableCell key={key} align="right">{(row.status === "digitized" || row.status === "redigitized") && calculateLowestConfidence(row.attributesList)}</TableCell>;
    else if (key === "notes") return (
      <TableCell key={key} align="right">
        <IconButton sx={(!row.record_notes || row.record_notes?.length === 0) ? {} : { color: "#F2DB6F" }} onClick={(e) => handleClickNotes(e, row)}>
          <StickyNote2Icon />
        </IconButton>
      </TableCell>
    );
    else if (key === "status") return (
      <TableCell key={key} align="right">
        <Typography variant='inherit' noWrap>
          <IconButton sx={{ color: digitizationStatusIconColor }}>
            {
              row.status === "processing" ? 
                <CachedIcon /> :
                row.status === "digitized" ? 
                  <CheckCircleOutlineIcon /> :
                  row.status === "redigitized" ?
                    <PublishedWithChangesOutlinedIcon /> :
                    row.status === "error" ?
                      <ErrorIcon color="error" /> :
                      null
            }
          </IconButton>
          
          {
            row.has_errors ? `${row.status} with errors`:
              row.status
          }
        </Typography>
      </TableCell>
    );

    else if (key === "review_status") return (
      <TableCell key={key} align="right">
        <Typography variant='inherit' noWrap>
          <IconButton sx={{ color: reviewStatusIconColor }}>
            {
              row.verification_status === "required" ? 
                <ErrorIcon  /> 
                :
                row.review_status === "unreviewed" ? 
                  <ErrorIcon /> 
                  :
                  row.review_status === "incomplete" ? 
                    <ErrorIcon /> 
                    :
                    row.review_status === "defective" ? 
                      <WarningIcon /> 
                      :
                      row.review_status === "reviewed" ?
                        <CheckCircleIcon /> 
                        :
                        null
            }
          </IconButton>
          {
            row.verification_status === "required" ? "Awaiting Verification" :
              row.verification_status === "verified" ? `${row.review_status}-${row.verification_status}` :
                row.review_status
          }
        </Typography>
      </TableCell>
    );
    else if (key === "record_group") return (
      <TableCell key={key} align='right'>
        <Typography variant='inherit' noWrap>
          {getRecordGroupName(row.record_group_id)}
        </Typography>
        
      </TableCell>
    );
    else if (key === "documentType") return <TableCell key={key} align='right'>{getDocumentType(row.record_group_id)}</TableCell>;
    else return <TableCell key={key} align='right'>{row[key]}</TableCell>;
  };

  const tableRow = (row: RecordData, idx: number) => {
    return (
      <TableRow
        sx={styles.tableRow}
        onClick={() => handleClickRecord(row._id)}
        key={row._id}
        id={row.name+"_record_row"}
        className="record_row"
      >
        <TableCell align="right">{row?.rank}.</TableCell>
        {table_columns.keyNames.map((v,i) => (
          tableCell(row, v)
        ))}
      </TableRow>
    );
  };

  return (
    <React.Fragment>
      <TableContainer component={Paper}>
        <Box sx={styles.topSection}>
          <Grid container>
            <Grid item sx={styles.topSectionLeft} xs={6}>
              <TableFilters applyFilters={handleApplyFilters} appliedFilters={filterBy} filter_options={filter_options} />
              <Button onClick={() => setOpenColumnSelect(true)} startIcon={<IosShareIcon />} disabled={isDownloading}>
                Export
              </Button>
            </Grid>
            <Grid item sx={styles.topSectionRight} xs={6}>
              
              {
                hasPermission("delete") ? (
                  <>
                    <IconButton onClick={handleClickShowActions}>
                      <MoreVertIcon/>
                    </IconButton>
                    <Menu
                      id="actions"
                      anchorEl={menuAnchor}
                      open={showActions}
                      onClose={() => setShowActions(false)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MenuItem
                        onClick={() => {
                          setOpenDeleteRecordsModal(true);
                          setShowActions(false);
                        }}
                      >
                          Delete Records
                      </MenuItem>
                    </Menu>
                  </>
                )
                  : null
              }
              
            </Grid>
          </Grid>
        </Box>
        <Table sx={{ minWidth: 650, marginTop: 1 }} aria-label="records table" size="small">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              {
                table_columns.displayNames.map((attribute, idx) => (
                  <TableCell sx={styles.headerCell} key={idx} align={idx > 0 ? "right" : "left"}>
                    <p style={getParagraphStyle(table_columns.keyNames[idx])} onClick={() => handleSort(table_columns.keyNames[idx] as SortableColumnKey)}>
                      {sorted[0].includes(table_columns.keyNames[idx]) &&
                        <IconButton>
                          {
                            sorted[1] === 1 ? 
                              <KeyboardArrowUpIcon /> :
                              sorted[1] === -1 &&
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
          {pageSize && records?.length ?
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50, 100, 250]}
                  colSpan={3}
                  count={recordCount}
                  rowsPerPage={pageSize}
                  page={currentPage}
                  slotProps={{
                    select: {
                      inputProps: {
                        "aria-label": "rows per page",
                      },
                      native: true,
                    },
                  }}
                  onPageChange={(e) => handleChangePage(e)}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  ActionsComponent={TablePaginationActions}
                />
              </TableRow>
            </TableFooter> : null
          }
        </Table>
        <RecordNotesDialog
          record_id={notesRecordId}
          open={showNotes}
          onClose={handleCloseNotesModal}
        />
        {
          openColumnSelect && !isDownloading && (
            <ColumnSelectDialog
              open={openColumnSelect}
              onClose={() => setOpenColumnSelect(false)}
              location={location}
              handleUpdate={handleUpdate}
              _id={params.id}
              appliedFilters={filterBy}
              sortBy={sorted[0]}
              sortAscending={sorted[1]}
            /> 
          )}
        {
          <PopupModal
            open={showDownloadMessage}
            handleClose={() => setShowDownloadMessage(false)}
            text="Your download is in progress — you can continue using the app while it completes. Please note: refreshing the page or closing this tab will cancel the download."
            handleSave={() => setShowDownloadMessage(false)}
            buttonText='Close'
            buttonColor='primary'
            buttonVariant='contained'
            width={500}
          />
        }

        <PopupModal
          open={openDeleteRecordsModal}
          handleClose={() => setOpenDeleteRecordsModal(false)}
          text="Are you sure you want to delete these records? Only currently displayed records will be deleted."
          handleSave={handleDeleteRecords}
          buttonText='Delete'
          buttonColor='error'
          buttonVariant='contained'
          width={400}
        />
          
        
      </TableContainer>
      {
        loading ? <TableLoading/> :
          !records?.length ? <EmptyTable/> :
            null
      }
    </React.Fragment>
  );
};

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
        {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
};

export default RecordsTable;