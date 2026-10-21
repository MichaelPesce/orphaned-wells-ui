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
    height: 24,
    fontSize: "0.75rem",
    fontWeight: 600,
    bgcolor: "#0B65C6",
  },
  menuUserSection: {
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    px: 2,
    py: 1.5,
    minWidth: 220,
  },
  menuUserAvatar: {
    width: 36,
    height: 36,
    fontSize: "0.95rem",
    fontWeight: 600,
    bgcolor: "#0B65C6",
    flexShrink: 0,
  },
  menuUserDetails: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  menuUserName: {
    fontWeight: 700,
    fontSize: "0.95rem",
    color: "#262626",
    lineHeight: 1.25,
    overflowWrap: "anywhere",
  },
  menuUserEmail: {
    fontSize: "0.8rem",
    color: "#595959",
    lineHeight: 1.3,
    overflowWrap: "anywhere",
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
    bgcolor: "background.paper",
    color: "text.primary",
    minHeight: "100vh",
    display: "flex",
    alignItems: { xs: "flex-start", sm: "center" },
    justifyContent: "center",
    px: 3,
    pt: { xs: 7, sm: 8 },
    pb: { xs: 4, sm: 8 },
    boxSizing: "border-box",
    textAlign: "left",
  },
  cardBox: {
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    textAlign: "left",
  },
  brandHeader: {
    display: "flex",
    alignItems: "center",
    gap: 1.75,
    pb: 2.5,
    borderBottom: 1,
    borderColor: "divider",
  },
  brandLogo: {
    width: 52,
    height: 52,
    display: "block",
  },
  brandName: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    letterSpacing: "0.16em",
    color: "text.primary",
  },
  headerSection: {
    pt: 4,
    display: "flex",
    flexDirection: "column",
  },
  title: {
    margin: 0,
    fontSize: { xs: "1.875rem", sm: "2.125rem" },
    lineHeight: 1.15,
    fontWeight: 700,
    letterSpacing: "-0.01em",
    color: "text.primary",
  },
  messageSlot: {
    mt: 1.25,
    minHeight: { xs: 96, sm: 72 },
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  subtitle: {
    margin: 0,
    fontSize: "1rem",
    lineHeight: 1.5,
    color: "text.secondary",
  },
  alertRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 1.25,
  },
  alertIcon: {
    fontSize: 18,
    color: "error.main",
    flexShrink: 0,
    mt: "3px",
  },
  alertText: {
    margin: 0,
    fontSize: "0.9375rem",
    lineHeight: 1.5,
    color: "error.dark",
    whiteSpace: "normal",
    overflowWrap: "anywhere",
  },
  alertLink: {
    color: "error.dark",
    fontWeight: 600,
    fontSize: "0.875rem",
  },
  buttonStack: {
    mt: 3,
    display: "flex",
    flexDirection: "column",
  },
  primaryButton: {
    height: { xs: 52, sm: 48 },
    px: 2.5,
    borderRadius: "6px",
    textTransform: "none",
    fontWeight: 500,
    fontSize: "1rem",
    color: "text.primary",
    bgcolor: "background.paper",
    border: 1,
    borderColor: "text.primary",
    boxShadow: "none",
    "&:hover": {
      bgcolor: "action.hover",
      borderColor: "text.primary",
      boxShadow: "none",
    },
    "&.Mui-disabled": {
      bgcolor: "action.disabledBackground",
      borderColor: "divider",
      color: "text.disabled",
    },
  },
  secondaryButton: {
    height: { xs: 52, sm: 48 },
    px: 2.5,
    borderRadius: "6px",
    textTransform: "none",
    fontWeight: 500,
    fontSize: "1rem",
    borderColor: "grey.400",
    color: "text.primary",
    bgcolor: "background.paper",
    boxShadow: "none",
    "&:hover": {
      borderColor: "text.primary",
      bgcolor: "action.hover",
      boxShadow: "none",
    },
    "&.Mui-disabled": {
      bgcolor: "action.disabledBackground",
      borderColor: "divider",
      color: "text.disabled",
    },
  },
  divider: {
    mt: 4.5,
    pb: 1.25,
    borderBottom: 1,
    borderColor: "divider",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "text.secondary",
  },
  cilogonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 1.5,
  },
  cilogonGroupWithDivider: {
    mt: 2.5,
    display: "flex",
    flexDirection: "column",
    gap: 1.5,
  },
  idpLabel: {
    mb: 1,
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "text.primary",
    display: "block",
  },
  idpSelect: {
    height: { xs: 52, sm: 48 },
    borderRadius: "6px",
    bgcolor: "background.paper",
    textAlign: "left",
    fontSize: "1rem",
    color: "text.primary",
    "& .MuiSelect-select": {
      display: "flex",
      alignItems: "center",
      py: 0,
      pl: 1.5,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "grey.500",
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "text.primary",
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "primary.main",
      borderWidth: "2px",
    },
  },
  idpOptionRow: {
    display: "flex",
    alignItems: "center",
    gap: 1.25,
    minWidth: 0,
    width: "100%",
  },
  idpLogoBox: {
    width: 24,
    height: 24,
    borderRadius: "3px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  idpLogoImg: {
    width: 24,
    height: 24,
    objectFit: "contain",
    display: "block",
  },
  idpLogoPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: "3px",
    bgcolor: "grey.100",
    border: 1,
    borderColor: "divider",
    color: "text.secondary",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  idpPlaceholderIcon: {
    fontSize: 15,
  },
  idpOptionLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
