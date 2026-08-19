import { useEffect, useState } from "react";
import {
  Box,
  FormLabel,
  FormControl,
  IconButton,
  FormGroup,
  FormControlLabel,
  Grid,
  Tooltip,
  TextField,
  InputAdornment,
  Typography,
} from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogContentText, Button, Checkbox, Stack, Divider } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";
import { callAPI, convertFiltersToMongoFormat } from "../../util";
import { downloadRecords, getColumnData, getDownloadSize } from "../../services/app.service";
import { ColumnSelectDialogProps, CheckboxesGroupProps, ExportTypeSelectionProps } from "../../types";
import CircularProgress from "@mui/material/CircularProgress";
import ErrorBar from "../ErrorBar/ErrorBar";
import { useUserContext } from "../../usercontext";
import { useDownload } from "../../context/DownloadContext";
import {
  buildFieldTree,
  getNodeCheckState,
  toggleNodeSelection,
  filterFieldNodes,
  getAllNodeKeys,
  getRawColumnsFromKeys,
  FieldNode,
} from "./columnSelectUtils";

const ColumnSelectDialog = (props: ColumnSelectDialogProps) => {
  const { open, onClose, location, handleUpdate, _id, appliedFilters, sortBy, sortAscending, documentTypes, selectedRecordGroups } = props;
  const { hasPermission } = useUserContext();

  const [columns, setColumns] = useState<string[]>([]);
  const [docTypeColumns, setDocTypeColumns] = useState<{ [key: string]: string[] }>({});
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [loadingFileSize, setLoadingFileSize] = useState(false);
  const [objSettings, setObjSettings] = useState<any>();
  const [errorMsg, setErrorMsg] = useState<string | null>("");
  const [exportTypes, setExportTypes] = useState<{ [key: string]: boolean }>({
    "csv": false,
    "json": true,
    "image_files": false,
  });
  const [name, setName] = useState("");
  const dialogHeight = "85vh";
  const dialogWidth = "60vw";

  const { isDownloading, downloadWithProgress } = useDownload();

  useEffect(() => {
    if (open) {
      callAPI(
        getColumnData,
        [location, _id, selectedRecordGroups],
        setDefaultColumns,
        handleFailedGetColumnData
      );
    }
  }, [open]);

  const styles = {
    dialogPaper: {
      minHeight: dialogHeight,
      maxHeight: dialogHeight,
      minWidth: dialogWidth,
      maxWidth: dialogWidth,
    },
    dialogContent: {
      position: "relative",
      paddingBottom: "70px",
    },
    dialogButtons: {
      paddingTop: "70px",
    },
    loader: {
      position: "absolute",
      right: "50%",
      top: "50%",
    },
    closeIcon: {
      position: "absolute",
      right: 0,
      top: 8,
    },
  };

  const setDefaultColumns = (data: { columns: string[]; doc_type_columns?: { [key: string]: string[] }; obj: any }) => {
    const temp_columns = data?.columns || [];
    setColumns(temp_columns);
    const docTypesMap = data?.doc_type_columns || {};
    setDocTypeColumns(docTypesMap);

    const initialKeys: string[] = [];

    // Retain record_notes if present in columns
    const hasNotes = temp_columns.some((col) => col.toLowerCase() === "record_notes");
    if (hasNotes) {
      const notesKey = temp_columns.find((col) => col.toLowerCase() === "record_notes") || "record_notes";
      initialKeys.push(notesKey);
    }

    if (Object.keys(docTypesMap).length > 0) {
      Object.entries(docTypesMap).forEach(([docType, cols]) => {
        const attributeCols = cols.filter((c) => c.toLowerCase() !== "record_notes");
        const nodes = buildFieldTree(attributeCols, docType);
        nodes.forEach((n) => initialKeys.push(...getAllNodeKeys(n)));
      });
    } else {
      const attributeCols = temp_columns.filter((c) => c.toLowerCase() !== "record_notes");
      const nodes = buildFieldTree(attributeCols);
      nodes.forEach((n) => initialKeys.push(...getAllNodeKeys(n)));
    }

    setSelectedColumns(initialKeys);
    setObjSettings(data.obj?.settings);
    setName(data.obj?.name || "");
  };

  const handleClose = () => {
    onClose();
  };

  const getExportColumnsList = (): string[] => {
    const notesSelected = selectedColumns.filter((col) => col.toLowerCase() === "record_notes");
    let attributeRawCols: string[] = [];

    if (Object.keys(docTypeColumns).length > 0) {
      const allTreeNodes: FieldNode[] = [];
      Object.entries(docTypeColumns).forEach(([docType, cols]) => {
        const attributeCols = cols.filter((c) => c.toLowerCase() !== "record_notes");
        allTreeNodes.push(...buildFieldTree(attributeCols, docType));
      });
      attributeRawCols = getRawColumnsFromKeys(allTreeNodes, selectedColumns);
    } else {
      const attributeCols = columns.filter((c) => c.toLowerCase() !== "record_notes");
      const nodes = buildFieldTree(attributeCols);
      attributeRawCols = getRawColumnsFromKeys(nodes, selectedColumns);
    }

    return Array.from(new Set([...attributeRawCols, ...notesSelected]));
  };

  const handleGetTotalBytes = () => {
    const exportCols = getExportColumnsList();
    if (exportTypes.image_files) {
      const body = {
        columns: exportCols,
        sort: [sortBy, sortAscending],
        filter: convertFiltersToMongoFormat(appliedFilters),
        document_types: documentTypes || [],
      };
      setLoadingFileSize(true);
      callAPI(
        getDownloadSize,
        [location, _id, body],
        (totalBytes) => fetchedDownloadSize(totalBytes),
        handleFailedExport
      );
    } else {
      fetchedDownloadSize(0);
    }
  };

  const fetchedDownloadSize = (totalBytes: number) => {
    setLoadingFileSize(false);
    handleExport(totalBytes);
  };

  const handleExport = async (totalBytes?: number) => {
    const exportCols = getExportColumnsList();
    const body = {
      columns: exportCols,
      sort: [sortBy, sortAscending],
      filter: convertFiltersToMongoFormat(appliedFilters),
      document_types: documentTypes || [],
    };
    await downloadWithProgress(downloadRecords, [location, _id, exportTypes, name, body], `${name}.zip`, totalBytes);
    handleClose();
  };

  const handleFailedExport = (e: string) => {
    setLoadingFileSize(false);
    setErrorMsg("unable to export: " + e);
  };

  const handleFailedGetColumnData = (e: string) => {
    setErrorMsg("failed to get column data: " + e);
  };

  const handleChangeExportTypes = (name: string) => {
    let tempExportTypes = { ...exportTypes };
    tempExportTypes[name] = !tempExportTypes[name];
    setExportTypes(tempExportTypes);
  };

  const disableDownload = () => {
    if (isDownloading || loadingFileSize || !columns?.length) return true;
    for (let each of Object.keys(exportTypes)) {
      if (exportTypes[each]) return false;
    }
    return true;
  };

  const numDocTypesIdentified = Object.keys(docTypeColumns).length || documentTypes?.length || 0;

  return (
    <Dialog
      open={open}
      onClose={!loadingFileSize ? handleClose : undefined}
      data-cy="export-dialog"
      scroll={"paper"}
      aria-labelledby="export-dialog"
      aria-describedby="export-dialog-description"
      PaperProps={{
        sx: styles.dialogPaper,
      }}
    >
      <DialogTitle id="export-dialog-title">
        {location === "documentType"
          ? `Export Records: ${selectedRecordGroups?.length || 0} Record Groups Selected`
          : `Export ${location.replace("_", " ")}`}
      </DialogTitle>
      <IconButton aria-label="close" onClick={handleClose} sx={styles.closeIcon}>
        <CloseIcon />
      </IconButton>
      <DialogContent dividers={true} sx={{ overflowY: "hidden", pb: "50px" }}>
        {(loadingFileSize || !columns?.length) && <CircularProgress sx={styles.loader} />}

        <DialogContentText
          id="scroll-dialog-description"
          tabIndex={-1}
          aria-labelledby="export-dialog-content-text"
          component={"span"}
        >
          {location === "documentType" && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2, px: 3 }}>
              Records from selected Record Groups will be exported into files based on{" "}
              <b>{numDocTypesIdentified} Document Types identified.</b>
            </Typography>
          )}

          <ExportTypeSelection
            exportTypes={exportTypes}
            updateExportTypes={handleChangeExportTypes}
            disabled={loadingFileSize || isDownloading}
            location={location}
          />
          <Divider sx={{ my: 2 }} />
          <CheckboxesGroup
            columns={columns}
            docTypeColumns={docTypeColumns}
            selected={selectedColumns}
            setSelected={setSelectedColumns}
            disabled={loadingFileSize || isDownloading}
            location={location}
          />
        </DialogContentText>
      </DialogContent>
      <div style={styles.dialogButtons}>
        <Button
          variant="contained"
          sx={{
            position: "absolute",
            right: 10,
            bottom: 10,
          }}
          startIcon={<DownloadIcon />}
          onClick={handleGetTotalBytes}
          id="download-button"
          data-cy="download-button"
          disabled={disableDownload()}
        >
          Export Data
        </Button>
      </div>
      <ErrorBar errorMessage={errorMsg} setErrorMessage={setErrorMsg} />
    </Dialog>
  );
};

