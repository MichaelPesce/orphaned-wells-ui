import {
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useEffect, useState } from "react";
import { MongoProcessor, SchemaField } from "../../types";
import { schemaProcessorColumns as columns } from "../../util";
import PopupModal from "../PopupModal/PopupModal";
import AddSchemaFieldDialog from "./AddSchemaFieldDialog";

interface SchemaSheetProps {
  processor?: MongoProcessor;
  cleaningFunctions?: string[];
  onAttributeChange: (
    processorName: string,
    fieldName: string,
    updates: Record<string, string | number | null>,
    operation?: "update" | "add" | "delete"
  ) => void | Promise<void>;
}

const DATA_TYPE_OPTIONS = ["Checkbox", "Plain text", "Datetime", "Parent"];

const DATABASE_DATA_TYPE_OPTIONS: Record<string, string[]> = {
  Checkbox: ["bool"],
  "Plain text": ["str", "int", "float"],
  Datetime: ["date"],
  Parent: ["Table"],
};

const EDIT_CONTROL_SX = {
  width: "100%",
  minWidth: 0,
  maxWidth: 180,
  "& .MuiInputBase-root": {
    fontSize: 14,
  },
  "& .MuiInputBase-input": {
    py: 0.75,
    px: 1.5,
  },
};

const EDITABLE_KEYS = [
  "name",
  "alias",
  "cleaning_function",
  "data_type",
  "database_data_type",
  "page_order_sort",
] as const;

type EditableKey = typeof EDITABLE_KEYS[number];
type DraftState = Record<EditableKey, string>;

const getDatabaseOptions = (dataType?: string) =>
  DATABASE_DATA_TYPE_OPTIONS[dataType || ""] || [];

const getDraftFromRow = (row: SchemaField): DraftState => ({
  name: row.name || "",
  alias: row.alias || "",
  cleaning_function: row.cleaning_function || "",
  data_type: row.data_type || "",
  database_data_type: row.database_data_type || "",
  page_order_sort:
    row.page_order_sort !== undefined ? String(row.page_order_sort) : "",
});

