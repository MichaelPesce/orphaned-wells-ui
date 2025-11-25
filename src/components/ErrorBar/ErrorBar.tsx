import { useState, useEffect } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { ErrorBarProps } from "../../types";

const ErrorBar = ({errorMessage, setErrorMessage, margin, duration}: ErrorBarProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (errorMessage === null || errorMessage === "") setOpen(false);
    else {
      setOpen(true);
      setTimeout(() => {
        setErrorMessage(null);
      }, duration || 30000);
    }
  }, [errorMessage]);

  const handleErrorClose = () => {
    setErrorMessage(null);
    setOpen(false);
  };
  return ( 
    <Snackbar open={open} onClose={handleErrorClose} style={margin ? {marginBottom:"50px"} : undefined}>
      <Alert onClose={handleErrorClose} severity={"error"}>
        {errorMessage}
      </Alert>
    </Snackbar>
  );
};

export default ErrorBar;