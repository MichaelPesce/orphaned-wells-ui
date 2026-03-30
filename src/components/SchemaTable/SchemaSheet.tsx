import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Button,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { MongoProcessor, SchemaField } from "../../types";
import { schemaProcessorColumns as columns } from "../../util";

interface SchemaSheetProps {
  processor?: MongoProcessor;
  cleaningFunctions?: string[];
  onAttributeChange: (
    processorName: string,
    fieldName: string,
    updates: Record<string, string | number | null>
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

const getDraftFromRow = (row: SchemaField & { alias?: string }): DraftState => ({
  name: row.name || "",
  alias: row.alias || "",
  cleaning_function: row.cleaning_function || "",
  data_type: row.data_type || "",
  database_data_type: row.database_data_type || "",
  page_order_sort:
    row.page_order_sort !== undefined ? String(row.page_order_sort) : "",
});

const SchemaSheet = (props: SchemaSheetProps) => {
  const {
    processor,
    cleaningFunctions = [],
    onAttributeChange,
  } = props;
  const { attributes } = processor || { attributes: [] };
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);

  useEffect(() => {
    setEditingRowKey(null);
    setDraft(null);
  }, [processor?.name]);

  const getRowKey = (row: SchemaField, idx: number) => `${idx}-${row.name}`;

  const startEditingRow = (row: SchemaField & { alias?: string }, idx: number) => {
    setEditingRowKey(getRowKey(row, idx));
    setDraft(getDraftFromRow(row));
  };

  const stopEditingRow = () => {
    setEditingRowKey(null);
    setDraft(null);
  };

  const getDatabaseOptions = (dataType?: string) =>
    DATABASE_DATA_TYPE_OPTIONS[dataType || ""] || [];

  const handleDraftValueChange = (key: EditableKey, value: string) => {
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
    (key: EditableKey) => (event: SelectChangeEvent<string>) => {
      handleDraftValueChange(key, event.target.value);
    };

  const handleSaveRow = async (row: SchemaField & { alias?: string }) => {
    if (!processor?.name || !draft) return;

    const pageOrderSortValue = Number(draft.page_order_sort);
    const pageOrderSortInvalid =
      !Number.isInteger(pageOrderSortValue) || pageOrderSortValue <= 0;

    if (pageOrderSortInvalid) return;

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

    await onAttributeChange(processor.name, row.name, updates);
    stopEditingRow();
  };

  return (
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
          <TableCell sx={{ fontWeight: 600, width: 170 }}>Actions</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {attributes?.map((row: any, idx: number) => {
          const isEditing = editingRowKey === getRowKey(row, idx) && draft;
          const pageOrderSortValue = Number(draft?.page_order_sort);
          const pageOrderSortInvalid =
            !!isEditing &&
            (!Number.isInteger(pageOrderSortValue) ||
              pageOrderSortValue <= 0);

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
              {columns.map((col) => {

                return (
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
                        value={draft[col.key]}
                        onChange={(event) =>
                          handleDraftValueChange(col.key as EditableKey, event.target.value)
                        }
                        sx={EDIT_CONTROL_SX}
                      />
                    ) : isEditing && col.key === "cleaning_function" ? (
                      <FormControl size="small" fullWidth sx={EDIT_CONTROL_SX}>
                        <Select
                          value={draft.cleaning_function}
                          displayEmpty
                          onChange={handleSelectChange("cleaning_function")}
                          sx={{
                            fontSize: 14,
                            "& .MuiSelect-select": {
                              py: 0.75,
                              px: 1.5,
                            },
                          }}
                        >
                          <MenuItem value="">
                            <em>None</em>
                          </MenuItem>
                          {cleaningFunctions.map((cleaningFunction) => (
                            <MenuItem
                              key={cleaningFunction}
                              value={cleaningFunction}
                            >
                              {cleaningFunction}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                  ) : isEditing && col.key === "data_type" ? (
                    <FormControl size="small" fullWidth sx={EDIT_CONTROL_SX}>
                      <Select
                        value={draft.data_type}
                        displayEmpty
                        onChange={handleSelectChange("data_type")}
                        sx={{
                          fontSize: 14,
                          "& .MuiSelect-select": {
                            py: 0.75,
                            px: 1.5,
                          },
                        }}
                      >
                        {DATA_TYPE_OPTIONS.map((dataType) => (
                          <MenuItem key={dataType} value={dataType}>
                            {dataType}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : isEditing && col.key === "database_data_type" ? (
                    <FormControl size="small" fullWidth sx={EDIT_CONTROL_SX}>
                      <Select
                        value={draft.database_data_type}
                        onChange={handleSelectChange("database_data_type")}
                        sx={{
                          fontSize: 14,
                          "& .MuiSelect-select": {
                            py: 0.75,
                            px: 1.5,
                          },
                        }}
                      >
                        {getDatabaseOptions(draft.data_type).map((dataType) => (
                          <MenuItem key={dataType} value={dataType}>
                            {dataType}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
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
                      row[col.key]
                    )}
                  </TableCell>
                );
              })}
              <TableCell sx={{ width: 130 }}>
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
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => startEditingRow(row, idx)}
                    sx={{ minWidth: 64, px: 1 }}
                  >
                    Edit
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default SchemaSheet;
