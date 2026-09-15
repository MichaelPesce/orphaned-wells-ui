import { useEffect, useRef, useState } from "react";
import { checkProcessorStatus, deployProcessor, undeployProcessor } from "../../services/app.service";
import { callAPI } from "../../util";

const POLL_INTERVAL = 5000;
const START_TIMEOUT = 60000;
// Document AI processor-version states; 10 is the backend's unavailable result.
const PROCESSOR_LABELS: Record<number, string> = {
  1: "Processor deployed",
  2: "Processor deploying",
  3: "Processor undeployed",
  4: "Processor undeploying",
  5: "Processor creating",
  6: "Processor deleting",
  8: "Processor importing",
};

const useUploadProcessor = (recordGroupId: string, onReady: (ready: boolean) => void) => {
  const [state, setState] = useState<number | null>(null);
  const [error, setError] = useState("");
  const controls = useRef<{retry: () => void; changeDeployment: () => void} | null>(null);

  useEffect(() => {
    let cancelled = false;
    let revision = 0;
    let currentState: number | null = null;
    let timer: ReturnType<typeof setTimeout>;
    let transition: {previous: number; pending: number; deadline: number} | null = null;
    const update = (value: number | null, message = "") => {
      currentState = value;
      setState(value);
      setError(message);
      onReady(value === 1 && !message);
    };
    const fail = (message: string) => {
      clearTimeout(timer);
      transition = null;
      update(null, message);
    };
    const validState = (value: unknown): value is number => typeof value === "number" && value in PROCESSOR_LABELS;
    const unavailableMessage = "Processor not found or its status is unavailable. Check the record group's processor configuration and retry the status check.";
    const check = () => {
      clearTimeout(timer);
      const request = ++revision;
      callAPI(checkProcessorStatus, [recordGroupId], (value: unknown) => {
        if (cancelled || request !== revision) return;
        if (!validState(value)) {
          fail(value === 7 ? "Processor failed. Check its configuration and retry the status check." : unavailableMessage);
          return;
        }
        // The deploy endpoint responds before its background task reaches Google.
        // Keep the accepted transition visible until Google reports a new state.
        if (transition && value === transition.previous) {
          if (Date.now() >= transition.deadline) {
            fail("The processor status has not changed after the request. Retry the status check before trying again.");
            return;
          }
          update(transition.pending);
          timer = setTimeout(check, POLL_INTERVAL);
          return;
        }
        transition = null;
        update(value);
        if (value !== 1 && value !== 3) timer = setTimeout(check, POLL_INTERVAL);
      }, (failure, status) => {
        if (cancelled || request !== revision) return;
        fail(status === 404 ? "Processor not found. Check the record group's processor configuration." : "Unable to check processor status. Retry the status check.");
      });
    };
    const changeDeployment = () => {
      if (currentState !== 1 && currentState !== 3) return;
      const undeploying = currentState === 1;
      const previous = currentState;
      const pending = undeploying ? 4 : 2;
      const complete = undeploying ? 3 : 1;
      clearTimeout(timer);
      const request = ++revision;
      update(pending);
      callAPI(undeploying ? undeployProcessor : deployProcessor, [recordGroupId], (value: unknown) => {
        if (cancelled || request !== revision) return;
        if (value === complete) {
          transition = null;
          update(complete);
        } else if (value === pending) {
          transition = {previous, pending, deadline: Date.now() + START_TIMEOUT};
          timer = setTimeout(check, POLL_INTERVAL);
        } else {
          fail("Unable to change processor deployment. Retry the status check.");
        }
      }, () => {
        if (!cancelled && request === revision) fail("Unable to change processor deployment. Retry the status check.");
      });
    };
    controls.current = {
      retry: () => {update(null); check();},
      changeDeployment,
    };
    update(null);
    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      controls.current = null;
    };
  }, [recordGroupId, onReady]);

  return {
    state,
    error,
    status: error ? "Processor unavailable" : state === null ? "Checking processor" : PROCESSOR_LABELS[state],
    retry: () => controls.current?.retry(),
    changeDeployment: () => controls.current?.changeDeployment(),
  };
};

export default useUploadProcessor;