const SchemaSheet = ({
  processor,
  cleaningFunctions = [],
  onAttributeChange,
}: SchemaSheetProps) => {
  const { attributes = [] } = processor || {};
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [pendingDeleteRow, setPendingDeleteRow] = useState<SchemaField | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    setEditingRowKey(null);
    setDraft(null);
    setPendingDeleteRow(null);
    setShowAddDialog(false);
  }, [processor?.name, attributes]);

  const getRowKey = (row: SchemaField, idx: number) => `${idx}-${row.name}`;

  const startEditingRow = (row: SchemaField, idx: number) => {
    setEditingRowKey(getRowKey(row, idx));
    setDraft(getDraftFromRow(row));
  };

  const stopEditingRow = () => {
    setEditingRowKey(null);
    setDraft(null);
  };

  const handleDraftValueChange = (
    key: EditableKey,
    value: string
  ) => {
    setDraft((prev) => {
      if (!prev) return prev;

      const nextDraft = {
        ...prev,
        [key]: value,
      };

      if (key === "data_type") {
        const validDatabaseDataTypes = getDatabaseOptions(value);
        if (
          validDatabaseDataTypes.length > 0 &&
          !validDatabaseDataTypes.includes(nextDraft.database_data_type)
        ) {
          nextDraft.database_data_type = validDatabaseDataTypes[0];
        }
      }

      return nextDraft;
    });
  };

  const handleSelectChange =
    (key: EditableKey) =>
    (event: SelectChangeEvent<string>) => {
      handleDraftValueChange(key, event.target.value);
    };

  const getPageOrderSortInvalid = (pageOrderSort: string) => {
    const pageOrderSortValue = Number(pageOrderSort);
    return !Number.isInteger(pageOrderSortValue) || pageOrderSortValue <= 0;
  };

  const handleSaveRow = async (row: SchemaField) => {
    if (!processor?.name || !draft) return;
    if (getPageOrderSortInvalid(draft.page_order_sort)) return;

    const updates = EDITABLE_KEYS.reduce<Record<string, string | number | null>>(
      (acc, key) => {
        const previousValue =
          key === "page_order_sort"
            ? row.page_order_sort !== undefined
              ? String(row.page_order_sort)
              : ""
            : ((row[key] || "") as string);
        const nextValue = draft[key];

        if (previousValue !== nextValue) {
          acc[key] =
            key === "page_order_sort"
              ? Number(nextValue)
              : nextValue || null;
        }

        return acc;
      },
      {}
    );

    if (Object.keys(updates).length === 0) {
      stopEditingRow();
      return;
    }

    await onAttributeChange(processor.name, row.name, updates, "update");
    stopEditingRow();
  };

  const handleDeleteRow = async () => {
    if (!processor?.name || !pendingDeleteRow?.name) return;

    await onAttributeChange(processor.name, pendingDeleteRow.name, {}, "delete");
    if (editingRowKey && pendingDeleteRow.name === draft?.name) {
      stopEditingRow();
    }
    setPendingDeleteRow(null);
  };

  const handleOpenAddDialog = () => {
    setShowAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setShowAddDialog(false);
  };

  const handleAddField = async (
    updates: Record<string, string | number | null>
  ) => {
    if (!processor?.name) return;
    const fieldName = String(updates.name || "");
    if (!fieldName) return;
    await onAttributeChange(processor.name, fieldName, updates, "add");
  };

  const renderSelect = (
    value: string,
    onChange: (event: SelectChangeEvent<string>) => void,
    options: string[],
    allowEmpty = false
  ) => (
    <FormControl size="small" fullWidth sx={EDIT_CONTROL_SX}>
      <Select
        value={value}
        displayEmpty={allowEmpty}
        onChange={onChange}
        sx={{
          fontSize: 14,
          "& .MuiSelect-select": {
            py: 0.75,
            px: 1.5,
          },
        }}
      >
        {allowEmpty && (
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <>
      <Table
        stickyHeader
        sx={{
          minWidth: 650,
          tableLayout: "fixed",
          "& th, & td": {
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        }}
      >
        <TableHead>
          <TableRow sx={{ backgroundColor: "#fbfbfb" }}>
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ fontWeight: 600 }}>
                {col.displayName}
              </TableCell>
            ))}
            <TableCell sx={{ fontWeight: 600, width: 170 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <span>Actions</span>
                <Tooltip title="Add field">
                  <IconButton size="small" onClick={handleOpenAddDialog}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {attributes.map((row, idx) => {
            const isEditing = editingRowKey === getRowKey(row, idx) && draft;
            const pageOrderSortInvalid = !!isEditing && getPageOrderSortInvalid(draft.page_order_sort);

            return (
              <TableRow
                key={idx}
                hover
                sx={{
                  cursor: "pointer",
                  "&:hover": { backgroundColor: "rgba(0,0,0,0.03)" },
                  "& td": {
                    borderBottom: "1px solid #eee",
                    padding: "8px 16px",
                  },
                }}
              >
                {columns.map((col) => (
                  <TableCell
                    key={`${col.key}_${idx}`}
                    sx={
                      col.key === "cleaning_function"
                        ? { width: 190, minWidth: 190 }
                        : col.key === "page_order_sort"
                          ? { width: 110, minWidth: 110 }
                          : undefined
                    }
                  >
                    {isEditing && (col.key === "name" || col.key === "alias") ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={draft[col.key as EditableKey]}
                        onChange={(event) =>
                          handleDraftValueChange(col.key as EditableKey, event.target.value)
                        }
                        sx={EDIT_CONTROL_SX}
                      />
                    ) : isEditing && col.key === "cleaning_function" ? (
                      renderSelect(
                        draft.cleaning_function,
                        handleSelectChange("cleaning_function"),
                        cleaningFunctions,
                        true
                      )
                    ) : isEditing && col.key === "data_type" ? (
                      renderSelect(
                        draft.data_type,
                        handleSelectChange("data_type"),
                        DATA_TYPE_OPTIONS
                      )
                    ) : isEditing && col.key === "database_data_type" ? (
                      renderSelect(
                        draft.database_data_type,
                        handleSelectChange("database_data_type"),
                        getDatabaseOptions(draft.data_type)
                      )
                    ) : isEditing && col.key === "page_order_sort" ? (
                      <TextField
                        size="small"
                        type="number"
                        value={draft.page_order_sort}
                        onChange={(event) =>
                          handleDraftValueChange("page_order_sort", event.target.value)
                        }
                        error={pageOrderSortInvalid}
                        inputProps={{ min: 1, step: 1 }}
                        sx={{
                          ...EDIT_CONTROL_SX,
                          maxWidth: 96,
                          "& .MuiFormHelperText-root": {
                            display: "none",
                          },
                        }}
                      />
                    ) : (
                      row[col.key as keyof SchemaField]
                    )}
                  </TableCell>
                ))}
                <TableCell sx={{ width: 150 }}>
                  {editingRowKey === getRowKey(row, idx) ? (
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={pageOrderSortInvalid}
                        onClick={() => handleSaveRow(row)}
                        sx={{ minWidth: 56, px: 1 }}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        onClick={stopEditingRow}
                        sx={{ minWidth: 56, px: 1 }}
                      >
                        Cancel
                      </Button>
                    </Stack>
                  ) : (
                    <Stack direction="row" spacing={0.5}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => startEditingRow(row, idx)}
                        sx={{ minWidth: 56, px: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => setPendingDeleteRow(row)}
                        sx={{ minWidth: 72, px: 1 }}
                      >
                        Remove
                      </Button>
                    </Stack>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <PopupModal
        open={pendingDeleteRow !== null}
        handleClose={() => setPendingDeleteRow(null)}
        text={
          pendingDeleteRow
            ? `Are you sure you would like to remove ${pendingDeleteRow.name}?`
            : ""
        }
        handleSave={handleDeleteRow}
        buttonText="Remove"
        buttonColor="error"
        buttonVariant="contained"
        width={400}
      />
      <AddSchemaFieldDialog
        open={showAddDialog}
        attributes={attributes}
        cleaningFunctions={cleaningFunctions}
        onClose={handleCloseAddDialog}
        onAddField={handleAddField}
      />
    </>
  );
};

export default SchemaSheet;
