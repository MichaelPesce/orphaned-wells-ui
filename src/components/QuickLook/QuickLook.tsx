import React from "react";
import { Backdrop, Fade, Modal, Box } from "@mui/material";

interface QuickLookProps {
  open: boolean;
  imageUrl: string;
  onClose: () => void;
}

const QuickLook: React.FC<QuickLookProps> = ({ open, imageUrl, onClose }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 300 } }}
    >
      <Fade in={open}>
        <Box
          onClick={onClose}
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            outline: "none",
            p: 2,
          }}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              borderRadius: 2,
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              backdropFilter: "blur(8px)",
              background: "rgba(255,255,255,0.05)",
              display: "flex",
            }}
          >
            <img
              src={imageUrl}
              alt="preview"
              style={{
                maxWidth: "50vw",
                maxHeight: "75vh",
                objectFit: "contain",
                display: "block",
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

export default QuickLook;
