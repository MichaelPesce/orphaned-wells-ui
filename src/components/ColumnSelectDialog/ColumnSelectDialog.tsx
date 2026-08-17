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
import { Dialog, DialogTitle, DialogContent, DialogContentText, Button, Checkbox, Stack } from "@mui/material";
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
    if (Object.keys(docTypesMap).length > 0) {
      Object.entries(docTypesMap).forEach(([docType, cols]) => {
        const nodes = buildFieldTree(cols, docType);
        nodes.forEach((n) => initialKeys.push(...getAllNodeKeys(n)));
      });
    } else {
      const nodes = buildFieldTree(temp_columns);
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
    if (Object.keys(docTypeColumns).length > 0) {
      const allTreeNodes: FieldNode[] = [];
      Object.entries(docTypeColumns).forEach(([docType, cols]) => {
        allTreeNodes.push(...buildFieldTree(cols, docType));
      });
      return getRawColumnsFromKeys(allTreeNodes, selectedColumns);
    }
    const nodes = buildFieldTree(columns);
    return getRawColumnsFromKeys(nodes, selectedColumns);
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

  const handleExport = (totalBytes?: number) => {
    const exportCols = getExportColumnsList();
    const body = {
      columns: exportCols,
      sort: [sortBy, sortAscending],
      filter: convertFiltersToMongoFormat(appliedFilters),
      document_types: documentTypes || [],
    };
    downloadWithProgress(downloadRecords, [location, _id, exportTypes, name, body], `${name}.zip`, totalBytes);
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
      <DialogContent dividers={true}>
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

  const selectAllText =
    location === "documentType" ? "Select All Fields from all Document Types" : "Select All";

  const isDocTypeGrouping = Boolean(docTypeColumns && Object.keys(docTypeColumns).length > 0);

  const getAllSelectableKeys = (): string[] => {
    const allKeys: string[] = [];
    if (isDocTypeGrouping) {
      Object.entries(docTypeColumns!).forEach(([docType, cols]) => {
        const nodes = buildFieldTree(cols, docType);
        nodes.forEach((n) => allKeys.push(...getAllNodeKeys(n)));
      });
    } else {
      const nodes = buildFieldTree(columns);
      nodes.forEach((n) => allKeys.push(...getAllNodeKeys(n)));
    }
    return Array.from(new Set(allKeys));
  };

  const allSelectableKeys = getAllSelectableKeys();

  const selectAll = () => {
    if (selected.length < allSelectableKeys.length) setSelected([...allSelectableKeys]);
    else setSelected([]);
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
    <Box sx={{ m: 3 }}>
      <FormControl component="fieldset" variant="standard" required disabled={disabled} sx={{ width: "100%" }}>
        <FormLabel component="legend" sx={{ mb: 1 }}>
          Select attributes to export
        </FormLabel>

        {/* Control bar: Select All + Search Bar */}
        <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Grid item xs={12} sm={7}>
            <FormControlLabel
              control={
                <Checkbox
                  data-cy="export-select-all-columns"
                  checked={allSelectableKeys.length > 0 && selected.length === allSelectableKeys.length}
                  indeterminate={selected.length < allSelectableKeys.length && selected.length > 0}
                  onChange={selectAll}
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
            borderRadius: 2,
            p: 2,
            maxHeight: "360px",
            overflowY: "auto",
            backgroundColor: "#fafafa",
          }}
        >
          {isDocTypeGrouping ? (
            <Grid container spacing={3}>
              {Object.entries(docTypeColumns!).map(([docType, docTypeCols]) => {
                const rawNodes = buildFieldTree(docTypeCols, docType);
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
                const rawNodes = buildFieldTree(columns);
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
  );
};

export default ColumnSelectDialog;
