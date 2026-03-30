import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { SchemaField } from "../../types";

interface AddSchemaFieldDialogProps {
  open: boolean;
  attributes: SchemaField[];
  cleaningFunctions: string[];
  onClose: () => void;
  onAddField: (updates: Record<string, string | number | null>) => Promise<void> | void;
}

const DATA_TYPE_OPTIONS = ["Checkbox", "Plain text", "Datetime", "Parent"];

const DATABASE_DATA_TYPE_OPTIONS: Record<string, string[]> = {
  Checkbox: ["bool"],
  "Plain text": ["str", "int", "float"],
  Datetime: ["date"],
  Parent: ["Table"],
};

const getDatabaseOptions = (dataType?: string) =>
  DATABASE_DATA_TYPE_OPTIONS[dataType || ""] || [];

const getNextPageOrderSort = (attributes: SchemaField[] = []) => {
  const maxPageOrderSort = attributes.reduce((maxValue, attribute) => {
    const currentValue = Number(attribute.page_order_sort);
    if (!Number.isInteger(currentValue) || currentValue <= 0) return maxValue;
    return Math.max(maxValue, currentValue);
  }, 0);

  return String(maxPageOrderSort + 1);
};

const getPageOrderSortInvalid = (pageOrderSort: string) => {
  const pageOrderSortValue = Number(pageOrderSort);
  return !Number.isInteger(pageOrderSortValue) || pageOrderSortValue <= 0;
};

const getInitialDraft = (
  attributes: SchemaField[]
): Record<string, string> => ({
  name: "",
  alias: "",
  cleaning_function: "",
  data_type: "",
  database_data_type: "",
  page_order_sort: getNextPageOrderSort(attributes),
});

const AddSchemaFieldDialog = ({
  open,
  attributes,
  cleaningFunctions,
  onClose,
  onAddField,
}: AddSchemaFieldDialogProps) => {
  const [draft, setDraft] = useState<Record<string, string>>(getInitialDraft(attributes));

  useEffect(() => {
    if (!open) return;
    setDraft(getInitialDraft(attributes));
  }, [open, attributes]);

  const handleDraftValueChange = (key: string, value: string) => {
    setDraft((prev) => {
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
    (key: string) => (event: SelectChangeEvent<string>) => {
      handleDraftValueChange(key, event.target.value);
    };

  const handleSubmit = async () => {
    if (!draft.name || !draft.data_type || !draft.database_data_type) return;
    if (getPageOrderSortInvalid(draft.page_order_sort)) return;

    await onAddField({
      name: draft.name,
      alias: draft.alias || null,
      cleaning_function: draft.cleaning_function || null,
      data_type: draft.data_type,
      database_data_type: draft.database_data_type,
      page_order_sort: Number(draft.page_order_sort),
    });
    onClose();
  };

  const addFieldDisabled =
    !draft.name ||
    !draft.data_type ||
    !draft.database_data_type ||
    getPageOrderSortInvalid(draft.page_order_sort);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Field</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Field Name"
            value={draft.name}
            onChange={(event) => handleDraftValueChange("name", event.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Display Name"
            value={draft.alias}
            onChange={(event) => handleDraftValueChange("alias", event.target.value)}
            fullWidth
          />
          <FormControl fullWidth>
            <Select
              value={draft.cleaning_function}
              displayEmpty
              onChange={handleSelectChange("cleaning_function")}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {cleaningFunctions.map((cleaningFunction) => (
                <MenuItem key={cleaningFunction} value={cleaningFunction}>
                  {cleaningFunction}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
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
          <FormControl fullWidth>
            <Select
              value={draft.database_data_type}
              displayEmpty
              onChange={handleSelectChange("database_data_type")}
            >
              {getDatabaseOptions(draft.data_type).map((dataType) => (
                <MenuItem key={dataType} value={dataType}>
                  {dataType}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Page Order"
            value={draft.page_order_sort}
            onChange={(event) =>
              handleDraftValueChange("page_order_sort", event.target.value)
            }
            required
            fullWidth
            type="number"
            error={getPageOrderSortInvalid(draft.page_order_sort)}
            helperText={
              getPageOrderSortInvalid(draft.page_order_sort)
                ? "Must be an integer greater than 0"
                : " "
            }
            inputProps={{ min: 1, step: 1 }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={addFieldDisabled}>
          Add Field
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddSchemaFieldDialog;
