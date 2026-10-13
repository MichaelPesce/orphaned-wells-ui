
import { createTheme } from "@mui/material/styles";

export const ogrre_theme = createTheme({
  palette: {
    primary: {
      main: "#000",
      contrastText: "#fff" //button text white instead of black
    },
    secondary: {
      main: "#54E385",
      contrastText: "#262F32",
    }
  },
  typography: {
    button: {
      fontWeight: 500, // Default font weight for all buttons
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { // Common styles for all buttons
          // textTransform: "none", // Prevent uppercase text
          // we'll want to be more precise with our casing before making this ^ change, though it would allow for more control

          // --- Future Migration: Modern Button Theme ---
          // Proposal explored during the Schema Import redesign (matches updated mockups):
          // borderRadius: "8px",
          // textTransform: "none",
          // fontWeight: 600,
          // fontSize: "0.875rem",
          // boxShadow: "none",
          // "&:hover": {
          //   boxShadow: "none",
          // },
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: "#333", // Slightly lighter black for hover
          },
          // --- Future Migration: Modern Primary Contained Button ---
          // backgroundColor: "#18181b", // zinc-900 neutral dark
          // color: "#fff",
          // "&:hover": {
          //   backgroundColor: "#27272a",
          // },
          // "&.Mui-disabled": {
          //   backgroundColor: "#f4f4f5",
          //   color: "#a1a1aa",
          // },
        },
        // --- Future Migration: Modern Outlined Button (e.g. secondary/cancel actions) ---
        // outlined: {
        //   borderColor: "#e4e4e7",
        //   color: "#18181b",
        //   "&:hover": {
        //     borderColor: "#d4d4d8",
        //     backgroundColor: "#f4f4f5",
        //   },
        // },
        containedSecondary: {
          "&:hover": {
            backgroundColor: "#45D074", // Darker green for hover
          },
        },
        outlinedSecondary: {
          color: "#45D074",
          "&:hover": {
            borderColor: "#3EBB68",
            color: "3EBB68",
          },
        },
      },
    },
  },
});