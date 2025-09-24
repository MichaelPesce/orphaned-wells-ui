import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from "@mui/material";
import { SchemaTableProps } from "../../types";

const fontFamily =
  `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`;

const AirtableGrid = ({ records }: SchemaTableProps) => {
  if (!records || records.length === 0) {
    return (
      <Paper
        sx={{
          padding: 2,
          textAlign: "center",
          color: "#888",
          fontSize: 14,
          fontFamily,
        }}
      >
        No records found
      </Paper>
    );
  }

  const fieldNames = Array.from(
    new Set(records.flatMap((record) => Object.keys(record.fields)))
  );

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        border: "1px solid #e0e0e0",
        overflowX: "auto",
        backgroundColor: "#fff",
      }}
    >
      <Table sx={{ tableLayout: "fixed", minWidth: 650 }}>
        <TableHead>
          <TableRow>
            {fieldNames.map((field) => (
              <TableCell
                key={field}
                sx={{
                  backgroundColor: "#eceff1",
                  fontWeight: 600,
                  color: "#333",
                  borderBottom: "1px solid #dcdcdc",
                  fontSize: 13,
                  fontFamily,
                  padding: "10px 12px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {field}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((record, rowIndex) => (
            <TableRow
              key={record.id}
              sx={{
                backgroundColor: rowIndex % 2 === 0 ? "#fafafa" : "#ffffff",
                "&:hover": {
                  backgroundColor: "#f0f0f0",
                },
              }}
            >
              {fieldNames.map((field) => (
                <TableCell
                  key={field}
                  tabIndex={0}
                  sx={{
                    fontSize: 14,
                    fontFamily,
                    padding: "8px 12px",
                    borderBottom: "1px solid #eaeaea",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    cursor: "default",
                    "&:focus": {
                      outline: "2px solid #4c9aff",
                      outlineOffset: "-2px",
                      backgroundColor: "#f0f8ff",
                    },
                  }}
                >
                  {record.fields[field] !== undefined
                    ? record.fields[field].toString()
                    : ""}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default AirtableGrid;