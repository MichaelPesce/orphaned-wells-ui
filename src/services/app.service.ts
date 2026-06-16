import { MongoProcessor } from "../types";

let BACKEND_URL = process.env.REACT_APP_BACKEND_URL as string;
const CORS_MODE: RequestMode = "cors";
const JSON_HEADERS = { "Content-Type": "application/json" };

export const getProjects = () => {
  return fetch(BACKEND_URL + "/get_projects", {
    mode: CORS_MODE,
  });
};

export const getRecordGroups = (project_id: string) => {
  return fetch(BACKEND_URL + "/get_record_groups/"+project_id, {
    mode: CORS_MODE,
  });
};

export const getProcessors = () => {
  return fetch(BACKEND_URL + "/get_processors", {
    mode: CORS_MODE,
  });
};

export const getProcessorData = (google_id: string) => {
  return fetch(BACKEND_URL + "/get_processor_data/"+google_id, {
    mode: CORS_MODE,
  });
};

export const getColumnData = (location: string, _id: string) => {
  return fetch(BACKEND_URL + "/get_column_data/"+location+"/"+_id, {
    mode: CORS_MODE,
  });
};

export const getRecordGroup = (rg_id: string) => {
  return fetch(BACKEND_URL + "/get_record_group/" + rg_id, {
    mode: CORS_MODE,
  });
};

