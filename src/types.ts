/*
objects
*/
export interface RecordData {
    has_schema?: boolean;
    attribute_revision?: string;
    _id: string;
    name: string;
    filename: string;
    project_id: string;
    project_name: string;
    record_group_id: string;
    attributesList: Array<any>;
    image_files?: Array<string>;
    img_urls: Array<string>;
    dateCreated: number;
    status: string;
    api_number: number | null;
    record_notes?: RecordNote[];
    previous_id?: string;
    next_id?: string;
    review_status?: string;
    notes?: string | null;
    verification_status?: string;
    lastUpdated?: number;
    lastUpdatedBy?: string;
    has_errors?: boolean;
    section?: string;
    township?: string;
    range?: string;
    error_message?: string;
    rank?: number; // index of record based on current sorting, filtering
    record_number?: number;
    image_whitespace?: WhitespaceDetectionResult[];
}

export interface ProjectData {
    _id: string;
    name: string;
    record_groups: RecordGroup[]
    settings?: any;
    state?: string;
    creator?: User;
    dateCreated?: number;
}

export interface RecordGroup {
    schema_id?: string | null;
    active_schema_id?: string | null;
    schema_source?: "database" | "repo";
    schema_name?: string | null;
    schema_error?: string | null;
    has_schema?: boolean;
    can_process?: boolean;
    _id: string;
    attributes?: any[];
    name: string;
    processorId?: string | null;
    settings?: any;
    description?: string;
    documentType?: string;
    source_type?: string;
    state?: string;
    creator?: User;
    dateCreated?: number;
    reviewed_amt?: number;
    total_amt?: number;
    error_amt?: number;
}

export interface JsonImportResponse {
    record_group_id: string;
    created_record_ids: string[];
    requested_count?: number;
    created_count: number;
    skipped_duplicates: string[];
    skipped_duplicate_count: number;
    existing_duplicate_count?: number;
    internal_duplicate_count?: number;
    duplicate_filename_bases_in_file?: Record<string, number>;
}

export interface JsonImportPreviewResponse {
    record_count: number;
    requested_count: number;
    importable_count: number;
    existing_duplicates: Array<{
        index: number;
        filename: string;
        filename_base: string;
        name: string;
    }>;
    existing_duplicate_count: number;
    internal_duplicates: Array<{
        index: number;
        filename: string;
        filename_base: string;
        name: string;
    }>;
    internal_duplicate_count: number;
    skipped_duplicates: string[];
    skipped_duplicate_count: number;
    duplicate_filename_bases_in_file: Record<string, number>;
    duplicate_filename_base_count_in_file: number;
    prevent_duplicates: boolean;
}

export interface RecordImageUploadResponse {
    record_id: string;
    image_files: string[];
    img_urls: string[];
}

export interface SchemaMeta {
    schema_name: string;
    use_airtable: boolean;
    AIRTABLE_API_TOKEN?: string;
    AIRTABLE_BASE_ID?: string;
    AIRTABLE_IFRAME_VIEW_ID?: string;
}

export interface SchemaOverview {
    processors: MongoProcessor[];
    source: "database" | "repo";
    read_only: boolean;
    name?: number;
    last_updated?: number;
}

export interface RepoSchemaSource {
    package: string;
    version: string;
    collaborator: string;
}

export interface SchemaImportGroup {
    id: string;
    name: string;
    team?: string;
}

export interface SchemaImportDiff {
    added: string[];
    retired: string[];
    changed: { name: string; before: SchemaField; after: SchemaField }[];
    metadata: { name: string; before: unknown; after: unknown }[];
}

export interface SchemaImportDecision {
    action: "keep" | "replace";
    schema_id: string;
}

export interface SchemaImportRequest {
    mode: "add" | "replace";
    selected: string[];
    decisions: Record<string, SchemaImportDecision>;
}

export interface SchemaImportEntry {
    source_id: string;
    name: string;
    action: "added" | "updated" | "unchanged" | "kept" | "conflict";
    schema_id?: string;
    groups: SchemaImportGroup[];
    diff?: SchemaImportDiff;
    candidates: { schema_id: string; name: string; diff: SchemaImportDiff; groups: SchemaImportGroup[] }[];
}

