import { refreshAuth, revokeToken } from "../services/app.service"
import { useEffect, useRef } from 'react';
import { FilterOption, TableColumns, RecordNote, SchemaField } from "../types";

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

export const checkFieldValidity = (fieldSchema: SchemaField, value: any) => {
  /*
    TODO: frontend validtion
    we can look at databaseDataType, accepted_range to determine if the value is valid or not
    return boolean value whether this is valid or not
    optional: return reason why it is not valid
  */
  if (!fieldSchema || value === null || value === '') return true
  try {
    let databaseDataType = fieldSchema.database_data_type?.toLowerCase();
    if (databaseDataType === 'str') {
      // All values are valid for string type, but we should check if it can be converted to a string
      return typeof value === 'string' || value !== null && value !== undefined;
    } else if (databaseDataType === 'int') {
      // Check if the value is an integer or can be parsed as an integer
      return typeof value === 'number' && Number.isInteger(value) || typeof value === 'string' && !isNaN(parseInt(value));
    } else if (databaseDataType === 'bool') {
      // Check if the value is a boolean or a string that can be parsed as a boolean
      return typeof value === 'boolean' || (typeof value === 'string' && (value.trim().toLowerCase() === 'true' || value.trim().toLowerCase() === 'false'));
    } else if (databaseDataType === 'float') {
      // Check if the value is a number or can be parsed as a float
      return typeof value === 'number' || typeof value === 'string' && !isNaN(parseFloat(value));
    } else if (databaseDataType === 'date') {
      // Check if the value is a Date object or a string that can be parsed as a date
      if (value instanceof Date) return true;
      if (typeof value !== 'string') return false;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      return dateRegex.test(value);
    } else if (databaseDataType === 'table') {
      return true
    } else {
      console.log('unsupported database data type: '+databaseDataType)
    }
  }
  catch(e) {
    console.error(e)
  }
  return true
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
      if (filter.type === 'checkbox') {
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
