
import { createTheme } from '@mui/material/styles';

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
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: "#333", // Slightly lighter black for hover
          },
        },
        containedSecondary: {
          "&:hover": {
            backgroundColor: "#45D074", // Darker green for hover
          },
        },
        outlinedSecondary: {
          color: '#45D074',
          "&:hover": {
            borderColor: "#3EBB68",
            color: "3EBB68",
          },
        },
      },
    },
  },
});