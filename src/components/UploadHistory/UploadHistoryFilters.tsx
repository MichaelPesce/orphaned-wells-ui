import { useState } from "react";
import { Button, MenuItem, Stack, TextField } from "@mui/material";
import { FilterOption } from "../../types";

const UploadHistoryFilters = ({onApply}: {onApply: (filters: FilterOption[]) => void}) => {
  const [filters, setFilters] = useState<FilterOption[]>([]);
  const value = (key: string, operator?: string) => {
    const filter = filters.find((item) => item.key === key && (!operator || item.operator === operator));
    return filter?.value || filter?.selectedOptions?.[0] || "";
  };
  const update = (key: string, label: string, next: string, type: string, operator = "equals") => {
    const filtered = filters.filter((item) => item.key !== key || item.operator !== operator);
    setFilters(next ? [...filtered, {key, displayName: label, type, operator, value: next,
      ...(type === "checkbox" ? {options: [{name: next, value: next, checked: true}], selectedOptions: [next]} : {})}] : filtered);
  };
  return <Stack component="form" direction="row" flexWrap="wrap" gap={1} alignItems="center" onSubmit={(event) => {event.preventDefault(); onApply(filters);}} sx={{my: 2}}>
    <TextField select label="Status" size="small" value={value("status")} onChange={(event) => update("status", "Status", event.target.value, "checkbox")} sx={{minWidth: 170}}>
      <MenuItem value="">All finished jobs</MenuItem><MenuItem value="completed">Complete</MenuItem><MenuItem value="completed_with_errors">Completed with errors</MenuItem><MenuItem value="error">Failed</MenuItem>
    </TextField>
    <TextField select label="Source" size="small" value={value("source_type")} onChange={(event) => update("source_type", "Source", event.target.value, "checkbox")} sx={{minWidth: 140}}>
      <MenuItem value="">All sources</MenuItem><MenuItem value="directory">Local directory</MenuItem><MenuItem value="gcs">GCS batch</MenuItem>
    </TextField>
    <TextField label="Uploader contains" size="small" value={value("request_user.email")} onChange={(event) => update("request_user.email", "Uploader", event.target.value, "string", "contains")} />
    <TextField label="After" type="date" size="small" InputLabelProps={{shrink: true}} value={value("created_at", "after")} onChange={(event) => update("created_at", "Submitted", event.target.value, "date", "after")} />
    <TextField label="Before" type="date" size="small" InputLabelProps={{shrink: true}} value={value("created_at", "before")} onChange={(event) => update("created_at", "Submitted", event.target.value, "date", "before")} />
    <Button type="submit">Apply filters</Button><Button onClick={() => {setFilters([]); onApply([]);}}>Reset</Button>
  </Stack>;
};
export default UploadHistoryFilters;
