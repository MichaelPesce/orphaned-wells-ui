import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { MongoProcessor } from "../../types";
import { schemaProcessorColumns as columns } from "../../util";

interface SchemaSheetProps {
  processor?: MongoProcessor;
}

const SchemaSheet = (props: SchemaSheetProps) => {
  const { processor } = props;
  const { attributes } = processor || { attributes: [] };
  // console.log(processor)
  

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
              <TableCell key={`${col.key}_${idx}`}>{row[col.key]}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SchemaSheet;
