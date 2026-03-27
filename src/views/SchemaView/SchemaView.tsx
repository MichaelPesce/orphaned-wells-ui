import { useState, useEffect } from "react";
import { useUserContext } from "../../usercontext";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Subheader from "../../components/Subheader/Subheader";
import { callAPI } from "../../util";
import {
  getCleaningFunctions,
  getSchema,
  updateProcessorAttribute,
  uploadProcessorSchema,
} from "../../services/app.service";
import SchemaTable from "../../components/SchemaTable/SchemaTable";
import { SchemaOverview, MongoProcessor } from "../../types";
import UploadProcessorDialog from "../../components/UploadProcessorDialog/UploadProcessorDialog";
import ErrorBar from "../../components/ErrorBar/ErrorBar";

const SchemaView = () => {
  const navigate = useNavigate();
  const { hasPermission} = useUserContext();
  const [showUploadProcessor, setShowUploadProcessor] = useState(false);
  const [schemaData, setSchemaData] = useState<SchemaOverview>();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updateProcessorCSV, setUpdateProcessorCSV] = useState<MongoProcessor>();
  const [cleaningFunctions, setCleaningFunctions] = useState<string[]>([]);


  useEffect(() => {
    const hasAccess = hasPermission("manage_schema");
    if (!hasAccess) {
      navigate("/");
      return;
    }
    callAPI(
      getSchema,
      [],
      fetchedSchema,
      handleError
    );
    callAPI(
      getCleaningFunctions,
      [],
      fetchedCleaningFunctions,
      handleError
    );
        
  }, [hasPermission, navigate]);

  const fetchedSchema = (processors: MongoProcessor[]) => {
    setSchemaData({
      processors: processors
    });
    setLoading(false);
  };

  const fetchedCleaningFunctions = (
    data: { cleaning_functions?: string[] }
  ) => {
    setCleaningFunctions(data.cleaning_functions || []);
  };

  const handleError = (e: string) => {
    setErrorMsg(`Error: ${e}`);
    setLoading(false);
  };

  const updateCleaningFunctionInState = (
    processorName: string,
    fieldName: string,
    cleaningFunction: string
  ) => {
    setSchemaData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        processors: prev.processors.map((processor) => {
          if (processor.name !== processorName) return processor;

          return {
            ...processor,
            attributes: processor.attributes?.map((attribute) => {
              if (attribute.name !== fieldName) return attribute;
              return {
                ...attribute,
                cleaning_function: cleaningFunction || undefined,
              };
            }),
          };
        }),
      };
    });
  };

  const handleCleaningFunctionChange = (
    processorName: string,
    fieldName: string,
    cleaningFunction: string
  ) => {
    const previousCleaningFunction = schemaData?.processors
      ?.find((processor) => processor.name === processorName)
      ?.attributes?.find((attribute) => attribute.name === fieldName)
      ?.cleaning_function || "";

    updateCleaningFunctionInState(processorName, fieldName, cleaningFunction);
    setUpdating(true);
    callAPI(
      updateProcessorAttribute,
      [
        processorName,
        fieldName,
        { cleaning_function: cleaningFunction || null },
      ],
      () => {
        setUpdating(false);
      },
      (e: string) => {
        updateCleaningFunctionInState(
          processorName,
          fieldName,
          previousCleaningFunction
        );
        setUpdating(false);
        setErrorMsg(`Failed to update cleaning function: ${e}`);
      }
    );
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
          cleaningFunctions={cleaningFunctions}
          onCleaningFunctionChange={handleCleaningFunctionChange}
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
