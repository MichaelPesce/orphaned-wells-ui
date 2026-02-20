import { refreshAuth, revokeToken } from "./services/app.service";
import { useEffect, useRef } from "react";
import {
  FilterOption,
  TableColumns,
  RecordNote,
  SchemaField,
  RepoProcessor,
  MongoProcessor,
  HistoryAttribute,
  QuerySummary,
  QuerySummaryLine,
} from "./types";

export const DEFAULT_FILTER_OPTIONS: {
  [key: string]: FilterOption;
} = {
  review_status: {
    key: "review_status",
    displayName: "Review Status",
    type: "checkbox",
    operator: "equals",
    options: [
      { name: "reviewed", checked: true, value: "reviewed" },
      { name: "unreviewed", checked: true, value: "unreviewed" },
      { name: "incomplete", checked: true, value: "incomplete" },
      { name: "defective", checked: true, value: "defective" },
    ],
    selectedOptions: ["reviewed", "unreviewed", "incomplete", "defective"]
  },
  verification_status: {
    key: "verification_status",
    displayName: "Verification Status",
    type: "checkbox",
    operator: "equals",
    options: [
      { name: "unverified", checked: true, value: null },
      { name: "awaiting verification", checked: true, value: "required" },
      { name: "verified", checked: true, value: "verified" },
    ],
    selectedOptions: ["unverified", "awaiting verification", "verified"]
  },
  status: {
    key: "status",
    displayName: "Digitization Status",
    type: "checkbox",
    operator: "equals",
    options: [
      { name: "digitized", checked: true, value: "digitized" },
      { name: "processing", checked: true, value: "processing" },
      { name: "error", checked: true, value: "error" },
    ],
    selectedOptions: ["digitized", "processing", "error"]
  },
  error_status: {
    key: "error_status",
    displayName: "Error Status",
    type: "checkbox",
    operator: "equals",
    options: [
      { name: "has cleaning errors", checked: true, value: "true" },
      { name: "no cleaning errors", checked: true, value: "false" },
    ],
    selectedOptions: ["has cleaning errors", "no cleaning errors"]
  },
  name: {
    key: "name",
    displayName: "Record Name",
    type: "string",
    operator: "equals",
    value: ""
  },
  dateCreated: {
    key: "dateCreated",
    displayName: "Date Uploaded",
    type: "date",
    operator: "is",
    value: ""
  }
};

export const TABLE_ATTRIBUTES: {
  [key: string]: TableColumns;
} = {
  record_group: {
    displayNames: ["Record Name", "Date Uploaded", "API Number", "Mean Confidence", "Lowest Confidence", "Notes", "Digitization Status", "Review Status"],
    keyNames: ["name", "dateCreated", "api_number", "confidence_median", "confidence_lowest", "notes", "status", "review_status"],
  },
  project: {
    displayNames: ["Record Name", "Record Group", "Date Uploaded", "API Number", "Notes", "Digitization Status", "Review Status"],
    keyNames: ["name", "record_group", "dateCreated", "api_number", "notes", "status", "review_status"],
  },
  team: {
    displayNames: ["Record Name", "Date Uploaded", "API Number", "Notes", "Digitization Status", "Review Status"],
    keyNames: ["name", "dateCreated", "api_number", "notes", "status", "review_status"],
  }
};

export const ISGS_TABLE_ATTRIBUTES: {
  [key: string]: TableColumns;
} = {
  record_group: {
    displayNames: ["Record Name", "Date Uploaded", "API Number", "Mean Confidence", "Lowest Confidence", "Notes", "Digitization Status", "Review Status"],
    keyNames: ["name", "dateCreated", "api_number", "confidence_median", "confidence_lowest", "notes", "status", "review_status"],
  },
  project: {
    displayNames: ["Record Name", "Record Group", "Date Uploaded", "API Number", "Notes", "Digitization Status", "Review Status"],
    keyNames: ["name", "record_group", "dateCreated", "api_number", "notes", "status", "review_status"],
  },
  team: {
    displayNames: ["Record Name", "Date Uploaded", "API Number", "Notes", "Digitization Status", "Review Status"],
    keyNames: ["name", "dateCreated", "api_number", "notes", "status", "review_status"],
  }
};