export interface SchemaImportPreview {
    import_id: string;
    source: RepoSchemaSource;
    mode: "add" | "replace";
    status: "preview" | "applying" | "partial" | "complete";
    entries: SchemaImportEntry[];
    removed: { schema_id: string; name: string; groups: SchemaImportGroup[] }[];
    affected_groups: SchemaImportGroup[];
    detached_groups: SchemaImportGroup[];
    counts: Record<SchemaImportEntry["action"] | "removed" | "detached", number>;
    can_apply: boolean;
    errors: string[];
    error?: string | null;
    destructive: boolean;
    next_step: number;
    total_steps: number;
}

export interface RepoSchemaImportSource {
    source: RepoSchemaSource;
    schemas: { source_id: string; name: string; field_count?: number; error?: string }[];
    pending_import?: SchemaImportPreview | null;
    busy: boolean;
    error?: string;
}

export interface SchemaField {
    name: string;
    alias?: string;
    data_type?: string;
    google_data_type?: string;
    database_data_type?: string;
    cleaning_function?: string;
    accepted_range?: string;
    field_specific_notes?: string;
    grouping?: string;
    model_enabled?: string;
    occurrence?: string;
    page_order_sort?: number;
}

export interface RecordSchema {
    [key: string]: SchemaField;
}

export interface Attribute {
    deleted?: boolean;
    name: string;
    key: string;
    value: string | boolean | number | null;
    raw_text: string;
    normalized_value: string | boolean | number | Date;
    uncleaned_value?: string;
    cleaned?: boolean;
    cleaning_error?: boolean;
    confidence: number | null;
    edited?: boolean;
    normalized_vertices: number[][] | null;
    subattributes?: Attribute[];
    lastUpdated?: number; // timestamp in milliseconds
    lastUpdatedBy?: string;
    last_cleaned?: number; // timestamp in seconds
    user_added?: boolean;
    topLevelAttribute?: string;
    user_provided_coordinates?: number[][];
    alias?: string | null;
    parentAttribute?: string;
    page?: number;
}

export interface WhitespaceDetectionResult {
    whitespace_pct: number;
    ink_pct: number;
    total_pixels: number;
    white_pixels: number;
    threshold: number;
    min_whitespace_pct: number;
    meets_threshold: boolean;
    is_mostly_whitespace: boolean;
    error?: string | null;
}

export interface RepoProcessor {
    "Processor Name": string;
    "Model Name": string;
    "Processor ID": string;
    "Model ID": string;
    "lastUpdated": string;
    "img"?: string;
    "documentType"?: string;
    "displayName"?: string;
    "attributes"?: Attribute[];
}

export interface MongoProcessor {
    schema_id?: string;
    parser_type?: "custom" | "form_parser" | null;
    can_process?: boolean;
    created_by?: string | null;
    created_by_team?: string | null;
    "name": string;
    "processorId"?: string | null;
    "modelId"?: string | null;
    "lastUpdated"?: string;
    "img"?: string;
    "documentType"?: string;
    "displayName"?: string;
    "attributes"?: SchemaField[];
}

export interface FilterOption {
    key: string;
    displayName: string;
    type: string;
    operator: string;
    options?: { name: string; checked: boolean, value: string | null }[];
    selectedOptions?: string[]; // this is a list of the (default) selection option NAMES
    value?: string;
}

export type RoleCategory = "system" | "team";

export interface RoleDefinition {
    id: string;
    name: string;
    permissions: string[];
    includes?: string[];
    category: RoleCategory;
}

export interface UserRoleAssignments {
    system?: string[];
    team?: Record<string, string[]>;
}

export interface UpdateUserRolesRequest {
    role_category: RoleCategory;
    new_roles: string[];
    email: string;
}

export interface UpdateRolePermissionsRequest {
    role_id: string;
    category: RoleCategory;
    permissions: string[];
}

