import { refreshAuth, revokeToken } from "./services/app.service"
import { useEffect, useRef } from 'react';
import { FilterOption, TableColumns, RecordNote, SchemaField } from "./types";

export const DEFAULT_FILTER_OPTIONS: {
  [key: string]: FilterOption;
} = {
  review_status: {
      key: 'review_status',
      displayName: "Review Status",
      type: "checkbox",
      operator: 'equals',
      options: [
          { name: "reviewed", checked: true, value: "reviewed" },
          { name: "unreviewed", checked: true, value: "unreviewed" },
          { name: "incomplete", checked: true, value: "incomplete" },
          { name: "defective", checked: true, value: "defective" },
      ],
      selectedOptions: ["reviewed", "unreviewed", "incomplete", "defective"]
  },
  verification_status: {
    key: 'verification_status',
    displayName: "Verification Status",
    type: "checkbox",
    operator: 'equals',
    options: [
        { name: "unverified", checked: true, value: null },
        { name: "awaiting verification", checked: true, value: "required" },
        { name: "verified", checked: true, value: "verified" },
    ],
    selectedOptions: ["unverified", "awaiting verification", "verified"]
  },
  status: {
    key: 'status',
    displayName: "Digitization Status",
    type: "checkbox",
    operator: 'equals',
    options: [
        { name: "digitized", checked: true, value: "digitized" },
        { name: "processing", checked: true, value: "processing" },
        { name: "error", checked: true, value: "error" },
    ],
    selectedOptions: ["digitized", "processing", "error"]
  },
  error_status: {
    key: 'error_status',
    displayName: "Error Status",
    type: "checkbox",
    operator: 'equals',
    options: [
        { name: "has cleaning errors", checked: true, value: 'true' },
        { name: "no cleaning errors", checked: true, value: 'false' },
    ],
    selectedOptions: ["has cleaning errors", "no cleaning errors"]
  },
  name: {
    key: "name",
    displayName: "Record Name",
    type: "string",
    operator: 'equals',
    value: ''
  },
  dateCreated: {
    key: "dateCreated",
    displayName: "Date Uploaded",
    type: "date",
    operator: 'is',
    value: ''
  }
}

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
}

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
}

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
}

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
]

export const deleteCommentFromNotes = (recordNotes: RecordNote[], deleteIdx?: number) => {
  let tempNotes = structuredClone(recordNotes)
  if (deleteIdx === undefined) {
    console.log('could not delete note')
    return tempNotes
  }
  
  let isReply, repliesTo
  let currentNote = tempNotes[deleteIdx]
  isReply = currentNote.isReply || false
  repliesTo = currentNote.repliesTo
  let replies = currentNote.replies || []
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
  } = {}
  let nextIdx = 0

  for (let note of tempNotes) {
    idxesAfter[note.timestamp] = nextIdx
    nextIdx += 1
  }

  let newIndexes: {
    [key: number]: number;
  } = {}

  nextIdx = 0
  for (let note of recordNotes) {
    newIndexes[nextIdx] = idxesAfter[note.timestamp]
    nextIdx += 1
  }

  /*
    update reply indexes
  */
  for (let note of tempNotes) {
    let replies = note.replies
    if (replies) {
      let newReplies = []
      for (let reply of replies) {
        if (newIndexes[reply] !== undefined) newReplies.push(newIndexes[reply])
      }
      note.replies = newReplies
    }

    if (note.isReply && note.repliesTo !== undefined) {
      if (newIndexes[note.repliesTo] === undefined) {
        console.log('newIndexes[note.repliesTo] === undefined, this should never happen')
        console.log(note)
      }
      note.repliesTo = newIndexes[note.repliesTo] 
    }
  }
  return tempNotes
}

export const round = (num: number, scale: number): number => {
  if(!("" + num).includes("e")) {
    return +(Math.round(parseFloat(num + "e+" + scale))  + "e-" + scale);
  } else {
    const arr: string[] = ("" + num).split("e");
    let sig: string = ""
    if(+arr[1] + scale > 0) {
      sig = "+";
    }
    return +(Math.round(parseFloat(+arr[0] + "e" + sig + (+arr[1] + scale))) + "e-" + scale);
  }
}

