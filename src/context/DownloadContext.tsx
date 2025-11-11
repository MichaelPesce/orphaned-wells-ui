// DownloadContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface DownloadContextType {
  downloadedBytes: number;
  estimatedTotalBytes?: number;
  progress: number | null;
  isDownloading: boolean;
  downloadWithProgress: (
    apiFunc: (...args: any[]) => Promise<Response>, 
    apiParams: any[],
    filename?: string,
    totalBytes?: number
  ) => Promise<void>;
}

// To ensure we never crash
const defaultValue: DownloadContextType = {
  downloadedBytes: 0,
  estimatedTotalBytes: undefined,
  progress: null,
  isDownloading: false,
  downloadWithProgress: async () => {
    console.warn("downloadWithProgress called without provider");
  },
};

const DownloadContext = createContext<DownloadContextType>(defaultValue);

export const DownloadProvider = ({ children }: { children: React.ReactNode }) => {
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const [estimatedTotalBytes, setEstimatedTotalBytes] = useState<number>();
  const [progress, setProgress] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadWithProgress = useCallback(
    async (
      apiFunc: (...args: any[]) => Promise<Response>,
      apiParams: any[],
      filename: string = "export.zip",
      totalBytes?: number
    ) => {
      try {
        setIsDownloading(true);
        setDownloadedBytes(0);
        setProgress(null);
        setEstimatedTotalBytes(totalBytes);

        const response = await apiFunc(...apiParams);

        if (!response.ok) {
          throw new Error(`Download failed with status ${response.status}`);
        }

        const reader = response.body!.getReader();
        const chunks: any[] = [];

        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          received += value.length;
          if (totalBytes && received > totalBytes) setDownloadedBytes(totalBytes)
          else setDownloadedBytes(received);

          if (totalBytes) {
            const pct = (received / totalBytes) * 100;
            if (pct > 100) setProgress(100);
            else setProgress(pct);
          }
        }

        // Create a blob and trigger browser download
        const blob = new Blob(chunks);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

      } catch (err) {
        console.error("Download error:", err);
      } finally {
        setIsDownloading(false);
      }
    },
    []
  );

  return (
    <DownloadContext.Provider
      value={{
        downloadedBytes,
        estimatedTotalBytes,
        progress,
        isDownloading,
        downloadWithProgress
      }}
    >
      {children}
    </DownloadContext.Provider>
  );
};

export const useDownload = () => {
  const ctx = useContext(DownloadContext);
  if (!ctx) {
    throw new Error("useDownload must be used within a DownloadProvider");
  }
  return ctx;
};