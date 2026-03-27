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
} from "@mui/material";
import { MongoProcessor } from "../../types";
import { schemaProcessorColumns as columns } from "../../util";

interface SchemaSheetProps {
  processor?: MongoProcessor;
  cleaningFunctions?: string[];
  onCleaningFunctionChange: (
    processorName: string,
    fieldName: string,
    cleaningFunction: string
  ) => void;
}

const SchemaSheet = (props: SchemaSheetProps) => {
  const {
    processor,
    cleaningFunctions = [],
    onCleaningFunctionChange,
  } = props;
  const { attributes } = processor || { attributes: [] };

  const handleCleaningFunctionChange = (
    event: SelectChangeEvent<string>,
    fieldName: string
  ) => {
    if (!processor?.name) return;
    onCleaningFunctionChange(processor.name, fieldName, event.target.value);
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
                padding: "12px 16px",
              },
            }}
          >
            {columns.map((col) => (
              <TableCell key={`${col.key}_${idx}`}>
                {col.key === "cleaning_function" ? (
                  <FormControl size="small">
                    <Select
                      value={row[col.key] || ""}
                      displayEmpty
                      onChange={(event) =>
                        handleCleaningFunctionChange(event, row.name)
                      }
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
                ) : (
                  row[col.key]
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SchemaSheet;
