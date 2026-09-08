import { ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export interface PackageVersionInfo {
  name: string;
  version?: string;
  commit?: string;
  source_url?: string;
  requested_revision?: string;
}

export interface OgrreVersionInfo {
  packages?: PackageVersionInfo[];
  deployment?: {
    image?: string;
    deploy_run_id?: string;
    deployed_at?: string;
  };
}

interface OgrreVersionDialogProps {
  open: boolean;
  versionInfo: OgrreVersionInfo | null;
  loading: boolean;
  error: string;
  onClose: () => void;
}

const formatPackageName = (packageName: string) => {
  if (packageName === "ogrre_data_cleaning") return "ogrre_data_cleaning";
  if (packageName === "ogrre_embed" || packageName === "ogrre-embed") return "ogrre-embed";
  if (packageName === "orphaned-wells-ui-server") return "orphaned-wells-ui-server";
  return packageName;
};

const hasDeploymentInfo = (deployment?: OgrreVersionInfo["deployment"]) => {
  return Boolean(deployment?.image || deployment?.deploy_run_id || deployment?.deployed_at);
};

const VersionMetadataLine = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null;
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
      <Typography sx={{ color: "#6B7280", fontSize: "13px", minWidth: "92px" }}>
        {label}
      </Typography>
      <Box
        component="span"
        sx={{
          color: "#111827",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
          fontSize: "12px",
          lineHeight: 1.6,
          overflowWrap: "anywhere",
        }}
      >
        {value}
      </Box>
    </Stack>
  );
};

const VersionInfoCard = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Box
    sx={{
      border: "1px solid #E5E7EB",
      borderRadius: "8px",
      backgroundColor: "#FFFFFF",
      p: 1.5,
    }}
  >
    <Typography sx={{ fontWeight: 700, color: "#111827", mb: 1 }}>
      {title}
    </Typography>
    <Stack spacing={0.75}>{children}</Stack>
  </Box>
);

const OgrreVersionDialog = ({
  open,
  versionInfo,
  loading,
  error,
  onClose,
}: OgrreVersionDialogProps) => {
  const showVersionInfo =
    Boolean(versionInfo?.packages?.length) || hasDeploymentInfo(versionInfo?.deployment);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "12px",
          border: "1px solid #E5E7EB",
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: "1px solid #EEF2F7",
          pr: 6,
        }}
      >
        <Typography component="div" variant="h6" sx={{ fontWeight: 700 }}>
          OGRRE Version
        </Typography>
        <Typography component="div" sx={{ color: "#6B7280", fontSize: "13px", mt: 0.5 }}>
          Backend package and dependency metadata currently reported by the server.
        </Typography>
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{ position: "absolute", right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers sx={{ p: 2.5 }}>
        {loading ? (
          <Stack direction="row" spacing={1.5} alignItems="center">
            <CircularProgress size={22} />
            <Typography sx={{ color: "#4B5563", fontSize: "14px" }}>
              Loading version information...
            </Typography>
          </Stack>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : showVersionInfo ? (
          <Stack spacing={1.5}>
            {hasDeploymentInfo(versionInfo?.deployment) && (
              <VersionInfoCard title="Backend Deployment">
                <VersionMetadataLine label="Image" value={versionInfo?.deployment?.image} />
                <VersionMetadataLine label="Run" value={versionInfo?.deployment?.deploy_run_id} />
                <VersionMetadataLine label="Deployed" value={versionInfo?.deployment?.deployed_at} />
              </VersionInfoCard>
            )}
            {versionInfo?.packages?.map((packageInfo) => (
              <VersionInfoCard
                key={packageInfo.name}
                title={formatPackageName(packageInfo.name)}
              >
                <VersionMetadataLine label="Version" value={packageInfo.version || "Unknown"} />
                <VersionMetadataLine label="Commit" value={packageInfo.commit} />
                <VersionMetadataLine
                  label="Requested"
                  value={packageInfo.requested_revision !== packageInfo.commit ? packageInfo.requested_revision : undefined}
                />
                <VersionMetadataLine label="Source" value={packageInfo.source_url} />
              </VersionInfoCard>
            ))}
          </Stack>
        ) : (
          <Typography sx={{ color: "#4B5563", fontSize: "14px" }}>
            No version information was returned.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default OgrreVersionDialog;
