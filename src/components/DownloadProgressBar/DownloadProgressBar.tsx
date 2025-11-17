import React, { useState } from 'react';
import { useDownload } from '../../context/DownloadContext';
import { Box, LinearProgress, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function DownloadProgressBar() {
  const { isDownloading, progress, downloadedBytes, estimatedTotalBytes } = useDownload();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isDownloading) return null;

  const formatMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

  const toggleMinimize = () => setIsMinimized(!isMinimized);

  return (
    <Paper
      elevation={6}
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: isMinimized ? 200 : 300,
        padding: isMinimized ? 1 : 2,
        borderRadius: 2,
        backgroundColor: '#fff',
        boxShadow: '0px 3px 10px rgba(0,0,0,0.2)',
        zIndex: 9999,
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}
    >
      <Box 
        sx={{ 
          width: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between'
        }}
      >
        {!isMinimized && (
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Preparing Download
          </Typography>
        )}
        <Tooltip title={isMinimized ? "Maximize" : "Minimize"}>
          <IconButton size="small" onClick={toggleMinimize}>
            <ExpandMoreIcon
              sx={{
                transform: isMinimized ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}
            />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ width: '100%', mt: isMinimized ? 0.5 : 1 }}>
        <LinearProgress
          variant={estimatedTotalBytes ? "determinate" : "indeterminate"}
          value={progress || 0}
          sx={{
            height: isMinimized ? 6 : 10,
            borderRadius: 5,
            mb: isMinimized ? 0 : 1,
            transition: 'all 0.3s ease'
          }}
        />

        {!isMinimized ? (
          estimatedTotalBytes ? (
            <Typography variant="body2" color="textSecondary">
              {formatMB(downloadedBytes)} MB / {formatMB(estimatedTotalBytes)} MB ({progress?.toFixed(1)}%)
            </Typography>
          ) : (
            <Typography variant="body2" color="textSecondary">
              {formatMB(downloadedBytes)} MB downloaded
            </Typography>
          )
        ) : (
          <Typography 
            variant="caption" 
            sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}
          >
            {estimatedTotalBytes 
              ? `${progress?.toFixed(0)}%`
              : `${formatMB(downloadedBytes)} MB`
            }
          </Typography>
        )}
      </Box>
    </Paper>
  );
}