import React from "react";
import { Box, Typography, Popover } from "@mui/material";
import { HotkeySection, HotkeyInfoProps } from "../../types";


const hotkeySections: HotkeySection[] = [
  {
    label: "Navigation",
    hotkeys: [
      { key: "Tab / ↓", action: "Next field" },
      { key: "Shift + Tab / ↑", action: "Previous field" },
      { key: "Ctrl + →", action: "Next record" },
      { key: "Ctrl + ←", action: "Previous record" },
      { key: "Ctrl + Shift + →", action: "Mark reviewed & next" },
    ],
  },
  {
    label: "Editing",
    hotkeys: [
      { key: "Enter", action: "Edit/save field" },
      { key: "Escape", action: "Deselect field" },
    ],
  },
];

const styles = {
  keycap: {
    fontWeight: 600,
    background: "rgba(255,255,255,0.6)",
    padding: "4px 8px",
    borderRadius: 1,
    border: "1px solid rgba(0,0,0,0.12)",
    fontFamily: "ui-monospace, monospace",
    whiteSpace: "nowrap",
  },
  keyaction: {
    opacity: 0.9,
    textAlign: "right",
  },
  popoverPaper: {
    backgroundColor: "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(8px)",
    padding: 2.5,
    borderRadius: 2,
    minWidth: 380,
    border: "1px solid rgba(0,0,0,0.08)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  }
};

const HotkeyInfo = ({ anchorEl, onClose }: HotkeyInfoProps) => {
  const open = Boolean(anchorEl);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: styles.popoverPaper,
        },
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
        Keyboard Shortcuts
      </Typography>

      {hotkeySections.map((section, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              textTransform: "uppercase",
              opacity: 0.7,
              mb: 1,
              letterSpacing: 0.5,
            }}
          >
            {section.label}
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {section.hotkeys.map((hotkey, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  padding: "6px 0",
                  borderBottom:
                    i < section.hotkeys.length - 1
                      ? "1px solid rgba(0,0,0,0.06)"
                      : "none",
                }}
              >
                <Typography
                  variant="body2"
                  sx={styles.keycap}
                >
                  {hotkey.key}
                </Typography>

                <Typography
                  variant="body2"
                  sx={styles.keyaction}
                >
                  {hotkey.action}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Popover>
  );
};

export default HotkeyInfo;
