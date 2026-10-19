export const ERROR_TEXT_COLOR = "#B33E3b";

export const styles = {
  headerRow: {
    fontWeight: "bold"
  },
  tableRow: {
    cursor: "pointer",
    "&:hover": {
      background: "#efefef"
    },
  },
  topSection: {
    marginTop: 2, 
    marginRight: 2,
    paddingX: 3,
  },
  topSectionLeft: {
    display: "flex",
    justifyContent: "flex-start",
  },
  topSectionRight: {
    display: "flex",
    justifyContent: "flex-end",
  },
  headerCell: {
    fontWeight: "bold"
  },
  fieldsTable: {
    width: "100%",
    maxHeight: "70vh",
    backgroundColor: "white",
    paddingBottom: "10px",
  },
  tableHead: {
    backgroundColor: "#EDF2FA",
    fontWeight: "bold",
  }, 
  fieldKey: {
    cursor: "pointer",
  },
  subattributesTable: {
    backgroundColor: "#FAFAFA",
  },
  rowIconButton: {
    padding: 0.5,
    marginTop: -0.5
  },
  rowIcon: {
    fontSize: "16px"
  },
  flaggedConfidence: {
    padding: 0,
    margin: 0,
    color: "#9E0101",
  },
  unflaggedConfidence: {
    padding: 0,
    margin: 0,
  },
  ocrRawText: {
    color: "grey",
    fontSize: "12px",
    fontStyle: "italic"
  },
  errorParagraph: {
    margin: 8,
  },
  errorText: {
    color: ERROR_TEXT_COLOR,
    fontSize: "14px",
    fontWeight: "bold"
  },
  errorSpan: {
    backgroundColor: "#FECDD3",
    borderRadius: 4,
    border: "2px solid "+ERROR_TEXT_COLOR
  },
  noErrorParagraph: {
    margin:0
  },
  infoIcon: {
    fontSize: "12px",
    padding: "2px",
  },
  errorInfoIcon: {
    fontSize: "12px",
    padding: "2px",
    color: ERROR_TEXT_COLOR
  },
  errorTextField: {
    "& .MuiOutlinedInput-root": {
      // Default border
      "& fieldset": {
        border: "0px"
      },
      // On hover
      "&:hover fieldset": {
        borderWidth: "1.5px",
        borderColor: "black"
      },
      // On focus
      "&.Mui-focused fieldset": {
        borderWidth: "2px",
        borderColor: "black"
      },
    },
  },
};

export const HeaderStyles = {
  iconLeft: {
    top: 5,
    color: "black",
  },
  icon: {
    top: 5,
    color: "black",
    right: 5
  },
  issueButton: {
    top: 5,
    bottom: 5,
    right: 5,
  },
  avatar: {
    width: 24,
    height: 24
  },
  tabPanel: {
    marginLeft: 10,
  },
  logo: {
    marginTop: 2.5,
    marginLeft: "1em",
    width: "2.5em",
    height: "2.5em",
    borderRadius: "50%",
    display: "inline-block",
    verticalAlign: "middle",
    cursor: "pointer"
  },
  menuSlotProps: {
    paper: {
      elevation: 0,
      sx: {
        overflow: "visible",
        filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
        mt: 1.5,
        "& .MuiAvatar-root": {
          width: 32,
          height: 32,
          ml: -0.5,
          mr: 1,
        },
        "&::before": {
          content: "\"\"",
          display: "block",
          position: "absolute",
          top: 0,
          right: 14,
          width: 10,
          height: 10,
          bgcolor: "background.paper",
          transform: "translateY(-50%) rotate(45deg)",
          zIndex: 0,
        },
      },
    },
  }
};

export const BottomBarStyles = {
  button: {
    marginX: 1,
  },
  paper: {
    position: "fixed",
    bottom: 0, 
    left: "0px",
    right: 0,
    height: "60px",
    zIndex: 2,
  }
};

export const SubheaderStyles = {
  iconButton: {
    top: -5,
    color: "black",
    fontSize: "13px"
  },
  icon: {
    fontSize: "15px"
  },
  box: {
    paddingTop: 1,
    paddingBottom: 1,
    backgroundColor: "white",
    width: "100%",
    boxShadow: 1
  },
  gridContainer: {
    margin: 0,
    padding: 0,
  },
  directoryDisplay: {
    display: "flex",
    justifyContent: "flex-start",
    marginLeft: 40,
    overflow: "auto",
    width: "80vw"
  },
  pageName: {
    display: "flex",
    justifyContent: "flex-start",
    marginLeft: 50,
    fontSize: "25px"
  },
  newProjectColumn: {
    display: "flex",
    justifyContent: "flex-end",
    marginRight: 5,
    marginTop: 3
  },
  subtext: {
    marginTop: 2,
    display: "flex",
    justifyContent: "flex-start",
    marginLeft: 50,
    fontSize: "15px"
  }
};

