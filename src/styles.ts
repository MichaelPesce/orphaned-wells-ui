export const ERROR_TEXT_COLOR = '#B33E3b'

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
    color: 'grey',
    fontSize: '12px',
    fontStyle: 'italic'
  },
  errorParagraph: {
    margin: 8,
  },
  errorText: {
    color: ERROR_TEXT_COLOR,
    fontSize: '14px',
    fontWeight: 'bold'
  },
  errorSpan: {
    backgroundColor: '#FECDD3',
    borderRadius: 4,
    border: '2px solid '+ERROR_TEXT_COLOR
  },
  noErrorParagraph: {
    margin:0
  },
  infoIcon: {
    fontSize: '12px',
    padding: '2px',
  },
  errorInfoIcon: {
    fontSize: '12px',
    padding: '2px',
    color: ERROR_TEXT_COLOR
  },
  errorTextField: {
    '& .MuiOutlinedInput-root': {
        // Default border
        '& fieldset': {
            border: '0px'
        },
        // On hover
        '&:hover fieldset': {
            borderWidth: '1.5px',
            borderColor: 'black'
        },
        // On focus
        '&.Mui-focused fieldset': {
            borderWidth: '2px',
            borderColor: 'black'
        },
    },
  },
}

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
        overflow: 'visible',
        filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
        mt: 1.5,
        '& .MuiAvatar-root': {
          width: 32,
          height: 32,
          ml: -0.5,
          mr: 1,
        },
        '&::before': {
          content: '""',
          display: 'block',
          position: 'absolute',
          top: 0,
          right: 14,
          width: 10,
          height: 10,
          bgcolor: 'background.paper',
          transform: 'translateY(-50%) rotate(45deg)',
          zIndex: 0,
        },
      },
    },
  }
}

export const BottomBarStyles = {
  button: {
    marginX: 1,
  },
  paper: {
    position: 'fixed',
    bottom: 0, 
    left: '0px',
    right: 0,
    height: '60px',
    zIndex: 2,
  }
};

export const SubheaderStyles = {
  iconButton: {
    top: -5,
    color: "black",
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
}

export const TableFiltersStyles = {
  tableFilter: {
      paddingBottom: 2,
  },
  box: {
      width: '50vw',
      display: 'flex',
      justifyContent: 'space-between',
      paddingTop: 5
  },
  closeIcon: {
      position: 'absolute',
      right: 0,
      top: 8,
      mb: 2,
  }
}

export const LoginPageStyles = {
  outerBox: {
    backgroundColor: "#F5F5F6",
    height: "100vh"
  },
  innerBox: {
      paddingY: 5,
      paddingX: 5,
  },
  modalBox: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 400,
      backgroundColor: "#FAFAFA",
      boxShadow: 24,
      px: 4,
      py: 8,
      borderRadius: 4,
      "&:focus": {
          outline: "none"
      },
  },
  modalTitle: {
      display: "flex",
      justifyContent: "center",
      fontWeight: "bold"
  },
  modalBody: {
      display: "flex",
      justifyContent: "center",
      mt: 4
  },
  button: {
      backgroundColor: "#4285F4",
  },
  unauthorized: {
      pt: 5,
      color: "red"
  }
}

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
      display: 'flex',
      justifyContent: 'flex-start',
      marginleft: '20px',
    },
    right: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginRight: '10px',
    },
    both: {
      display: 'flex',
      justifyContent: 'space-between',
      paddingX: 4,
    }
      
  },
  outerBox: {
      paddingBottom: "65px"
  },
  errorAlert: {
    backgroundColor: '#FFECED',
    marginBottom: '16px'
  },
  zoomToggleActive: {
    color: 'black',
    backgroundColor: '#EBEBEB'
  }
}