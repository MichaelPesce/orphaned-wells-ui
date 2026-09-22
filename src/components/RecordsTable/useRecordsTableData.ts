import { useEffect, useRef, useState } from "react";
import { getRecords } from "../../services/app.service";
import { FilterOption, RecordData, RecordsResponse } from "../../types";
import { callAPI, convertFiltersToMongoFormat, getApiErrorMessage } from "../../util";

interface RecordsQuery {
  location: string;
  scopeId?: string;
  currentPage: number;
  pageSize: number;
  filters: FilterOption[];
  sort: [string, number];
  refreshKey?: number;
  pollWhileIdle?: boolean;
  paused?: boolean;
}

export const useRecordsTableData = ({
  location, scopeId, currentPage, pageSize, filters, sort,
  refreshKey = 0, pollWhileIdle = false, paused = false,
}: RecordsQuery) => {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [recordCount, setRecordCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryAttempt, setRetryAttempt] = useState(0);
  const lastQuery = useRef("");
  const query = JSON.stringify({location, scopeId, currentPage, pageSize, filters, sort});

  useEffect(() => {
    if (paused) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const parameters = JSON.parse(query);
    const changedQuery = lastQuery.current !== query;
    lastQuery.current = query;
    if (changedQuery) {
      setRecords([]);
      setLoading(true);
      setError("");
    }
    const schedule = () => {
      if (!cancelled) timer = setTimeout(load, 5000);
    };
    const load = () => {
      // Poll after the previous response; slow requests cannot accumulate.
      callAPI(getRecords, [parameters.location, {
        id: parameters.scopeId,
        sort: parameters.sort,
        filter: convertFiltersToMongoFormat(parameters.filters),
      }, parameters.currentPage, parameters.pageSize], (data: RecordsResponse) => {
        if (cancelled) return;
        setRecords(data.records);
        setRecordCount(data.record_count);
        setLoading(false);
        setError("");
        if (pollWhileIdle || data.has_active_processing_jobs ||
            data.records.some((record) => ["queued", "processing"].includes(record.status))) {
          schedule();
        }
      }, (failure, status) => {
        if (cancelled) return;
        setLoading(false);
        const message = getApiErrorMessage(failure, status === 403
          ? "You do not have access to these records." : "Unable to refresh records.");
        const retryAutomatically = status === undefined || status >= 500 || status === 408 || status === 429;
        const retryMessage = `${message}${/[.!?]$/.test(message) ? "" : "."} Retrying shortly.`;
        setError(retryAutomatically ? retryMessage : message);
        if (retryAutomatically) schedule();
      });
    };
    load();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, refreshKey, pollWhileIdle, paused, retryAttempt]);

  const retry = () => {
    setLoading(true);
    setError("");
    setRetryAttempt(attempt => attempt + 1);
  };

  return {records, setRecords, recordCount, loading, error, retry};
};
