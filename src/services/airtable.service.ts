const AIRTABLE_API_URL = "https://api.airtable.com/v0";

export const getAirtableBases = () => {
  return fetch(`${AIRTABLE_API_URL}/meta/bases`, {
    mode: "cors",
    headers: { "Authorization": "Bearer " + process.env.REACT_APP_AIRTABLE_API_TOKEN }
  });
};

export const getAirtableTable = (table_id: string = process.env.REACT_APP_AIRTABLE_PROCESSORS_TABLE_ID || "") => {
  return fetch(`${AIRTABLE_API_URL}/${process.env.REACT_APP_AIRTABLE_BASE_ID}/${table_id}`, {
    mode: "cors",
    headers: { "Authorization": "Bearer " + process.env.REACT_APP_AIRTABLE_API_TOKEN }
  });
};