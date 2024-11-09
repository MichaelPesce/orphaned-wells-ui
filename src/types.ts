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
    recordIndex?: number;
    review_status?: string;
    notes?: string | null;
    dateCreated: number;
    status: string;
    previous_id?: string;
    next_id?: string;
}

export interface ProjectData {
    _id: string;
    name: string;
    record_groups: RecordGroup[]
    settings?: any;
    state?: string;
    creator?: {
      name?: string;
      email?: string;
    };
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
    creator?: {
      name?: string;
      email?: string;
    };
    dateCreated?: number;
    reviewed_amt?: number;
    total_amt?: number;
}

export interface Attribute {
    name: string;
    key: string;
    value: string;
    confidence: number | null;
    edited?: boolean;
    normalized_vertices: number[][] | null;
    subattributes?: Attribute[];
}

export interface Processor {
    id: string;
    displayName: string;
    img: string;
    documentType: string;
    state: string;
    attributes: Attribute[];
    processor_id: string;
    name: string;
}

export interface FilterOption {
    key: string;
    displayName: string;
    type: string;
    operator: string;
    options?: { name: string; checked: boolean, value: string }[];
    selectedOptions?: string[];
    value?: string;
}

export interface User {
    email: string,
    name: string,
    picture: string,
    hd: string,
    role: number,
    user_info?: any
  }

export interface PreviousPages {
    [key: string]: () => void;
}

export interface TableColumns {
    displayNames: string[];
    keyNames: string[];
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
    handleUpdateRecord: DocumentContainerProps["handleUpdateRecord"];
    locked?: boolean;
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
    handleUploadDocument: (file: File) => void;
}

export interface BottombarProps {
    recordData: RecordData;
    onPreviousButtonClick: () => void;
    onNextButtonClick: () => void;
    onReviewButtonClick: () => void;
    handleUpdateReviewStatus: (status: string) => void;
    promptResetRecord: () => void;
    locked?: boolean;
}

export interface DocumentContainerProps {
    imageFiles: string[];
    attributesList: any[];
    handleChangeValue: handleChangeValueSignature;
    handleUpdateRecord: (key: string, value: string) => void;
    locked?: boolean;
}

export interface ColumnSelectDialogProps {
    open: boolean;
    onClose: () => void;
    location: string;
    handleUpdate: (update: any) => void;
    _id: string;
}

export interface CheckboxesGroupProps {
    columns: string[];
    selected: string[];
    setSelected: (selected: string[]) => void;
    exportType: string;
    setExportType: (exportType: string) => void;
}

export interface ErrorBarProps {
    setOpen: (open: boolean) => void;
    duration?: number;
    margin?: boolean;
    severity?: "error" | "warning" | "info" | "success";
    errorMessage: string;
  }


/*
functions
*/
export interface handleChangeValueSignature {
    (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, 
        index: number, 
        isSubattribute?: boolean, 
        subIndex?: number
    ): void;
}

export interface handleClickFieldSignature {
    (
        key: string, 
        vertices: number[][] | null, 
        index: number, 
        isSubattribute: boolean, 
        subattributeIdx: number | null
    ): void;
}