export const OSAGE_TABLE_ATTRIBUTES: {
  [key: string]: TableColumns;
} = {
  record_group: {
    displayNames: ["Record Name", "Date Uploaded", "Section", "Township", "Mean Confidence", "Lowest Confidence", "Notes", "Digitization Status", "Review Status"],
    keyNames: ["name", "dateCreated", "Sec", "T", "confidence_median", "confidence_lowest", "notes", "status", "review_status"],
  },
  project: {
    displayNames: ["Record Name", "Record Group", "Date Uploaded", "Section", "Township", "Notes", "Digitization Status", "Review Status"],
    keyNames: ["name", "record_group", "dateCreated", "Sec", "T", "notes", "status", "review_status"],
  },
  team: {
    displayNames: ["Record Name", "Date Uploaded", "Section", "Township", "Notes", "Digitization Status", "Review Status"],
    keyNames: ["name", "dateCreated", "Sec", "T", "notes", "status", "review_status"],
  }
};

export const schemaOverviewColumns = [
  {
    key: "name",
    displayName: "Processor Name",
  },
  {
    key: "displayName",
    displayName: "Display Name",
  },
  {
    key: "processorId",
    displayName: "Processor ID",
  },
  {
    key: "modelId",
    displayName: "Model ID",
  },
  {
    key: "documentType",
    displayName: "Document Type",
  },
  {
    key: "img",
    displayName: "Sample Image",
  },
];

export const schemaProcessorColumns  = [
  {
    key: "name",
    displayName: "Field Name",
  },
  {
    key: "alias",
    displayName: "Display Name",
  },
  {
    key: "cleaning_function",
    displayName: "Cleaning function",
  },
  {
    key: "data_type",
    displayName: "Data Type",
  },
  {
    key: "database_data_type",
    displayName: "Database DataType",
  },
  {
    key: "page_order_sort",
    displayName: "Page Order",
  },
];

export const deleteCommentFromNotes = (recordNotes: RecordNote[], deleteIdx?: number) => {
  let tempNotes = structuredClone(recordNotes);
  if (deleteIdx === undefined) {
    console.log("could not delete note");
    return tempNotes;
  }
  
  let isReply, repliesTo;
  let currentNote = tempNotes[deleteIdx];
  isReply = currentNote.isReply || false;
  repliesTo = currentNote.repliesTo;
  let replies = currentNote.replies || [];
  replies.sort(function(a,b){ return b - a; });
  for (let reply of replies) {
    tempNotes.splice(reply, 1);
  }
  tempNotes.splice(deleteIdx, 1);


  /*
    if this note was a reply, remove it from the replies of the parent note
  */
  if (isReply && repliesTo !== undefined) {
    const replyIdx = tempNotes[repliesTo].replies?.indexOf(deleteIdx);
    if (replyIdx !== undefined && replyIdx > -1) {
      tempNotes[repliesTo].replies?.splice(replyIdx, 1);
    }
  
  }

  /*
    compare indexes from before and after
    make sure all reply indexes are properly updated
  */
  let idxesAfter: {
    [key: number]: number;
  } = {};
  let nextIdx = 0;

  for (let note of tempNotes) {
    idxesAfter[note.timestamp] = nextIdx;
    nextIdx += 1;
  }

  let newIndexes: {
    [key: number]: number;
  } = {};

  nextIdx = 0;
  for (let note of recordNotes) {
    newIndexes[nextIdx] = idxesAfter[note.timestamp];
    nextIdx += 1;
  }

  /*
    update reply indexes
  */
  for (let note of tempNotes) {
    let replies = note.replies;
    if (replies) {
      let newReplies = [];
      for (let reply of replies) {
        if (newIndexes[reply] !== undefined) newReplies.push(newIndexes[reply]);
      }
      note.replies = newReplies;
    }

    if (note.isReply && note.repliesTo !== undefined) {
      if (newIndexes[note.repliesTo] === undefined) {
        console.log("newIndexes[note.repliesTo] === undefined, this should never happen");
        console.log(note);
      }
      note.repliesTo = newIndexes[note.repliesTo]; 
    }
  }
  return tempNotes;
};

export const round = (num: number, scale: number): number => {
  if(!("" + num).includes("e")) {
    return +(Math.round(parseFloat(num + "e+" + scale))  + "e-" + scale);
  } else {
    const arr: string[] = ("" + num).split("e");
    let sig: string = "";
    if(+arr[1] + scale > 0) {
      sig = "+";
    }
    return +(Math.round(parseFloat(+arr[0] + "e" + sig + (+arr[1] + scale))) + "e-" + scale);
  }
};

