const AIRTABLE_API_URL = `https://api.airtable.com/v0/${process.env.REACT_APP_AIRTABLE_BASEID}`

export const getAirtableProcessors = () => {
    return fetch(`${AIRTABLE_API_URL}/${process.env.REACT_APP_AIRTABLE_PROCESSORS_TABLE_ID}`, {
        mode: 'cors',
        headers: { "Authorization": "Bearer " + process.env.REACT_APP_AIRTABLE_API_TOKEN }
    });
};