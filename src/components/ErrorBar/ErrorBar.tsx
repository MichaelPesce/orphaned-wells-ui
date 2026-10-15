import { useState, useEffect, ReactNode } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { ErrorBarProps } from "../../types";

const formatErrorContent = (error: unknown): ReactNode => {
  if (error === null || error === undefined) return null;
  if (typeof error === "string" || typeof error === "number" || typeof error === "boolean") {
    return String(error);
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    if (typeof errObj.detail === "string") return errObj.detail;
    if (typeof errObj.message === "string") return errObj.message;
    try {
      return JSON.stringify(error);
    } catch {
      return "An error occurred";
    }
  }
  return String(error);
};

const ErrorBar = ({errorMessage, setErrorMessage, margin, duration}: ErrorBarProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (errorMessage === null || errorMessage === "" || errorMessage === undefined) {
      setOpen(false);
      return;
    }
    setOpen(true);
    const timer = setTimeout(() => {
      setErrorMessage(null);
    }, duration || 30000);
    return () => clearTimeout(timer);
  }, [errorMessage, duration, setErrorMessage]);

  const handleErrorClose = () => {
    setErrorMessage(null);
    setOpen(false);
  };
  return ( 
    <Snackbar open={open} onClose={handleErrorClose} style={margin ? {marginBottom:"50px"} : undefined}>
      <Alert onClose={handleErrorClose} severity={"error"}>
        {formatErrorContent(errorMessage)}
      </Alert>
    </Snackbar>
  );
};

export default ErrorBar;