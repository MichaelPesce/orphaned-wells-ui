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
    updates: Record<string, string | null>
  ) => void | Promise<void>;
}

const DATA_TYPE_OPTIONS = ["Checkbox", "Plain text", "Datetime", "Parent"];

const DATABASE_DATA_TYPE_OPTIONS: Record<string, string[]> = {
  Checkbox: ["bool"],
  "Plain text": ["str", "int", "float"],
  Datetime: ["date"],
  Parent: ["Table"],
};

const EDITABLE_KEYS = [
  "name",
  "alias",
  "cleaning_function",
  "data_type",
  "database_data_type",
] as const;

type EditableKey = typeof EDITABLE_KEYS[number];
type DraftState = Record<EditableKey, string>;

const getDraftFromRow = (row: SchemaField & { alias?: string }): DraftState => ({
  name: row.name || "",
  alias: row.alias || "",
  cleaning_function: row.cleaning_function || "",
  data_type: row.data_type || "",
  database_data_type: row.database_data_type || "",
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

    const updates = EDITABLE_KEYS.reduce<Record<string, string | null>>(
      (acc, key) => {
        const previousValue = (row[key] || "") as string;
        const nextValue = draft[key];

        if (previousValue !== nextValue) {
          acc[key] = nextValue || null;
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
    <Table stickyHeader sx={{ minWidth: 650 }}>
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
        {attributes?.map((row: any, idx: number) => (
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
              const isEditing = editingRowKey === getRowKey(row, idx) && draft;

              return (
                <TableCell
                  key={`${col.key}_${idx}`}
                  sx={
                    col.key === "cleaning_function"
                      ? { width: 240, minWidth: 240 }
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
                    />
                  ) : isEditing && col.key === "cleaning_function" ? (
                    <FormControl
                      size="small"
                      sx={{
                        width: 220,
                        minWidth: 220,
                      }}
                    >
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
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <Select
                        value={draft.data_type}
                        displayEmpty
                        onChange={handleSelectChange("data_type")}
                      >
                        {DATA_TYPE_OPTIONS.map((dataType) => (
                          <MenuItem key={dataType} value={dataType}>
                            {dataType}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : isEditing && col.key === "database_data_type" ? (
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                      <Select
                        value={draft.database_data_type}
                        onChange={handleSelectChange("database_data_type")}
                      >
                        {getDatabaseOptions(draft.data_type).map((dataType) => (
                          <MenuItem key={dataType} value={dataType}>
                            {dataType}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    row[col.key]
                  )}
                </TableCell>
              );
            })}
            <TableCell sx={{ width: 170 }}>
              {editingRowKey === getRowKey(row, idx) ? (
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleSaveRow(row)}
                  >
                    Save
                  </Button>
                  <Button size="small" onClick={stopEditingRow}>
                    Cancel
                  </Button>
                </Stack>
              ) : (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => startEditingRow(row, idx)}
                >
                  Edit
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SchemaSheet;