export const formatDate = (timestamp: number | null): string | null => {
  if (timestamp !== null) {
    const date: Date = new Date(timestamp * 1000);
    const day: number = date.getDate();
    const month: number = date.getMonth();
    const year: number = date.getFullYear();
    const formattedDate: string = `${month + 1}/${day}/${year}`;
    return formattedDate;
  } else return String(timestamp);
};

export function formatDateTime(timestamp?: number): string {
  if (timestamp === undefined) return "unknown";
  if (timestamp === -1) return "unknown";
  if (timestamp > 1e12) {
    timestamp = Math.floor(timestamp / 1000); // Convert milliseconds to seconds
  }
  // Convert the timestamp to milliseconds (UNIX timestamps are in seconds)
  const date = new Date(timestamp * 1000);

  // Options for formatting the date
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  // Format the date using Intl.DateTimeFormat
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

const ATTRIBUTES_LIST_KEY = "attributesList";

const isAttributesListField = (key: string): boolean =>
  key === ATTRIBUTES_LIST_KEY || key.startsWith(`${ATTRIBUTES_LIST_KEY}.`);

const isMeaningfulHistoryValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

const getHistoryAttributeValue = (attr: HistoryAttribute): unknown => {
  const hasNonEmptyString = (value: unknown): boolean =>
    typeof value === "string" ? value.trim().length > 0 : true;

  if (
    attr.normalized_value !== undefined &&
    attr.normalized_value !== null &&
    hasNonEmptyString(attr.normalized_value)
  ) {
    return attr.normalized_value;
  }
  if (
    attr.value !== undefined &&
    attr.value !== null &&
    hasNonEmptyString(attr.value)
  ) {
    return attr.value;
  }
  if (
    attr.text_value !== undefined &&
    attr.text_value !== null &&
    hasNonEmptyString(attr.text_value)
  ) {
    return attr.text_value;
  }
  return attr.raw_text;
};

const getHistoryAttributesList = (
  payload?: Record<string, unknown> | null
): HistoryAttribute[] => {
  if (!payload || typeof payload !== "object") return [];

  const attrs = payload[ATTRIBUTES_LIST_KEY];
  if (Array.isArray(attrs)) return attrs as HistoryAttribute[];

  return Object.entries(payload)
    .filter(
      ([key, value]) =>
        key.startsWith(`${ATTRIBUTES_LIST_KEY}.`) &&
        value &&
        typeof value === "object"
    )
    .map(([key, value]) => {
      const idx = Number(key.replace(`${ATTRIBUTES_LIST_KEY}.`, ""));
      return {
        idx: Number.isNaN(idx) ? Number.MAX_SAFE_INTEGER : idx,
        value: value as HistoryAttribute,
      };
    })
    .sort((a, b) => a.idx - b.idx)
    .map((entry) => entry.value);
};

export const formatHistoryKey = (key: string): string =>
  key
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const formatHistoryValue = (value: unknown): string => {
  if (value === null || value === undefined) return "empty";
  if (typeof value === "string") return value.trim() || "empty";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return `[${value.length} values]`;
  if (typeof value === "object") return "{...}";
  return String(value);
};

export const buildRecordHistoryQuerySummary = (
  query?: Record<string, unknown> | null
): QuerySummary | null => {
  if (!query || typeof query !== "object") return null;

  const queryAttributes = getHistoryAttributesList(query);
  const attributeLines: QuerySummaryLine[] = queryAttributes
    .filter((attr) => typeof attr.key === "string" && attr.key)
    .map((attr) => ({
      key: attr.key as string,
      currentValue: getHistoryAttributeValue(attr),
    }))
    .filter((line) => isMeaningfulHistoryValue(line.currentValue));

  const nonAttributeLines: QuerySummaryLine[] = Object.entries(query)
    .filter(([key]) => !isAttributesListField(key))
    .map(([key, currentValue]) => ({ key, currentValue }))
    .filter((line) => isMeaningfulHistoryValue(line.currentValue));

  const lines: QuerySummaryLine[] = [];
  const seenKeys = new Set<string>();
  [...attributeLines, ...nonAttributeLines].forEach((line) => {
    if (seenKeys.has(line.key)) return;
    seenKeys.add(line.key);
    lines.push(line);
  });

  if (lines.length === 0) {
    return {
      title: "Query snapshot",
      subtitle: "No populated fields detected",
      lines: [],
    };
  }

  return {
    title: "Query snapshot",
    subtitle: `${lines.length} populated field${lines.length === 1 ? "" : "s"}`,
    lines,
  };
};

export const findCenter = (points: number[][]) => {
  let center = [];
  if (points) {
    center.push((points[0][0] + points[1][0]) / 2);
    center.push((points[0][1] + points[2][1]) / 2);
  } else center = [50,50];
  return center;
};


export const median = (numbers: number[]): number => {
  const sorted: number[] = Array.from(numbers).sort((a, b) => a - b);
  const middle: number = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
};

export const average = (array: number[]): number => array.reduce((a, b) => a + b) / array.length;

export const formatConfidence = (value: number | null): string => {
  if (value === null) return "";
  const percentageValue: string = (value * 100).toLocaleString("en-US", { maximumFractionDigits: 0 });
  return `${percentageValue} %`;
};

export const formatAttributeValue = (value: string | number | boolean | null): string | number => {
  if (value === null) return "";
  else if (value === true) return "true";
  else if (value === false) return "false";
  else return value;
};

export const useKeyDown = (
  key: string, 
  singleKeyCallback?: () => void, 
  shiftKeyCallback?: () => void, 
  controlKeyCallback?: () => void, 
  shiftAndControlKeyCallback?: () => void, 
  keepDefaultBehavior?: boolean
): void => {
  const onKeyDown = (event: KeyboardEvent): void => {
    const wasKeyPressed: boolean = event.key === key;
    if (wasKeyPressed) {
      if(!keepDefaultBehavior) event.preventDefault();
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && shiftAndControlKeyCallback) {
        shiftAndControlKeyCallback();
      }
      else if ((event.metaKey || event.ctrlKey) && controlKeyCallback) {
        controlKeyCallback();
      }
      else if (event.shiftKey && shiftKeyCallback) {
        shiftKeyCallback();
      }
      else if (singleKeyCallback) {
        singleKeyCallback();
      }
    }
  };
  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);
};

