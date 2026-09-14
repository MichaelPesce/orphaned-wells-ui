import { useState } from "react";
import { Box, Button, MenuItem, Stack, TextField } from "@mui/material";
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
  return <Box component="form" aria-label="Filter finished uploads" onSubmit={(event) => {event.preventDefault(); onApply(filters);}} sx={{px: 2, pb: 1.5}}>
    <Box sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "1.2fr 1fr 1.4fr 1fr 1fr"}, gap: 1.5}}>
      <TextField select label="Status" size="small" value={value("status")} onChange={(event) => update("status", "Status", event.target.value, "checkbox")}>
        <MenuItem value="">All finished jobs</MenuItem><MenuItem value="completed">Complete</MenuItem><MenuItem value="completed_with_errors">Completed with errors</MenuItem><MenuItem value="error">Failed</MenuItem>
      </TextField>
      <TextField select label="Source" size="small" value={value("source_type")} onChange={(event) => update("source_type", "Source", event.target.value, "checkbox")}>
        <MenuItem value="">All sources</MenuItem><MenuItem value="directory">Local directory</MenuItem><MenuItem value="gcs">GCS batch</MenuItem>
      </TextField>
      <TextField label="Uploader" placeholder="Email contains…" size="small" value={value("request_user.email")} onChange={(event) => update("request_user.email", "Uploader", event.target.value, "string", "contains")} />
      <TextField label="After" type="date" size="small" InputLabelProps={{shrink: true}} value={value("created_at", "after")} onChange={(event) => update("created_at", "Submitted", event.target.value, "date", "after")} />
      <TextField label="Before" type="date" size="small" InputLabelProps={{shrink: true}} value={value("created_at", "before")} onChange={(event) => update("created_at", "Submitted", event.target.value, "date", "before")} />
    </Box>
    <Stack direction="row" justifyContent="flex-end" gap={1} sx={{mt: 1, "& .MuiButton-root": {textTransform: "none"}}}>
      <Button size="small" onClick={() => {setFilters([]); onApply([]);}}>Reset</Button>
      <Button size="small" variant="outlined" type="submit">Apply filters</Button>
    </Stack>
  </Box>;
};
export default UploadHistoryFilters;
