import { callAPI } from "../../util";

export const requestUploadApi = <T,>(api: (...args: any[]) => Promise<Response>, args: any[]): Promise<T> =>
  new Promise((resolve, reject) => {
    callAPI(api, args, resolve, (error, status) => {
      if (status === 208) { resolve(error as T); return; }
      const message = typeof error === "string" ? error : error?.detail || error?.message;
      reject(new Error(typeof message === "string" ? message : "The upload request failed. Please try again."));
    }, true, false);
  });

export const filePath = (file: File) => file.webkitRelativePath || file.name;
