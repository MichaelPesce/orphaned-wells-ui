/*
objects
*/
export interface RecordData {
    _id: string;
    name: string;
    filename: string;
    project_id: string;
    project_name: string;
    record_group_id: string;
    attributesList: Array<any>;
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
    rank?: number; // index of record based on current sorting, filtering
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
    _id: string;
    attributes: any[];
    name: string;
    processor_id: string;
    processorId: string;
    settings?: any;
    description?: string;
    documentType?: string;
    state?: string;
    creator?: User;
    dateCreated?: number;
    reviewed_amt?: number;
    total_amt?: number;
    error_amt?: number;
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
    name?: number;
    last_updated?: number;
}

export interface SchemaField {
    name: string;
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
    "name": string;
    "processorId": string;
    "modelId": string;
    "lastUpdated": string;
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

export interface User {
    email: string;
    name: string;
    picture: string;
    hd: string;
    roles: string[];
    user_info?: any;
    permissions?: any;
    default_team: string;
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
    handleClickField: handleClickFieldSignature;
    handleChangeValue: handleChangeValueSignature;
    fullscreen: string | null;
    displayKeyIndex: number;
    displayKeySubattributeIndex: number | null;
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
}

export interface RecordsTableProps {
    location: string;
    params: any;
    handleUpdate: (update: any) => void;
    filter_options?: {[key: string]: FilterOption};
    recordGroups?: RecordGroup[];
}

export interface PopupModalProps {
    width?: number;
    open: boolean;
    handleClose: () => void;
    textLabel?: string;
    text: string | null | undefined;
    handleEditText?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleSave: () => void;
    buttonVariant: 'text' | 'outlined' | 'contained';
    buttonColor: "inherit" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
    buttonText: string;
    input?: boolean;
    showError?: boolean;
    errorText?: string;
    iconOne?: React.ReactNode;
    iconTwo?: React.ReactNode;
    hasTwoButtons?: boolean;
    handleButtonTwoClick?: () => void;
    buttonTwoVariant?: 'text' | 'outlined' | 'contained';
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
    setShowModal: (show: boolean) => void;
    handleUploadDocument: (
        file: File,
        name: string,
        displayName: string,
        processorId: string,
        modelId: string,
        documentType: string
    ) => void;
}

export interface UploadDirectoryProps {
    setShowModal: (show: boolean) => void;
    directoryFiles: File[];
    directoryName: string;
    runCleaningFunctions: boolean;
    setRunCleaningFunctions: (show: boolean) => void;
    uploading: boolean;
    setUploading: (show: boolean) => void;
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
}

export interface CheckboxesGroupProps {
    columns: string[];
    selected: string[];
    setSelected: (selected: string[]) => void;
    disabled?: boolean;
}

export interface ExportTypeSelectionProps {
    exportTypes: { [key: string]: boolean };
    updateExportTypes: (exportType: string) => void;
    disabled?: boolean;
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
    ): void;
}

export interface updateFieldCoordinatesSignature {
    (
        fieldId: FieldID,
        new_coordinates: number[][],
        pageNumber: number,
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