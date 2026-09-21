import { useState } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@mui/material";
import { deleteProcessorSchema } from "../../services/app.service";
import { schemaOverviewColumns as columns, callAPI } from "../../util";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PopupModal from "../PopupModal/PopupModal";
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

  return (
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
              const newTabValue = idx+1;
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
              if (col.key === "img") content = <img style={{height: "16px"}} src={val} alt={`${row.name} sample`} />;
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
                <EditIcon/>
              </IconButton>
              {canDelete && <IconButton aria-label={`Delete ${row.name}`} sx={styles.iconButton} onClick={() => handleClickDeleteIcon(idx)}>
                <DeleteIcon/>
              </IconButton>}
            </TableCell>}
          </TableRow>
        ))}
      </TableBody>
      <PopupModal
        open={showDeleteProcessorModal}
        handleClose={() => { if (!deleting) setShowDeleteProcessorModal(false); }}
        showError={!!deleteError}
        errorText={deleteError}
        text={`Are you sure you would like to remove ${processors[pendingDelete || 0].name}?`}
        handleSave={handleDeleteProcessor}
        buttonText={deleting ? "Removing…" : "Remove"}
        buttonColor='error'
        buttonVariant='contained'
        width={400}
      />
      {
        previewImage && 
        <QuickLook
          open={previewImage !== undefined}
          onClose={() => setPreviewImage(undefined)}
          imageUrl={previewImage}
        />
      }
    </Table>
  );
};

export default SchemaOverViewSheet;
