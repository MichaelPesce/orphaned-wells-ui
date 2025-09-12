import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'
import { Box, Typography } from "@mui/material";

export default function TableLoading() {

return (
  <Box
      style={{
        height: "120px",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        backgroundColor: "white",
      }}
      id="empty-table"
    >
      <Box
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <SkeletonTheme baseColor="#202020" highlightColor="#444">
            <p>
            <Skeleton count={3.5} />
            </p>
        </SkeletonTheme>
      </Box>
    </Box>
);
}