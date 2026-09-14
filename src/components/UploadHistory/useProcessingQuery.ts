import { useEffect, useRef, useState } from "react";
import { callAPI } from "../../util";

/** Refresh active work while visible; retain the last response during refresh. */
export const useProcessingQuery = <T,>(api: (...args: any[]) => Promise<Response>, args: any[], active: (data: T) => boolean) => {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify(args);
  const previousKey = useRef("");
  const activeRef = useRef(active);
  activeRef.current = active;
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout>;
    if (previousKey.current !== key) { setData(undefined); setLoading(true); setError(""); }
    previousKey.current = key;
    const schedule = () => { if (!cancelled && !document.hidden) timer = setTimeout(load, 5000); };
    const load = () => {
      if (inFlight || cancelled || document.hidden) return;
      clearTimeout(timer);
      inFlight = true;
      callAPI(api, JSON.parse(key), (result: T) => {
        inFlight = false;
        if (cancelled) return;
        setData(result); setLoading(false); setError("");
        if (activeRef.current(result)) schedule();
      }, (failure, status) => {
        inFlight = false;
        if (cancelled) return;
        const message = typeof failure === "string" ? failure : failure?.detail;
        setError(typeof message === "string" ? message : "Unable to load upload status. Please retry.");
        setLoading(false);
        if (status !== 401 && status !== 403 && status !== 404) schedule();
      });
    };
    const onVisibility = () => { clearTimeout(timer); if (!document.hidden) load(); };
    document.addEventListener("visibilitychange", onVisibility);
    load();
    return () => { cancelled = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, [api, key, revision]);
  return {data, loading, error, refresh: () => setRevision((value) => value + 1)};
};