export const getRecords = (get_by: string, data: any, page: number, records_per_page: number) => {
  let route = BACKEND_URL + "/get_records/" + get_by + "?page=" + page + "&records_per_page=" + records_per_page;
  return fetch(route, {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const getTeamInfo = () => {
  return fetch(BACKEND_URL + "/get_team_info", {
    mode: CORS_MODE,
  });
};

export const addProject = (data: any) => {
  return fetch(BACKEND_URL + "/add_project", {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const addRecordGroup = (data: any) => {
  return fetch(BACKEND_URL + "/add_record_group", {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const uploadDocument = (data: FormData, project_id: string, user_email: any, reprocessed?: boolean, preventDuplicates?: boolean, run_cleaning_functions: boolean = false)  => {
  if (!reprocessed) reprocessed = false;
  if (!preventDuplicates) preventDuplicates = false;
  return fetch(BACKEND_URL + "/upload_document/" + project_id + "/" + user_email+"?reprocessed="+reprocessed+"&preventDuplicates="+preventDuplicates+"&run_cleaning_functions="+run_cleaning_functions, {
    method: "POST",
    mode: CORS_MODE,
    body: data,
  });
};

export const deployProcessor = (rg_id: string)  => {
  return fetch(BACKEND_URL + "/deploy_processor/"+rg_id, {
    method: "POST",
    mode: CORS_MODE,
  });
};

export const undeployProcessor = (rg_id: string)  => {
  return fetch(BACKEND_URL + "/undeploy_processor/"+rg_id, {
    method: "POST",
    mode: CORS_MODE,
  });
};

export const checkProcessorStatus = (rg_id: string)  => {
  return fetch(BACKEND_URL + "/check_processor_status/"+rg_id, {
    method: "GET",
    mode: CORS_MODE,
  });
};

export const getRecordData = (record_id: string, data: any = {}) => {
  return fetch(BACKEND_URL + "/get_record/" + record_id, {
    method: "POST",
    mode: CORS_MODE,
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
};

export const getRecordNotes = (record_id: string) => {
  return fetch(BACKEND_URL + "/get_record_notes/" + record_id, {
    mode: CORS_MODE,
  });
};

export const getRecordHistory = (record_id: string) => {
  return fetch(BACKEND_URL + "/get_record_history/" + record_id, {
    mode: CORS_MODE,
  });
};

export const getDownloadSize = (location: string, _id: string, data: any) => {
  let endpoint = `${BACKEND_URL}/get_download_size/${location}/${_id}`;
  return fetch(endpoint, {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const downloadRecords = (location: string, _id: string, export_types: { [key: string]: boolean }, output_name: string, data: any) => {
  let endpoint = `${BACKEND_URL}/download_records/${location}/${_id}?export_csv=${export_types["csv"] || false}&export_json=${export_types["json"] || false}&export_images=${export_types["image_files"] || false}&output_name=${output_name}`;
  return fetch(endpoint, {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const cleanRecords = (location: string, _id: string) => {
  return fetch(BACKEND_URL + "/run_cleaning_functions/" + location + "/" + _id, {
    method: "POST",
    mode: CORS_MODE,
  });
};

export const updateProject = (project_id: string, data: any) => {
  return fetch(BACKEND_URL + "/update_project/" + project_id, {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const updateRecordGroup = (rg_id: string, data: any) => {
  return fetch(BACKEND_URL + "/update_record_group/" + rg_id, {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const updateRecord = (record_id: string, data: any) => {
  return fetch(BACKEND_URL + "/update_record/" + record_id, {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const deleteProject = (project_id: string) => {
  return fetch(BACKEND_URL + "/delete_project/" + project_id, {
    method: "POST",
    mode: CORS_MODE,
  });
};

export const deleteRecordGroup = (rg_id: string) => {
  return fetch(BACKEND_URL + "/delete_record_group/" + rg_id, {
    method: "POST",
    mode: CORS_MODE,
  });
};

export const deleteRecord = (record_id: string) => {
  return fetch(BACKEND_URL + "/delete_record/" + record_id, {
    method: "POST",
    mode: CORS_MODE,
  });
};

export const deleteRecords = (data: any) => {
  return fetch(BACKEND_URL + "/delete_records", {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const authLogin = (code: any) => {
  return fetch(BACKEND_URL + "/auth_login", {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(code),
    headers: JSON_HEADERS,
  });
};

export const checkAuth = () => {
  return fetch(BACKEND_URL + "/check_auth", {
    method: "POST",
    mode: CORS_MODE,
  });
};

export const refreshAuth = () => {
  return fetch(BACKEND_URL + "/auth_refresh", {
    method: "POST",
    mode: CORS_MODE,
  });
};

export const getUsers = () => {
  return fetch(BACKEND_URL + "/get_users", {
    mode: CORS_MODE,
  });
};

export const addUser = (email: string, team_lead?: boolean, sys_admin?: boolean) => {
  if (!team_lead) team_lead = false;
  if (!sys_admin) sys_admin = false;
  let data = {
    team_lead: team_lead,
    sys_admin: sys_admin
  };
  return fetch(BACKEND_URL + "/add_user/" + email, {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const updateUserRoles = (data: any) => {
  return fetch(BACKEND_URL + "/update_user_roles", {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const updateDefaultTeam = (data: any) => {
  return fetch(BACKEND_URL + "/update_default_team", {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const fetchRoles = (role_categories: string[]) => {
  return fetch(BACKEND_URL + "/fetch_roles", {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(role_categories),
    headers: JSON_HEADERS,
  });
};

export const fetchTeams = () => {
  return fetch(BACKEND_URL + "/fetch_teams", {
    mode: CORS_MODE,
  });
};

export const checkForDuplicateRecords = (data: any, rg_id: string) => {
  return fetch(BACKEND_URL + "/check_if_records_exist/"+rg_id, {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const deleteUser = (email: string) => {
  return fetch(BACKEND_URL + "/delete_user/" + email, {
    method: "POST",
    mode: CORS_MODE,
  });
};

export const revokeToken = () => {
  return fetch(BACKEND_URL + "/logout", {
    method: "POST",
    mode: CORS_MODE,
  });
};

export const addContributors = (project_id: string, data: any) => {
  return fetch(BACKEND_URL + "/add_contributors/" + project_id, {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(data),
    headers: JSON_HEADERS,
  });
};

export const getSchema = () => {
  return fetch(BACKEND_URL + "/get_schema", {
    mode: CORS_MODE,
  });
};

export const getCleaningFunctions = () => {
  return fetch(BACKEND_URL + "/get_cleaning_functions", {
    mode: CORS_MODE,
  });
};

export const uploadProcessorSchema = (
  data: FormData,
  name: string,
  displayName: string,
  processorId: string,
  modelId: string,
  documentType: string,
  imageLink?: string,
) => {
  let endpoint = BACKEND_URL + `/upload_processor_schema/?name=${name}&displayName=${displayName}&processorId=${processorId}&modelId=${modelId}&documentType=${documentType}`;
  let img = imageLink;
  if (imageLink === undefined) img = "";
  endpoint+= `&img=${img}`;
  return fetch(endpoint, {
    method: "POST",
    mode: CORS_MODE,
    body: data,
  });
};

export const uploadSampleImage = (
  data: FormData,
  name: string,
) => {
  let endpoint = BACKEND_URL + `/upload_sample_image/${name}`;
  return fetch(endpoint, {
    method: "POST",
    mode: CORS_MODE,
    body: data,
  });
};

export const updateProcessor = (updated_processor: MongoProcessor) => {
  return fetch(BACKEND_URL + "/update_processor", {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify(updated_processor),
    headers: JSON_HEADERS,
  });
};

export const updateProcessorAttribute = (
  processorName: string,
  fieldName: string,
  updates: Record<string, string | number | null>,
  operation: "update" | "add" | "delete" = "update"
) => {
  return fetch(BACKEND_URL + "/update_processor_attribute", {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify({
      processor_name: processorName,
      field_name: fieldName,
      updates,
      operation,
    }),
    headers: JSON_HEADERS,
  });
};

export const getSampleImage = (processorName: string) => {
  return fetch(BACKEND_URL + "/get_image_url/"+processorName, {
    mode: CORS_MODE,
  });
};

export const deleteProcessorSchema = (processor_name: string) => {
  return fetch(BACKEND_URL + `/delete_processor/${processor_name}`, {
    method: "POST",
    mode: CORS_MODE,
  });
};

export const rotateRecordImages = (
  recordId: string,
  selectedImageIndices: number[],
  rotationDegrees: number,
  recordGroupId: string
) => {
  return fetch(BACKEND_URL + `/rotate_images/${recordId}`, {
    method: "POST",
    mode: CORS_MODE,
    body: JSON.stringify({
      selectedImageIndices,
      rotationDegrees,
      recordGroupId,
    }),
    headers: JSON_HEADERS,
  });
};
