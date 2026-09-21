import { Button, Grid, Typography } from "@mui/material";
import { MongoProcessor } from "../../types";

export const schemaSelectionKey = (schema: MongoProcessor) => schema.schema_id || schema.processorId || schema.name;

interface SchemaOptionsProps {
  schemas: MongoProcessor[];
  selected: string;
  onSelect: (schema: MongoProcessor) => void;
  disabled?: boolean;
  databaseMode: boolean;
  selector: string;
}

export default function SchemaOptions({ schemas, selected, onSelect, disabled, databaseMode, selector }: SchemaOptionsProps) {
  if (!schemas.length) return <Typography>No {databaseMode ? "schemas" : "processors"} are available.</Typography>;
  return <Grid container spacing={2}>
    {schemas.map(schema => <Grid item xs={12} sm={6} md={4} key={schemaSelectionKey(schema)}>
      <Button fullWidth variant={selected === schemaSelectionKey(schema) ? "contained" : "outlined"}
        disabled={disabled} aria-pressed={selected === schemaSelectionKey(schema)}
        aria-label={schema.displayName || schema.name}
        data-cy={selector} data-processor-name={schema.name} onClick={() => onSelect(schema)}
        sx={{ height: "100%", display: "flex", flexDirection: "column", textTransform: "none", p: 2 }}>
        <img alt="" src={schema.img || `${process.env.PUBLIC_URL}/img/${schema.name}.png`}
          style={{ maxWidth: "100%", height: 120, objectFit: "contain", marginBottom: 8 }}
          onError={event => {
            const fallback = `${process.env.PUBLIC_URL}/img/Default Extractor.png`;
            if (!event.currentTarget.src.endsWith(encodeURI(fallback))) event.currentTarget.src = fallback;
          }} />
        <Typography>{schema.displayName || schema.name}</Typography>
        {schema.documentType && <Typography variant="caption">{schema.documentType}</Typography>}
        {databaseMode && !(schema.processorId && schema.modelId) && <Typography variant="caption">No processor attached</Typography>}
      </Button>
    </Grid>)}
  </Grid>;
}