export interface User {
    email: string;
    name: string;
    picture: string;
    hd: string;
    roles: UserRoleAssignments;
    user_info?: any;
    permissions?: any;
    default_team: string;
    collaborator?: string;
}

export interface ChangeTeamRequest {
    new_team: string;
}

export interface ChangeTeamResponse {
    team: string;
    created_team: boolean;
    added_to_team: boolean;
}

export interface ChangeCollaboratorRequest {
    new_collaborator: string;
}

export interface ChangeCollaboratorResponse {
    collaborator: string;
}

export interface RecordNote {
    text: string;
    record_id: string;
    isReply: boolean;
    resolved: boolean;
    timestamp: number;
    deleted?: boolean;
    creator?: string;
    lastUpdated?: number;
    lastUpdatedUser?: number;
    replies?: number[]; // list of indexes of notes that reply to this guy
    repliesTo?: number; // the index that this comment replies to, if this is a reply
}

export interface RecordHistoryItem {
    action: string;
    user?: string | null;
    project_id?: string | null;
    record_group_id?: string | null;
    record_id?: string | null;
    notes?: string | null;
    query?: Record<string, any> | null;
    attributesList_before?: HistoryAttribute[] | Record<string, any> | null;
    attributesList_after?: HistoryAttribute[] | Record<string, any> | null;
    previous_state?: Record<string, any> | null;
    calling_function?: string | null;
    timestamp?: number;
}

export interface HistoryAttribute {
    deleted?: boolean;
    key?: unknown;
    value?: unknown;
    value_numeric_type?: "int" | "float" | null;
    normalized_value?: unknown;
    text_value?: unknown;
    raw_text?: unknown;
    subattributes?: HistoryAttribute[] | null;
}

export interface QuerySummaryLine {
    key: string;
    previousValue?: unknown;
    previousValueNumericType?: "int" | "float" | null;
    currentValue?: unknown;
    currentValueNumericType?: "int" | "float" | null;
}

export interface QuerySummary {
    title: string;
    subtitle?: string;
    lines: QuerySummaryLine[];
}

export interface PreviousPages {
    [key: string]: () => void;
}

export interface TableColumns {
    displayNames: string[];
    keyNames: string[];
}

export interface SubheaderActions {
    [key: string]: () => void;
}

export interface FieldID {
    key: string;
    primaryIndex: number;
    subIndex?: number | null;
    isSubattribute?: boolean;
    parentKey?: string;
    indexes: number[];
}

export interface SchemaRecord {
  id: string;
  fields: { [key: string]: any };
  createdTime: string;
}

export interface Hotkey {
  key: string;
  action: string;
}

export interface HotkeySection {
  label: string;
  hotkeys: Hotkey[];
}

/*
props interfaces
*/
export interface RecordAttributesTableProps {
    attribute_revision?: string;
    handleClickField: handleClickFieldSignature;
    handleChangeValue: handleChangeValueSignature;
    fullscreen: string | null;
    displayIndexes: number[];
    locked?: boolean;
    showRawValues?: boolean;
    recordSchema: RecordSchema;
    forceEditMode: number[];
    insertField: insertFieldSignature;
    handleSuccessfulAttributeUpdate: (data: any) => void;
    showError: (errorMessage: string) => void;
    deleteField: deleteFieldSignature;
    reviewStatus: string;
    setUpdateFieldLocationID: (v?: FieldID) => void;
    parentIndexes: number[];
}

export interface RecordsTableProps {
    location: string;
    params: any;
    handleUpdate: (update: any) => void;
    filter_options?: {[key: string]: FilterOption};
    recordGroups?: RecordGroup[];
    onFiltersChange?: (filters: FilterOption[]) => void;
    disabled?: boolean;
    disabledMessage?: string;
    refreshKey?: number;
    pollWhileIdle?: boolean;
}

export interface RecordsResponse {
    records: RecordData[];
    record_count: number;
    has_active_processing_jobs?: boolean;
}

