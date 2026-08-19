import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { getRecordGroup, uploadDocument, deleteRecordGroup, deleteRecordGroupRecords, updateRecordGroup, cleanRecords } from "../../services/app.service";
import RecordsTable from "../../components/RecordsTable/RecordsTable";
import Subheader from "../../components/Subheader/Subheader";
import UploadDocumentsModal from "../../components/UploadDocumentsModal/UploadDocumentsModal";
import JsonImportDialog from "../../components/JsonImportDialog/JsonImportDialog";
import ConnectProcessorDialog from "../../components/ConnectProcessorDialog/ConnectProcessorDialog";
import PopupModal from "../../components/PopupModal/PopupModal";
import ErrorBar from "../../components/ErrorBar/ErrorBar";
import DeleteRecordGroupRecordsDialog from "./DeleteRecordGroupRecordsDialog";
import { callAPI, convertFiltersToMongoFormat } from "../../util";
import { RecordGroup, ProjectData, PreviousPages, SubheaderActions, FilterOption, JsonImportResponse } from "../../types";
import { useUserContext } from "../../usercontext";

const RecordGroupPage = () => {
  const params = useParams<{ id: string }>(); 
  const navigate = useNavigate();
  const { userEmail, hasPermission} = useUserContext();
  const [project, setProject] = useState({} as ProjectData);
  const [recordGroup, setRecordGroup] = useState<RecordGroup>({ } as RecordGroup);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showJsonImportDialog, setShowJsonImportDialog] = useState(false);
  const [showConnectProcessorDialog, setShowConnectProcessorDialog] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openDeleteRecordsModal, setOpenDeleteRecordsModal] = useState(false);
  const [openCleanPrompt, setOpenCleanPrompt] = useState(false);
  const [openUpdateNameModal, setOpenUpdateNameModal] = useState(false);
  const [recordGroupName, setRecordGroupName] = useState("");
  const [recordFilters, setRecordFilters] = useState<FilterOption[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>("");
  const [ subheaderActions, setSubheaderActions ] = useState<SubheaderActions>();
  const [navigation, setNavigation] = useState<PreviousPages>({"Projects": () => navigate("/projects", { replace: true })});
  const [deletingRecords, setDeletingRecords] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadRecordGroup();
    }
  }, [params.id]);

  useEffect(() => {
    let temp_navigation: PreviousPages = { 
      "Projects": () => navigate("/projects", { replace: true })
    };
    temp_navigation[project.name] = () => navigate("/project/"+project._id, { replace: true });
    setNavigation(temp_navigation);
  }, [project]);

  useEffect(() => {
    let tempActions = {} as SubheaderActions;
    const hasProcessor = Boolean(recordGroup.processorId);
    const hasSchema = hasProcessor || Boolean(recordGroup.attributes?.length);
    if (hasPermission("manage_project")) {
      tempActions["Change record group name"] = handleClickChangeName;
    }
    if (hasPermission("create_record_group")) {
      tempActions["Connect processor"] = () => setShowConnectProcessorDialog(true);
    }
    if (hasPermission("upload_document")) {
      tempActions["Import JSON/CSV records"] = () => setShowJsonImportDialog(true);
    }
    if (hasPermission("clean_record") && hasSchema) {
      tempActions["Clean records"] = () => setOpenCleanPrompt(true);
    }
    if (hasPermission("delete")) {
      tempActions["Delete records"] = () => setOpenDeleteRecordsModal(true);
      tempActions["Delete record group"] = () => setOpenDeleteModal(true);
    }
    setSubheaderActions(tempActions);
  }, [hasPermission, recordGroup.processorId, recordGroup.attributes]);

  const styles = {
    outerBox: {
      backgroundColor: "#F5F5F6",
      height: "100vh"
    },
    innerBox: {
      paddingY: 5,
      paddingX: 5,
    },
  };

  const loadRecordGroup = () => {
    callAPI(
      getRecordGroup,
      [params.id],
      gotRecordGroup,
      handleAPIErrorResponse
    );
  };

  const gotRecordGroup = (data: {project: any, rg_data: any}) => {
    setRecordGroup(data.rg_data);
    setRecordGroupName(data.rg_data.name);
    setProject(data.project);
  }; 

  const handleUploadDocument = (file: File, runCleaningFunctions: boolean = false, refresh: boolean = true) => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    return callAPI(
      uploadDocument,
      [formData, recordGroup._id, userEmail, false, false, runCleaningFunctions],
      () => handleSuccessfulDocumentUpload(refresh),
      handleAPIErrorResponse
    );
  };

  const handleSuccessfulDocumentUpload = (refresh: boolean = true) => {
    if (refresh) {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } else console.log("finished upload");
        
  };

  const handleSuccessfulJsonImport = (response: JsonImportResponse) => {
    setShowJsonImportDialog(false);
    window.location.reload();
  };

  const handleSuccessfulProcessorConnection = (updatedRecordGroup: RecordGroup) => {
    setRecordGroup(updatedRecordGroup);
    setShowConnectProcessorDialog(false);
  };

  const handleClickChangeName = () => {
    setOpenUpdateNameModal(true);
  };

  const handleDeleteRecordGroup = () => {
    setOpenDeleteModal(false);
    callAPI(
      deleteRecordGroup,
      [recordGroup._id],
      (data: any) => navigate("/project/"+project._id, { replace: true }),
      handleAPIErrorResponse
    );
  };

  const handleDeleteRecordGroupRecords = (filter: object) => {
    const recordGroupId = recordGroup._id || params.id;
    if (!recordGroupId) return;

    setOpenDeleteRecordsModal(false);
    setDeletingRecords(true);
    callAPI(
      deleteRecordGroupRecords,
      [recordGroupId, { filter }],
      () => window.location.reload(),
      handleAPIErrorResponse
    );
  };

  const handleDeleteAllRecords = () => {
    handleDeleteRecordGroupRecords({});
  };

  const handleDeleteFilteredRecords = () => {
    handleDeleteRecordGroupRecords(convertFiltersToMongoFormat(recordFilters));
  };

  const handleChangeRecordGroupName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRecordGroupName(event.target.value);
  };

  const handleUpdateRecordGroupName = () => {
    setOpenUpdateNameModal(false);
    callAPI(
      updateRecordGroup,
      [params.id, { name: recordGroupName }],
      (data: any) => window.location.reload(),
      handleAPIErrorResponse
    );
  };

  const handleUpdateRecordGroup = (update: any) => {
    callAPI(
      updateRecordGroup,
      [params.id, update],
      (data: RecordGroup) => setRecordGroup(data),
      handleAPIErrorResponse
    );
  };

  const handleAPIErrorResponse = (e: string) => {
    setDeletingRecords(false);
    setErrorMsg(e);
  };

  const runCleaningFunctions = () => {
    callAPI(
      cleanRecords,
      ["record_group", params.id],
      handleSuccessfulClean,
      handleAPIErrorResponse
    );
  };

  const handleSuccessfulClean = () => {
    setOpenCleanPrompt(false);
    window.location.reload();
  };

  const hasProcessor = Boolean(recordGroup.processorId);
  const canUploadRecords = hasPermission("upload_document") && Boolean(recordGroup._id);
  const primaryButtonName = canUploadRecords
    ? hasProcessor
      ? "Upload new record(s)"
      : "Import JSON/CSV records"
    : undefined;
  const handlePrimaryButtonClick = () => {
    if (hasProcessor) setShowDocumentModal(true);
    else setShowJsonImportDialog(true);
  };

  return (
    <Box sx={styles.outerBox}>
      <Subheader
        currentPage={recordGroup.name}
        buttonName={primaryButtonName}
        handleClickButton={handlePrimaryButtonClick}
        actions={subheaderActions}
        previousPages={navigation}
      />
      <Box sx={styles.innerBox}>
        <RecordsTable
          location="record_group"
          params={params}
          handleUpdate={handleUpdateRecordGroup}
          onFiltersChange={setRecordFilters}
          disabled={deletingRecords}
          disabledMessage="Deleting records..."
        />
      </Box>
      {showDocumentModal && 
                <UploadDocumentsModal 
                  setShowModal={setShowDocumentModal}
                  handleUploadDocument={handleUploadDocument}
                />
      }
      <JsonImportDialog
        open={showJsonImportDialog}
        mode="append_records"
        recordGroupId={recordGroup._id || params.id}
        onClose={() => setShowJsonImportDialog(false)}
        onImported={handleSuccessfulJsonImport}
        setErrorMsg={setErrorMsg}
      />
      <ConnectProcessorDialog
        open={showConnectProcessorDialog}
        recordGroup={recordGroup}
        onClose={() => setShowConnectProcessorDialog(false)}
        onConnected={handleSuccessfulProcessorConnection}
        setErrorMsg={setErrorMsg}
      />
      <PopupModal
        open={openDeleteModal}
        handleClose={() => setOpenDeleteModal(false)}
        text="Are you sure you want to delete this record group?"
        handleSave={handleDeleteRecordGroup}
        buttonText='Delete'
        buttonColor='error'
        buttonVariant='contained'
        width={400}
      />
      <PopupModal
        open={openCleanPrompt}
        handleClose={() => setOpenCleanPrompt(false)}
        text="Are you sure you want to clean all the records in this record group?"
        handleSave={runCleaningFunctions}
        buttonText='Clean Records'
        buttonColor='primary'
        buttonVariant='contained'
        width={400}
      />
      <DeleteRecordGroupRecordsDialog
        open={openDeleteRecordsModal}
        onClose={() => setOpenDeleteRecordsModal(false)}
        onDeleteAll={handleDeleteAllRecords}
        onDeleteFiltered={handleDeleteFilteredRecords}
      />
      <PopupModal
        input
        open={openUpdateNameModal}
        handleClose={() => setOpenUpdateNameModal(false)}
        text={recordGroupName}
        textLabel='Record group Name'
        handleEditText={handleChangeRecordGroupName}
        handleSave={handleUpdateRecordGroupName}
        buttonText='Update'
        buttonColor='primary'
        buttonVariant='contained'
        width={400}
      />
      <ErrorBar
        errorMessage={errorMsg}
        setErrorMessage={setErrorMsg}
      />
    </Box>
  );
};

export default RecordGroupPage;
