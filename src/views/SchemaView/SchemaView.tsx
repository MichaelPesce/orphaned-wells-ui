import { useState, useEffect } from "react";
import { useUserContext } from "../../usercontext";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Subheader from "../../components/Subheader/Subheader";
import { callAPI } from "../../util";
import { getSchema, uploadProcessorSchema } from "../../services/app.service";
import SchemaTable from "../../components/SchemaTable/SchemaTable";
import { SchemaOverview, MongoProcessor } from "../../types";
import UploadProcessorDialog from "../../components/UploadProcessorDialog/UploadProcessorDialog";
import ErrorBar from "../../components/ErrorBar/ErrorBar";

const SchemaView = () => {
  const navigate = useNavigate();
  const { userPermissions} = useUserContext();
  const [showUploadProcessor, setShowUploadProcessor] = useState(false);
  const [schemaData, setSchemaData] = useState<SchemaOverview>();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updateProcessorCSV, setUpdateProcessorCSV] = useState<MongoProcessor>();


  useEffect(() => {
    const hasAccess = userPermissions?.includes("manage_schema");
    if (!hasAccess) navigate("/");
    callAPI(
      getSchema,
      [],
      fetchedSchema,
      handleError
    );
        
  }, [userPermissions]);

  const fetchedSchema = (processors: MongoProcessor[]) => {
    setSchemaData({
      processors: processors
    });
    setLoading(false);
  };

  const handleError = (e: string) => {
    setErrorMsg(`Error: ${e}`);
    setLoading(false);
  };

  const styles = {
    outerBox: {
      backgroundColor: "#F5F5F6",
      height: "100vh",
    },
    innerBox: {
      paddingY: 5,
      paddingX: 5,
    },
  };

  const handleUploadDocument = (
    file: File,
    name: string,
    displayName: string,
    processorId: string,
    modelId: string,
    documentType: string
  ) => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    setUpdating(true);
    callAPI(
      uploadProcessorSchema,
      [formData, name, displayName, processorId, modelId, documentType],
      successfulUpload,
      failedUpload,
    );
  };

  const successfulUpload = (data: any) => {
    setUpdating(false);
    setUpdateProcessorCSV(undefined);
    callAPI(
      getSchema,
      [],
      fetchedSchema,
      handleError
    );
  };

  const failedUpload = (data: any) => {
    setUpdating(false);
    setUpdateProcessorCSV(undefined);
    setErrorMsg(`Failed to upload: ${data}`);
  };

  const clickUpdateFields = (proc: MongoProcessor) => {
    setUpdateProcessorCSV(proc);
    setShowUploadProcessor(true);
  };

  const handleCloseUploadDialog = () => {
    setUpdateProcessorCSV(undefined);
    setShowUploadProcessor(false);
  };

  return (
    <Box sx={styles.outerBox}>
      <Subheader
        currentPage="Schema"
        buttonName={"Upload Processor"}
        handleClickButton={() => setShowUploadProcessor(true)}
      />
      <Box sx={styles.innerBox}>
        <SchemaTable 
          schema={schemaData} 
          loading={loading}
          setErrorMessage={setErrorMsg}
          clickUpdateFields={clickUpdateFields}
          updating={updating}
        />
      </Box>
      {
        showUploadProcessor && 
                <UploadProcessorDialog
                  handleUploadDocument={handleUploadDocument}
                  onClose={handleCloseUploadDialog}
                  updatingProcessor={updateProcessorCSV}
                />
      }
      <ErrorBar
        errorMessage={errorMsg}
        setErrorMessage={setErrorMsg}
      />
            
    </Box>
  );
};

export default SchemaView;