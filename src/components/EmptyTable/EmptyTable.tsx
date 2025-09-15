import React from "react";
import { Box, Typography } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';


interface EmptyTableProps {
    title?: string;
    message?: string;
}

export default function EmptyTable(props: EmptyTableProps) {
    const defaultTitle = "No records found."
    const defaultMessage = "Please create a new record or contact a team lead to get started."
    const { title = defaultTitle, message = defaultMessage } = props;

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        paddingTop: 2,
      }}
      id="empty-table"
    >
      <SearchIcon
        style={{
          width: 100,
          height: 100,
          color: "#C9C9C9",
        }}
      />
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <Typography
          style={{
            fontSize: 44,
            color: "#929292",
            fontWeight: "bold",
          }}
        >
          {title}
        </Typography>

        <Typography style={{ fontSize: 16, marginTop: -5 }}>
          {message}
        </Typography>
      </Box>
    </Box>
  );
}