export const formatDate = (timestamp: number | null): string | null => {
  if (timestamp !== null) {
    const date: Date = new Date(timestamp * 1000);
    const day: number = date.getDate();
    const month: number = date.getMonth();
    const year: number = date.getFullYear();
    const formattedDate: string = `${month + 1}/${day}/${year}`;
    return formattedDate;
  } else return String(timestamp);
}

export function formatDateTime(timestamp?: number): string {
  if (timestamp === undefined) return 'unknown'
  if (timestamp === -1) return 'unknown'
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

export const findCenter = (points: number[][]) => {
  let center = []
  if (points) {
      center.push((points[0][0] + points[1][0]) / 2)
      center.push((points[0][1] + points[2][1]) / 2)
  } else center = [50,50]
  return center
}


export const median = (numbers: number[]): number => {
  const sorted: number[] = Array.from(numbers).sort((a, b) => a - b);
  const middle: number = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

export const average = (array: number[]): number => array.reduce((a, b) => a + b) / array.length;

export const formatConfidence = (value: number | null): string => {
  if (value === null) return "";
  const percentageValue: string = (value * 100).toLocaleString('en-US', { maximumFractionDigits: 0 });
  return `${percentageValue} %`;
}

export const formatAttributeValue = (value: string | number | boolean | null): string | number => {
  if (value === null) return "";
  else if (value === true) return 'true'
  else if (value === false) return 'false'
  else return value
}

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
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);
};

export const useOutsideClick = (callback: () => void): React.RefObject<HTMLTableSectionElement> => {
  const ref = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent): void => {
      callback();
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return ref;
};

export const logout = (): void => {
  revokeToken();
  console.log("logging out");
  localStorage.clear();
  window.location.replace("/");
}

export const convertFiltersToMongoFormat = (filters: FilterOption[]): object => {
  let filterBy: { [key: string]: any } = {};
  for (let filter of filters) {
      let nextFilter: any;
      if (filter.key === 'error_status') {
        if (filter.selectedOptions?.length == 2 || filter.selectedOptions?.length == 0) {
        }
        else if (filter.selectedOptions?.includes('has cleaning errors')) {
          filterBy['$or'] = [
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
          ]
        }
        else if (filter.selectedOptions?.includes('no cleaning errors')) {
          filterBy['$nor'] = [
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
          ]
        }
        continue
      }
      else if (filter.type === 'checkbox') {
          nextFilter = { "$in": [] };
          for (let each of filter.options || []) {
              if (each.checked) nextFilter["$in"].push(each.value);
          }
      }
      else if (filter.type === 'date') {
          let date_value: string = filter.value || '';
          let date_start: number = Math.floor(new Date(date_value).getTime() / 1000);
          let date_end: number = date_start + (24 * 3600);
          if (filter.operator === 'is') {
              nextFilter = { "$gte": date_start, "$lt": date_end };
          } else if (filter.operator === 'before') {
              nextFilter = { "$lt": date_start };
          } else if (filter.operator === 'after') {
              nextFilter = { "$gt": date_end };
          }
      }
      else if (filter.type === 'string') {
          if (filter.operator === 'equals') nextFilter = filter.value;
          else if (filter.operator === 'contains') nextFilter = { "$regex": filter.value };
      }

      if (Object.keys(filterBy).includes(filter.key)) {
          filterBy[filter.key] = { ...filterBy[filter.key], ...nextFilter };
      } else {
          filterBy[filter.key] = nextFilter;
      }
  }
  return filterBy;
}

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
        console.error('failed to scroll')
    }
}

export const callAPI = async (
  apiFunc: (...args: any[]) => Promise<Response>, 
  apiParams: any[], 
  onSuccess: (data: any) => void, 
  onError: (error: any, status?: number) => void, 
  isJson: boolean = true
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
          return logout();
        }
      } catch (error) {
        console.error(error);
        return logout();
      }
    } 

    const errorData = await response.json();
    return onError(errorData.detail, response.status);
    
  } catch (error) {
    return onError(error);
  }
};
