import { Box, Typography, Skeleton } from "@mui/material";

export default function TableLoading() {

return (
  <Box
      style={{
        width: "90%",
        margin: "0 auto",
        textAlign: "center",
      }}
      id="table-loading"
    >
        <Typography variant='h1'>
            <Skeleton />
        </Typography>
        <Typography variant='h3'>
            <Skeleton height={100}/>
        </Typography>
        <Typography variant='h3'>
            <Skeleton height={100}/>
        </Typography>
        <Typography variant='h3'>
            <Skeleton height={100}/>
        </Typography>
    </Box>
    );
}