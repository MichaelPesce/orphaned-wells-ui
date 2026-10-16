import { useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { deleteProcessorSchema } from "../../services/app.service";
import { schemaOverviewColumns as columns, callAPI } from "../../util";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import QuickLook from "../QuickLook/QuickLook";
import { MongoProcessor } from "../../types";
import { useKeyDown } from "../../util";
import { useUserContext } from "../../usercontext";

interface SchemaSheetProps {
  readOnly: boolean;
  processors: MongoProcessor[];
  setTabValue: (v: number) => void;
  setEditingProcessor: (i: number) => void;
  setErrorMessage: (v: string | null) => void;
}

const styles = {
  iconButton: {
    padding: "4px",
    margin: 0
  }
};

const SchemaOverViewSheet = ({ processors, readOnly, setTabValue, setEditingProcessor, setErrorMessage }: SchemaSheetProps) => {
  const { hasPermission } = useUserContext();
  const canEdit = !readOnly && hasPermission("manage_schema");
  const canDelete = canEdit && hasPermission("manage_schema_destructive");
  const [showDeleteProcessorModal, setShowDeleteProcessorModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<number>();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [previewImage, setPreviewImage] = useState<string>();

  const handleCycleThroughPreviewImage = (direction: string = "next") => {
    if (previewImage) {
      const lastIndex = processors.length - 1;
      let newProcessorPreview;
      let idx = processors.findIndex((element) => element.img === previewImage);
      if (direction === "next") {
        if (idx === lastIndex) {
          newProcessorPreview = processors[0];
        } else {
          newProcessorPreview = processors[idx + 1];
        }
      }
      else if (direction === "previous") {
        if (idx === 0) {
          newProcessorPreview = processors[lastIndex];
        } else {
          newProcessorPreview = processors[idx - 1];
        }
      }
      setPreviewImage(newProcessorPreview?.img);
    }
  };

  useKeyDown("ArrowLeft", () => handleCycleThroughPreviewImage("previous"), undefined, undefined, undefined, false);
  useKeyDown("ArrowUp", () => handleCycleThroughPreviewImage("previous"), undefined, undefined, undefined, false);
  useKeyDown("ArrowRight", () => handleCycleThroughPreviewImage("next"), undefined, undefined, undefined, false);
  useKeyDown("ArrowDown", () => handleCycleThroughPreviewImage("next"), undefined, undefined, undefined, false);

  if (!processors || processors.length === 0) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>No data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

  const handleClickDeleteIcon = (idx: number) => {
    setDeleteError(undefined);
    setPendingDelete(idx);
    setShowDeleteProcessorModal(true);
  };

  const handleDeleteProcessor = async () => {
    if (deleting) return;
    if (pendingDelete !== undefined) {
      setDeleting(true);
      setDeleteError(undefined);
      await callAPI(
        deleteProcessorSchema,
        [processors[pendingDelete].name, processors[pendingDelete].schema_id],
        () => window.location.reload(),
        (error: string) => setDeleteError(`Unable to delete: ${error}`)
      );
      setDeleting(false);
    } else {
      setErrorMessage("processor idx is not found in list");
    }
  };

  const targetProcessor = processors[pendingDelete || 0];
  const attachedGroups = targetProcessor?.record_groups || [];

  return (
    <>
      <Table stickyHeader sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#fbfbfb" }}>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                sx={{ fontWeight: 600 }}
                align={col.key === "img" ? "center" : "left"}
              >
                {col.displayName}
              </TableCell>
            ))}
            {canEdit && <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>}
          </TableRow>
        </TableHead>

        <TableBody>
          {processors.map((row: any, idx: number) => (
            <TableRow
              data-cy="schema-processor-row"
              data-processor-name={row.name}
              onClick={() => {
                const newTabValue = idx + 1;
                setTabValue(newTabValue);
              }}
              key={idx}
              hover
              sx={{
                cursor: "pointer",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.03)" },
                "& td": {
                  borderBottom: "1px solid #eee",
                  padding: "12px 16px",
                },
              }}
            >
              {columns.map((col) => {
                let content;
                let val = row[col.key];
                if (col.key === "img") content = <img style={{ height: "16px" }} src={val} alt={`${row.name} sample`} />;
                else content = val;
                return (
                  <TableCell
                    onClick={(e) => {
                      if (col.key === "img") {
                        e.stopPropagation();
                        if (val)
                          setPreviewImage(val);
                      }
                    }}
                    align={col.key === "img" ? "center" : "left"}
                    key={col.key}
                  >
                    {content}
                  </TableCell>
                );
              })}
              {canEdit && <TableCell onClick={(e) => e.stopPropagation()} align="center">
                <IconButton aria-label={`Edit ${row.name}`} sx={styles.iconButton} onClick={() => setEditingProcessor(idx)}>
                  <EditIcon />
                </IconButton>
                {canDelete && <IconButton aria-label={`Delete ${row.name}`} sx={styles.iconButton} onClick={() => handleClickDeleteIcon(idx)}>
                  <DeleteIcon />
                </IconButton>}
              </TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog
        open={showDeleteProcessorModal}
        onClose={() => { if (!deleting) setShowDeleteProcessorModal(false); }}
        fullWidth
        maxWidth="xs"
        aria-labelledby="remove-schema-dialog-title"
        data-cy="popup-modal"
        PaperProps={{
          sx: {
            borderRadius: "10px",
            maxWidth: 460,
          },
        }}
      >
        <DialogTitle
          id="remove-schema-dialog-title"
          sx={{ fontWeight: 700, fontSize: "1.125rem", color: "#18181b", pr: 6 }}
        >
          Remove Schema
          <IconButton
            aria-label="Close"
            disabled={deleting}
            onClick={() => setShowDeleteProcessorModal(false)}
            sx={{ position: "absolute", right: 8, top: 8, color: "#71717a" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2.5, px: 3 }}>
          <Typography sx={{ color: "#27272a", fontSize: "0.9375rem", lineHeight: 1.5 }}>
            Are you sure you would like to remove{" "}
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                fontFamily: "monospace",
                bgcolor: "#f4f4f5",
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                color: "#18181b",
              }}
            >
              {targetProcessor?.name}
            </Box>
            ?
          </Typography>
          {attachedGroups.length > 0 && (
            <Alert
              severity="warning"
              sx={{
                mt: 2,
                borderRadius: "8px",
                bgcolor: "#fffbeb",
                border: "1px solid #fde68a",
                color: "#92400e",
                "& .MuiAlert-icon": { color: "#d97706" },
              }}
            >
              <AlertTitle sx={{ fontWeight: 700, fontSize: "0.875rem", mb: 0.5 }}>
                {attachedGroups.length === 1
                  ? "1 record group will be detached"
                  : `${attachedGroups.length} record groups will be detached`}
              </AlertTitle>
              <Typography variant="body2" sx={{ color: "#92400e", mb: 1, lineHeight: 1.4 }}>
                {attachedGroups.length === 1
                  ? "The following record group is attached to this schema and will be detached:"
                  : "The following record groups are attached to this schema and will be detached:"}
              </Typography>
              <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.25 }}>
                {attachedGroups.map((group, index) => (
                  <Typography
                    component="li"
                    key={group.id || group.name || index}
                    variant="body2"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "#78350f",
                      wordBreak: "break-word",
                    }}
                  >
                    {group.name || group.id}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          )}
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: "8px" }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.75, gap: 1 }}>
          <Button
            onClick={() => setShowDeleteProcessorModal(false)}
            disabled={deleting}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteProcessor}
            disabled={deleting}
            color="error"
            variant="contained"
            data-cy="popup-primary-button"
          >
            {deleting ? "Removing…" : "Remove"}
          </Button>
        </DialogActions>
      </Dialog>
      {
        previewImage &&
        <QuickLook
          open={previewImage !== undefined}
          onClose={() => setPreviewImage(undefined)}
          imageUrl={previewImage}
        />
      }
    </>
  );
};

export default SchemaOverViewSheet;
