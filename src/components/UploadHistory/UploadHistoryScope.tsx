import { Autocomplete, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { ProcessingHistoryProject } from "../../types";

interface Props {
  projects: ProcessingHistoryProject[];
  projectId: string;
  recordGroupId: string;
  loading: boolean;
  onChange: (projectId: string, recordGroupId: string) => void;
}

const UploadHistoryScope = ({projects, projectId, recordGroupId, loading, onChange}: Props) => {
  const groups = projects.filter((project) => !projectId || project.id === projectId)
    .flatMap((project) => project.record_groups.map((group) => ({...group, projectName: project.name})));
  return <Paper variant="outlined" sx={{p: 2, borderRadius: 2}}>
    <Box sx={{display: "grid", gridTemplateColumns: {xs: "1fr", sm: "1fr 1fr"}, gap: 2}}>
      <Autocomplete
        options={projects} loading={loading} disabled={loading}
        value={projects.find((project) => project.id === projectId) || null}
        getOptionLabel={(project) => project.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, option) => <li {...props} key={option.id}>{option.name}</li>}
        onChange={(_, project) => onChange(project?.id || "", "")}
        renderInput={(params) => <TextField {...params} size="small" label="Project" InputLabelProps={{shrink: true}} placeholder={loading ? "Loading projects…" : "All projects"} />}
      />
      <Autocomplete
        options={groups} loading={loading} disabled={loading}
        value={groups.find((group) => group.id === recordGroupId) || null}
        getOptionLabel={(group) => group.name}
        groupBy={!projectId ? (group) => group.projectName : undefined}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderOption={(props, option) => <li {...props} key={option.id}>{option.name}</li>}
        onChange={(_, group) => onChange(projectId, group?.id || "")}
        renderInput={(params) => <TextField {...params} size="small" label="Record group" InputLabelProps={{shrink: true}} placeholder={loading ? "Loading record groups…" : "All record groups"} />}
      />
    </Box>
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1} sx={{mt: 1, minHeight: 30}}>
      <Typography variant="caption" color="text.secondary">
        {projectId || recordGroupId ? "Project and record group selections apply to active and finished uploads." : "Showing uploads across all projects you can access in your current team."}
      </Typography>
      {(projectId || recordGroupId) && <Button size="small" onClick={() => onChange("", "")} sx={{flexShrink: 0, textTransform: "none"}}>Clear selection</Button>}
    </Stack>
  </Paper>;
};

export default UploadHistoryScope;