const ExportTypeSelection = (props: ExportTypeSelectionProps) => {
  const { exportTypes, updateExportTypes, disabled } = props;

  const handleChangeExportTypes = (event: React.ChangeEvent<HTMLInputElement>) => {
    let name = event.target.name;
    updateExportTypes(name);
  };

  return (
    <Box>
      <FormControl sx={{ mx: 3 }} component="fieldset" variant="standard" required disabled={disabled}>
        <FormLabel component="legend" id="export-type-label">
          Export Format
        </FormLabel>
        <FormGroup>
          <Stack direction="row">
            {Object.entries(exportTypes).map(([export_type, is_selected]) => (
              <FormControlLabel
                key={export_type}
                data-cy="export-type-option"
                data-export-type={export_type}
                control={<Checkbox checked={is_selected} onChange={handleChangeExportTypes} name={export_type} />}
                label={export_type.replace("_", " ")}
              />
            ))}
          </Stack>
        </FormGroup>
      </FormControl>
    </Box>
  );
};

const CheckboxesGroup = (props: CheckboxesGroupProps) => {
  const { columns, docTypeColumns, selected, setSelected, disabled, location } = props;
  const [searchQuery, setSearchQuery] = useState("");

  const hasRecordNotes = columns.some((col) => col.toLowerCase() === "record_notes");
  const notesKey = columns.find((col) => col.toLowerCase() === "record_notes") || "record_notes";
  const isNotesSelected = selected.some((col) => col.toLowerCase() === "record_notes");

  const selectAllText =
    location === "documentType"
      ? "Select All Fields from all Document Types"
      : "Select All Fields in the Records";

  const isDocTypeGrouping = Boolean(docTypeColumns && Object.keys(docTypeColumns).length > 0);

  const getAllSelectableAttributeKeys = (): string[] => {
    const allKeys: string[] = [];
    if (isDocTypeGrouping) {
      Object.entries(docTypeColumns!).forEach(([docType, cols]) => {
        const attributeCols = cols.filter((c) => c.toLowerCase() !== "record_notes");
        const nodes = buildFieldTree(attributeCols, docType);
        nodes.forEach((n) => allKeys.push(...getAllNodeKeys(n)));
      });
    } else {
      const attributeCols = columns.filter((c) => c.toLowerCase() !== "record_notes");
      const nodes = buildFieldTree(attributeCols);
      nodes.forEach((n) => allKeys.push(...getAllNodeKeys(n)));
    }
    return Array.from(new Set(allKeys));
  };

  const allAttributeKeys = getAllSelectableAttributeKeys();
  const selectedAttributeKeys = selected.filter((k) => k.toLowerCase() !== "record_notes");

  const selectAllAttributes = () => {
    const notesSelected = selected.filter((k) => k.toLowerCase() === "record_notes");
    if (selectedAttributeKeys.length < allAttributeKeys.length) {
      setSelected([...allAttributeKeys, ...notesSelected]);
    } else {
      setSelected([...notesSelected]);
    }
  };

  const handleToggleNotes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked;
    const tempSelected = [...selected];
    if (isChecked) {
      if (!tempSelected.includes(notesKey)) {
        tempSelected.push(notesKey);
      }
    } else {
      const index = tempSelected.indexOf(notesKey);
      if (index > -1) {
        tempSelected.splice(index, 1);
      }
    }
    setSelected(tempSelected);
  };

  const getSubfieldTooltipText = (name: string) => {
    const splitName = name?.split("::");
    if (splitName?.length >= 2) {
      const parentName = splitName[splitName.length - 2];
      const childName = splitName[splitName.length - 1];
      return `${childName} from table ${parentName}`;
    }
    return null;
  };

  const renderFieldNode = (node: FieldNode) => {
    const checkState = getNodeCheckState(node, selected);
    const rawCol = node.rawColumn || node.displayName;

    return (
      <Box key={node.key} sx={{ mb: 0.5 }}>
        <FormControlLabel
          data-cy="export-column-label"
          data-column={rawCol}
          control={
            <Checkbox
              data-cy="export-column-option"
              checked={checkState.checked}
              indeterminate={checkState.indeterminate}
              onChange={() => setSelected(toggleNodeSelection(node, selected))}
              name={rawCol}
            />
          }
          label={
            <Tooltip title={rawCol.includes("::") ? getSubfieldTooltipText(rawCol) : null}>
              <span>{node.displayName}</span>
            </Tooltip>
          }
        />
        {node.isParent && node.subfields.length > 0 && (
          <Box sx={{ pl: 3, display: "flex", flexDirection: "column" }}>
            {node.subfields.map((subNode) => {
              const subState = getNodeCheckState(subNode, selected);
              const subRawCol = subNode.rawColumn || subNode.displayName;
              return (
                <FormControlLabel
                  key={subNode.key}
                  data-cy="export-column-label"
                  data-column={subRawCol}
                  control={
                    <Checkbox
                      data-cy="export-column-option"
                      checked={subState.checked}
                      indeterminate={subState.indeterminate}
                      onChange={() => setSelected(toggleNodeSelection(subNode, selected))}
                      name={subRawCol}
                    />
                  }
                  label={
                    <Tooltip title={getSubfieldTooltipText(subRawCol)}>
                      <span>{subNode.displayName}</span>
                    </Tooltip>
                  }
                />
              );
            })}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* Top Section: User Notes Checkbox (if present) */}
      <Box sx={{ mx: 3, mt: 1, mb: 1 }}>
        <FormLabel component="legend" sx={{ textTransform: "uppercase", fontSize: "0.75rem", fontWeight: "bold", mb: 1 }}>
          Select attributes to export
        </FormLabel>
        {hasRecordNotes && (
          <FormGroup row sx={{ mb: 1 }}>
            <FormControlLabel
              control={<Checkbox checked={isNotesSelected} onChange={handleToggleNotes} />}
              label={<b>User Notes</b>}
            />
          </FormGroup>
        )}
      </Box>

      {hasRecordNotes && <Divider />}

      {/* Main Attributes Section with Select All and Search */}
      <Box sx={{ mx: 3, mt: 2 }}>
        <FormControl component="fieldset" variant="standard" required disabled={disabled} sx={{ width: "100%" }}>
          <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={7}>
              <FormControlLabel
                control={
                  <Checkbox
                    data-cy="export-select-all-columns"
                    checked={allAttributeKeys.length > 0 && selectedAttributeKeys.length === allAttributeKeys.length}
                    indeterminate={selectedAttributeKeys.length < allAttributeKeys.length && selectedAttributeKeys.length > 0}
                    onChange={selectAllAttributes}
                  />
                }
                label={<b>{selectAllText}</b>}
              />
            </Grid>
            <Grid item xs={12} sm={5} sx={{ display: "flex", justifyContent: "flex-end" }}>
              <TextField
                placeholder="Search Field Name"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: "240px" }}
              />
            </Grid>
          </Grid>

          {/* Scrollable Container with Border */}
          <Box
            sx={{
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              p: 2,
              maxHeight: "180px",
              overflowY: "auto",
              mb: 1,
              backgroundColor: "#fafafa",
            }}
          >
            {isDocTypeGrouping ? (
              <Grid container spacing={3}>
                {Object.entries(docTypeColumns!).map(([docType, docTypeCols]) => {
                  const attributeCols = docTypeCols.filter((c) => c.toLowerCase() !== "record_notes");
                  const rawNodes = buildFieldTree(attributeCols, docType);
                  const filteredNodes = filterFieldNodes(rawNodes, searchQuery);

                  if (searchQuery && filteredNodes.length === 0) return null;

                  return (
                    <Grid item xs={12} sm={6} key={docType}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold", color: "#555", mb: 1, borderBottom: "1px solid #ddd", pb: 0.5 }}
                      >
                        {docType}
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        {filteredNodes.map((node) => renderFieldNode(node))}
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            ) : (
              <Grid container spacing={2}>
                {(() => {
                  const attributeCols = columns.filter((c) => c.toLowerCase() !== "record_notes");
                  const rawNodes = buildFieldTree(attributeCols);
                  const filteredNodes = filterFieldNodes(rawNodes, searchQuery);
                  return filteredNodes.map((node) => (
                    <Grid item xs={12} sm={6} key={node.key}>
                      {renderFieldNode(node)}
                    </Grid>
                  ));
                })()}
              </Grid>
            )}
          </Box>
        </FormControl>
      </Box>
    </Box>
  );
};

export default ColumnSelectDialog;