export const useOutsideClick = (callback: () => void): React.RefObject<HTMLTableSectionElement> => {
  const ref = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent): void => {
      callback();
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return ref;
};

export const logout = (): void => {
  revokeToken();
  console.log("logging out");
  localStorage.clear();
  window.location.replace("/login");
};

export const convertFiltersToMongoFormat = (filters: FilterOption[]): object => {
  let filterBy: { [key: string]: any } = {};
  for (let filter of filters) {
    let nextFilter: any;
    if (filter.key === "error_status") {
      if (filter.selectedOptions?.length == 2 || filter.selectedOptions?.length == 0) {
      }
      else if (filter.selectedOptions?.includes("has cleaning errors")) {
        filterBy["$or"] = [
          {
            "attributesList": {
              "$elemMatch": {
                "$and": [
                  {"cleaning_error": {"$ne": false}},
                  {"cleaning_error": {"$exists": true}},
                ]
              }
            }
          },
          {
            "attributesList.subattributes": {
              "$elemMatch": {
                "$and": [
                  {"cleaning_error": {"$ne": false}},
                  {"cleaning_error": {"$exists": true}},
                ]
              }
            }
          },
        ];
      }
      else if (filter.selectedOptions?.includes("no cleaning errors")) {
        filterBy["$nor"] = [
          {
            "attributesList": {
              "$elemMatch": {
                "$and": [
                  {"cleaning_error": {"$ne": false}},
                  {"cleaning_error": {"$exists": true}},
                ]
              }
            }
          },
          {
            "attributesList.subattributes": {
              "$elemMatch": {
                "$and": [
                  {"cleaning_error": {"$ne": false}},
                  {"cleaning_error": {"$exists": true}},
                ]
              }
            }
          },
        ];
      }
      continue;
    }
    else if (filter.type === "checkbox") {
      nextFilter = { "$in": [] };
      for (let each of filter.options || []) {
        if (each.checked) nextFilter["$in"].push(each.value);
      }
    }
    else if (filter.type === "date") {
      let date_value: string = filter.value || "";
      let date_start: number = Math.floor(new Date(date_value).getTime() / 1000);
      let date_end: number = date_start + (24 * 3600);
      if (filter.operator === "is") {
        nextFilter = { "$gte": date_start, "$lt": date_end };
      } else if (filter.operator === "before") {
        nextFilter = { "$lt": date_start };
      } else if (filter.operator === "after") {
        nextFilter = { "$gt": date_end };
      }
    }
    else if (filter.type === "string") {
      if (filter.operator === "equals") nextFilter = filter.value;
      else if (filter.operator === "contains") nextFilter = { "$regex": filter.value };
    }

    if (Object.keys(filterBy).includes(filter.key)) {
      filterBy[filter.key] = { ...filterBy[filter.key], ...nextFilter };
    } else {
      filterBy[filter.key] = nextFilter;
    }
  }
  return filterBy;
};