export interface PopupModalProps {
    width?: number;
    open: boolean;
    handleClose: () => void;
    textLabel?: string;
    text: string | null | undefined;
    handleEditText?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleSave: () => void;
    buttonVariant: "text" | "outlined" | "contained";
    buttonColor: "inherit" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
    buttonText: string;
    input?: boolean;
    showError?: boolean;
    errorText?: string;
    iconOne?: React.ReactNode;
    iconTwo?: React.ReactNode;
    hasTwoButtons?: boolean;
    handleButtonTwoClick?: () => void;
    buttonTwoVariant?: "text" | "outlined" | "contained";
    buttonTwoColor?: "inherit" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
    buttonTwoText?: string;
    disableSubmit?: boolean;
    multiline?: boolean;
    inputrows?: number;
}

export interface SubheaderProps {
    currentPage: string;
    buttonName?: string;
    status?: string;
    verification_status?: string;
    subtext?: string;
    handleClickButton?: () => void;
    disableButton?: boolean;
    previousPages?: Record<string, () => void>;
    actions?: Record<string, () => void> | null;
    locked?: boolean;
}

export interface TableFiltersProps {
    applyFilters: (filters: FilterOption[]) => void;
    appliedFilters: FilterOption[];
    filter_options?: {[key: string]: FilterOption};
}

export interface UploadDocumentsModalProps {
    setShowModal: (show: boolean) => void;
    handleUploadDocument: (file: File, runCleaningFunctions: boolean, refresh?: boolean) => void;
}

export interface UploadProcessorProps {
    onClose: () => void;
    updatingProcessor?: MongoProcessor;
    handleUploadDocument: (
        file: File | null,
        name: string,
        displayName: string,
        processorId: string,
        modelId: string,
        documentType: string
    ) => Promise<boolean>;
}

export interface UploadDirectoryProps {
    directoryFiles: File[];
    directoryName: string;
    runCleaningFunctions: boolean;
    setRunCleaningFunctions: (show: boolean) => void;
    uploading: boolean;
    setUploading: (show: boolean) => void;
    onClose?: () => void;
    processorReady?: boolean;
}

export interface DirectoryUploadConfig {
    mode: "direct" | "legacy" | "unavailable";
    max_files: number;
    max_file_bytes: number;
    max_total_bytes: number;
}

export interface DirectoryUploadFile {
    name: string;
    relative_path: string;
    size: number;
}

export interface DirectoryUploadRequest {
    session_id: string;
    files: DirectoryUploadFile[];
    prevent_duplicates: boolean;
    run_cleaning_functions: boolean;
}

export interface DirectoryUploadSession {
    session_id: string;
    expires_at: number;
    files: (DirectoryUploadFile & {file_id: string; content_type: string})[];
    job?: ProcessingJob;
}

export interface ProcessingJob {
    job_id: string;
    record_group_id: string;
    project_id?: string;
    project_name?: string;
    record_group_name?: string;
    status: "queued" | "dispatched" | "running" | "completed" | "completed_with_errors" | "error";
    created_at: number;
    request_user: {email: string};
    input: {upload_session_id?: string; bucket_name?: string; prefix?: string; upload_expires_at?: number};
    source_type?: "directory" | "gcs";
    file_count?: number | null;
    started_at?: number;
    completed_at?: number;
    last_progress_at?: number;
    stage?: string;
    attempt?: number;
    batches_total: number;
    batches_completed: number;
    summary: {
        total_submitted: number;
        total_succeeded: number;
        total_failed: number;
        total_skipped_duplicates: number;
        failed_document_uris?: string[];
    };
    error?: string;
}

export interface ProcessingJobHistory {
    active_jobs: ProcessingJob[];
    active_count: number;
    jobs: ProcessingJob[];
    count: number;
}

export interface ProcessingHistoryProject {
    id: string;
    name: string;
    record_groups: {id: string; name: string}[];
}

export interface ProcessingJobDetails {
    job: ProcessingJob;
    files: {name: string; source_uri?: string; record_id?: string; status?: string}[];
    file_count: number;
    retry: {allowed: boolean; reason?: string};
}

