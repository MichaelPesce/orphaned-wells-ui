import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";

interface SchemaSheetProps {
  data: any;
  setTabValue : (v: number) => void;
}



const SchemaOverViewSheet = ({ data, setTabValue }: SchemaSheetProps) => {

const columns = [
  {
    key: "name",
    displayName: "Processor Name",
  },
  {
    key: "displayName",
    displayName: "Display Name",
  },
  {
    key: "processorId",
    displayName: "Processor ID",
  },
  {
    key: "modelId",
    displayName: "Model ID",
  },
  {
    key: "documentType",
    displayName: "Document Type",
  },
  {
    key: "img",
    displayName: "Image Link",
  },
]
  if (!data || data.length === 0) {
    return (
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>No data</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }

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
        {data.map((row: any, idx: number) => (
          <TableRow
            onClick={() => {
                const newTabValue = idx+1;
                setTabValue(newTabValue)
            }}
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
                <TableCell
                    key={col.key}
                >
                    {row[col.key]}
                </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default SchemaOverViewSheet;