export function scrollIntoView(element: HTMLElement | null, container: HTMLElement | null) {
  if (element && container) {
    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight; 
    const elemTop = element.offsetTop;
    const elemBottom = elemTop + element.clientHeight;
    if (elemTop < containerTop) {
      container.scrollTo({
        // add -45 to give ensure element comes fully into view
        top: elemTop - 45,
        behavior: "smooth",
      });
    } else if (elemBottom > containerBottom) {
      container.scrollTo({
        // add +45 to give ensure element comes fully into view
        top: elemBottom - container.clientHeight + 25,
        behavior: "smooth",
      });
    }
  }
}

export function coordinatesDecimalsToPercentage(coords: number[][]) {
  return coords.map(coord => coord.map(value => value * 100));
}

export const scrollToAttribute = (boxId: string, heightId: string, top: number, imageFiles: any) => {
  try{
    const imageContainerId = boxId;
    const imageContainerElement = document.getElementById(imageContainerId);
    const imageElement = document.getElementById(heightId);
    const scrollAmount = top * imageElement!.clientHeight * imageFiles.length - 100;
    if (imageContainerElement) {
      imageContainerElement.scrollTo({
        top: scrollAmount,
        behavior: "smooth",
      });
    }
  } catch(e) {
    // this likely only occurs when table is in fullscreen mode and image is note displayed
    console.error("failed to scroll");
  }
};

export const callAPI = async (
  apiFunc: (...args: any[]) => Promise<Response>, 
  apiParams: any[], 
  onSuccess: (data: any) => void, 
  onError: (error: any, status?: number) => void, 
  isJson: boolean = true,
  logoutOn401: boolean = true
): Promise<void> => {
  try {
    let response = await apiFunc(...apiParams);
    
    if (response.status === 200) {
      const data = isJson ? await response.json() : await response.blob();
      return onSuccess(data);
    } 
    else if (response.status < 400) {
      const data = isJson ? await response.json() : await response.blob();
      return onError(data, response.status);
    }

    else if (response.status === 401) {
      try {
        const refreshResponse = await refreshAuth();
        const refreshData = await refreshResponse.json();

        if (refreshResponse.status === 200) {
          console.log("Refreshed tokens:");
          localStorage.setItem("id_token", refreshData.id_token);
          localStorage.setItem("access_token", refreshData.access_token);

          response = await apiFunc(...apiParams);

          if (response.status === 200) {
            const data = isJson ? await response.json() : await response.blob();
            return onSuccess(data);
          } 

          const errorData = await response.json();
          return onError(errorData, response.status);
        } else {
          console.error(`Received response status ${refreshResponse.status} when attempting to refresh tokens`);
          if (logoutOn401)
            return logout();
        }
      } catch (error) {
        console.error(error);
        if (logoutOn401)
          return logout();
      }
    } 

    const errorData = await response.json();
    return onError(errorData.detail, response.status);
    
  } catch (error) {
    return onError(error);
  }
};


// Type guard to determine if an object is a RepoProcessor
function isRepoProcessor(obj: any): obj is RepoProcessor {
  return "Processor Name" in obj && "Processor ID" in obj && "Model ID" in obj;
}

// Function to convert a RepoProcessor to a MongoProcessor or return it directly if it's a MongoProcessor
export function convertToMongoProcessor(input: RepoProcessor | MongoProcessor): MongoProcessor {
  if (isRepoProcessor(input)) {
    return {
      name: input["Processor Name"],
      processorId: input["Processor ID"],
      modelId: input["Model ID"],
      lastUpdated: input.lastUpdated,
      img: input.img,
      documentType: input.documentType,
      displayName: input.displayName,
      attributes: input.attributes as SchemaField[]
    };
  }
  return input;
}

export const formatPageName = (page: string) => {
  const formattedName = page?.length > 50 ? `${page?.substring(0,47)}...` : page;
  return formattedName;
};