export interface BottombarProps {
    recordData: RecordData;
    onPreviousButtonClick: () => void;
    onNextButtonClick: () => void;
    onReviewButtonClick: () => void;
    handleUpdateReviewStatus: (status: string, categories?: string[], description?: string) => void;
    handleUpdateVerificationStatus: (verification_status: string, review_status?: string) => void;
    promptResetRecord: () => void;
    locked?: boolean;
}

export interface DocumentContainerProps {
    attribute_revision?: string;
    imageFiles: string[];
    attributesList: any[];
    handleChangeValue: handleChangeValueSignature;
    locked?: boolean;
    recordSchema: RecordSchema;
    forceEditMode: number[];
    insertField: insertFieldSignature;
    handleSuccessfulAttributeUpdate: (data: any) => void;
    showError: (errorMessage: string) => void;
    deleteField: deleteFieldSignature;
    reviewStatus: string;
    updateFieldCoordinates: updateFieldCoordinatesSignature;
    loading: boolean;
    recordStatus?: string;
    errorMessage?: string | null;
    image_whitespace?: WhitespaceDetectionResult[];
    record_group_id?: string;
    setImageFiles: (imageFiles: any[]) => void;
    attributesTableUpdating?: boolean;
    hasRecordImages?: boolean;
    canUploadRecordImages?: boolean;
    onUploadRecordImages?: () => void;
}

export interface ColumnSelectDialogProps {
    open: boolean;
    onClose: () => void;
    location: string;
    handleUpdate: (update: any) => void;
    _id: string;
    appliedFilters: FilterOption[];
    sortBy: string;
    sortAscending: number;
    documentTypes?: string[];
    selectedRecordGroups?: string[];
}

export interface CheckboxesGroupProps {
    columns: string[];
    selected: string[];
    setSelected: (selected: string[]) => void;
    disabled?: boolean;
    docTypeColumns?: { [key: string]: string[] };
    location?: string;
}

export interface ExportTypeSelectionProps {
    exportTypes: { [key: string]: boolean };
    updateExportTypes: (exportType: string) => void;
    disabled?: boolean;
    location?: string;
}

export interface ErrorBarProps {
    errorMessage: string | null;
    setErrorMessage: (v: string | null) => void;
    duration?: number;
    margin?: boolean;
}

export interface RecordNotesDialogProps {
    record_id?: string;
    open: boolean;
    onClose: (record_id?: string, newNotes?: RecordNote[], submitted?: boolean) => void;
}

export interface RecordHistoryDialogProps {
    open: boolean;
    onClose: () => void;
    history: RecordHistoryItem[];
    loading?: boolean;
}

export interface ImageCropperProps {
    image: string;
    displayPoints: number[][] | null;
    disabled: boolean;
    fullscreen: string | null;
    imageIdx: number;
    highlightedImageIdxIndex: number;
    zoomOnToken?: boolean;
    updateFieldLocationID?: FieldID;
    setUpdateFieldLocationID: (v?: FieldID) => void;
    handleUpdateFieldCoordinates: updateFieldCoordinatesSignature;
}


export interface SchemaTableProps {
  records: SchemaRecord[];
}

/*
functions
*/
export interface handleChangeValueSignature {
    (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
        fieldId: FieldID,
    ): void;
}

export interface handleClickFieldSignature {
    (
        fieldID: FieldID, 
        vertices: number[][] | null,
        forceDisplay?: boolean,
    ): void;
}

export interface updateFieldCoordinatesSignature {
    (
        fieldId: FieldID,
        new_coordinates: number[][],
        pageNumber: number,
        callbackFunction?: () => void,
    ): void;
}

export interface insertFieldSignature {
    (
        fieldID: FieldID,
        parentAttribute?: string
    ): void;
}

export interface deleteFieldSignature {
    (
        fieldID: FieldID,
    ): void;
}

export interface HotkeyInfoProps {
  anchorEl: HTMLElement | undefined;
  onClose: () => void;
}

export type AttributesListUpdateTypes = "insertField" | "deleteField" | "updateFieldCoordinates"