export const TableFiltersStyles = {
  tableFilter: {
    paddingBottom: 2,
  },
  box: {
    width: "50vw",
    display: "flex",
    justifyContent: "space-between",
    paddingTop: 5
  },
  closeIcon: {
    position: "absolute",
    right: 0,
    top: 8,
    mb: 2,
  }
};

export const LoginPageStyles = {
  outerBox: {
    backgroundColor: "#F4F5F7",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    px: 2,
    py: 4,
    boxSizing: "border-box",
  },
  cardBox: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    border: "1px solid #E4E7EC",
    boxShadow: "0 12px 32px -8px rgba(16, 24, 40, 0.08), 0 4px 12px -2px rgba(16, 24, 40, 0.04)",
    px: { xs: 3, sm: 4.5 },
    py: { xs: 3.5, sm: 4.5 },
    borderRadius: 3,
    boxSizing: "border-box",
  },
  logoContainer: {
    display: "flex",
    justifyContent: "center",
    mb: 2,
  },
  title: {
    textAlign: "center",
    fontWeight: 700,
    color: "#111827",
    letterSpacing: "0.02em",
  },
  subtitle: {
    textAlign: "center",
    color: "#4B5563",
    mt: 0.75,
    mb: 3.5,
    lineHeight: 1.5,
  },
  buttonStack: {
    display: "flex",
    flexDirection: "column",
    gap: 1.5,
  },
  primaryButton: {
    py: 1.25,
    px: 2.5,
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.9375rem",
    boxShadow: "none",
    "&:hover": {
      boxShadow: "none",
    },
  },
  secondaryButton: {
    py: 1.25,
    px: 2.5,
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 600,
    fontSize: "0.9375rem",
    borderColor: "#D0D5DD",
    color: "#1F2937",
    backgroundColor: "#FFFFFF",
    "&:hover": {
      borderColor: "#98A2B3",
      backgroundColor: "#F9FAFB",
    },
  },
  providerHint: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: "0.775rem",
    lineHeight: 1.4,
    mt: -0.5,
  },
  divider: {
    my: 0.5,
    color: "#6B7280",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  alert: {
    mt: 2.5,
    borderRadius: 2,
    textAlign: "left",
    "& .MuiAlert-message": {
      whiteSpace: "normal",
      overflowWrap: "anywhere",
      lineHeight: 1.5,
    },
  },
};

export const DocumentContainerStyles = {
  imageBox: {
    height: "70vh",
    overflowX: "scroll",
  },
  image: {
    height: "50vh"
  },
  gridContainer: {
    backgroundColor: "white",
  },
  containerActions: {
    left: {
      display: "flex",
      justifyContent: "flex-start",
      marginleft: "20px",
    },
    right: {
      display: "flex",
      justifyContent: "flex-end",
      marginRight: "10px",
    },
    both: {
      display: "flex",
      justifyContent: "space-between",
      paddingX: 4,
    }
      
  },
  outerBox: {
    paddingBottom: "65px"
  },
  errorAlert: {
    backgroundColor: "#FFECED",
    marginBottom: "16px"
  },
  errorState: {
    border: "1px solid #F2B8B5",
    background: "linear-gradient(180deg, #FFF7F7 0%, #FFFFFF 100%)",
    borderRadius: "12px",
    padding: "24px",
    marginX: "16px",
    marginBottom: "16px",
    boxShadow: "0 6px 18px rgba(122, 28, 18, 0.08)",
  },
  errorStateTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#7A1C12",
  },
  errorStateOuterBox: {
    paddingBottom: "24px",
  },
  errorStateMessage: {
    marginTop: "16px",
    backgroundColor: "#FFF1F0",
    borderRadius: "8px",
    padding: "12px 14px",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
    fontSize: "13px",
    color: "#5C1A13",
    whiteSpace: "pre-wrap",
  },
  noImageState: {
    height: "100%",
    minHeight: "52vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    textAlign: "center",
    px: 4,
  },
  noImageIconBox: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    backgroundColor: "#EEF6FD",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  noImageTitle: {
    fontWeight: 600,
  },
  noImageText: {
    maxWidth: 420,
    lineHeight: 1.5,
  },
  zoomToggleActive: {
    color: "black",
    backgroundColor: "#EBEBEB"
  }
};
