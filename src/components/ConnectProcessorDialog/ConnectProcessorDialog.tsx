import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  connectRecordGroupProcessor,
  getProcessors,
} from "../../services/app.service";
import { callAPI, convertToMongoProcessor } from "../../util";
import { MongoProcessor, MongoProcessor as Processor, RecordGroup } from "../../types";

interface ConnectProcessorDialogProps {
  open: boolean;
  recordGroup: RecordGroup;
  onClose: () => void;
  onConnected: (recordGroup: RecordGroup) => void;
  setErrorMsg: (message: string) => void;
}

const ConnectProcessorDialog = ({
  open,
  recordGroup,
  onClose,
  onConnected,
  setErrorMsg,
}: ConnectProcessorDialogProps) => {
  const [processors, setProcessors] = useState<Processor[]>([]);
  const [selectedProcessor, setSelectedProcessor] = useState<Processor>({} as Processor);
  const [submitting, setSubmitting] = useState(false);
  const defaultProcessorPath = `${process.env.PUBLIC_URL}/img/Default Extractor.png`;

  const handleSuccessGetProcessors = useCallback((
    processorData: { processor_list: Processor[] | MongoProcessor[] }
  ) => {
    const nextProcessors = processorData?.processor_list.map((processor) =>
      convertToMongoProcessor(processor)
    ) || [];
    setProcessors(nextProcessors);
    const currentProcessor = nextProcessors.find(
      (processor) => processor.processorId === recordGroup.processorId
    );
    if (currentProcessor) setSelectedProcessor(currentProcessor);
  }, [recordGroup.processorId]);

  useEffect(() => {
    if (!open) {
      setSelectedProcessor({} as Processor);
      setSubmitting(false);
      return;
    }
    callAPI(
      getProcessors,
      [],
      handleSuccessGetProcessors,
      (e: Error) => setErrorMsg(String(e))
    );
  }, [open, handleSuccessGetProcessors, setErrorMsg]);

  const styles = {
    processorGridItem: {
      paddingX: 1,
      paddingBottom: 4
    },
    processorTextBox: {
      display: "flex",
      justifyContent: "center",
    },
    processorImageBox: {
      display: "flex",
      justifyContent: "center",
      cursor: "pointer",
    },
    processorImage: {
      maxHeight: "18vh"
    }
  };

  const handleSelectProcessor = (processorData: Processor) => {
    if (selectedProcessor.processorId === processorData.processorId) {
      setSelectedProcessor({} as Processor);
      return;
    }
    setSelectedProcessor(processorData);
  };

  const getImageStyle = (processorId: string): React.CSSProperties => {
    const styling: React.CSSProperties = { ...styles.processorImage };
    if (selectedProcessor.processorId === processorId) {
      styling.border = "1px solid #2196F3";
    }
    return styling;
  };

  const handleConnectProcessor = () => {
    if (!recordGroup._id || !selectedProcessor.processorId) return;
    setSubmitting(true);
    callAPI(
      connectRecordGroupProcessor,
      [recordGroup._id, { processorId: selectedProcessor.processorId }],
      (updatedRecordGroup) => {
        setSubmitting(false);
        onConnected(updatedRecordGroup);
      },
      (error) => {
        setSubmitting(false);
        setErrorMsg(String(error));
      }
    );
  };

  return (
    <Dialog
      data-cy="connect-processor-dialog"
      open={open}
      onClose={submitting ? undefined : onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Connect Processor
        <IconButton
          aria-label="close"
          onClick={onClose}
          disabled={submitting}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Grid container>
          {processors.map((processorData, idx) => {
            if (processorData.processorId && processorData.modelId)
              return (
                <Grid key={processorData.processorId} item xs={4} sx={styles.processorGridItem}>
                  <p style={styles.processorTextBox}>
                    {idx + 1}. {processorData.name}
                  </p>
                  <Box
                    data-cy="connect-processor-option"
                    data-processor-name={processorData.name}
                    sx={styles.processorImageBox}
                    onClick={() => handleSelectProcessor(processorData)}
                  >
                    <Tooltip title={processorData.documentType}>
                      <img
                        alt={processorData.name}
                        src={`${process.env.PUBLIC_URL}/img/${processorData.name}.png`}
                        style={getImageStyle(processorData.processorId || "")}
                        onError={(event) => {
                          const target = event.target as HTMLImageElement;
                          target.src = defaultProcessorPath;
                        }}
                      />
                    </Tooltip>
                  </Box>
                </Grid>
              );
            return null;
          })}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          data-cy="connect-processor-submit"
          variant="contained"
          onClick={handleConnectProcessor}
          disabled={submitting || !selectedProcessor.processorId}
        >
          {submitting ? "Connecting..." : "Connect Processor"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectProcessorDialog;
