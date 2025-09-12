import React from "react";
import { Box, Typography } from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";

export default function EmptyTable() {

  const theBox = (
    <Box
      style={{
        height: "120px",
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
      id="empty-table"
    >
      <FilterListIcon
        style={{
          width: 120,
          height: 120,
          color: "#C8C8C8",
        }}
        viewBox="-5 -5 32.7 32.7"
      />
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <Typography
          display="block"
          style={{
            fontSize: 44,
            color: "#919191",
            fontWeight: "bold",
            marginLeft: -3,
            paddingTop: 12,
          }}
        >
          No records found.
        </Typography>

        <Typography display="block" style={{ fontSize: 16, marginTop: -6 }}>
          {`Please create a new record or contact a team lead to get started.`}
        </Typography>
      </Box>
    </Box>
  );

  return theBox;
}