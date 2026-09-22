import { useState, useEffect, useRef } from "react";
import { useUserContext } from "../../usercontext";
import { Alert, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Subheader from "../../components/Subheader/Subheader";
import { callAPI } from "../../util";
import {
  getCleaningFunctions,
  getSchema,
  createSchema,
  updateProcessorAttribute,
  uploadProcessorSchema,
} from "../../services/app.service";
import SchemaTable from "../../components/SchemaTable/SchemaTable";
import { SchemaOverview, MongoProcessor, SchemaField } from "../../types";
import UploadProcessorDialog from "../../components/UploadProcessorDialog/UploadProcessorDialog";
import ErrorBar from "../../components/ErrorBar/ErrorBar";
import SchemaImportDialog from "../../components/SchemaImportDialog/SchemaImportDialog";

const SchemaView = () => {
  const navigate = useNavigate();
  const { hasPermission} = useUserContext();
  const [showUploadProcessor, setShowUploadProcessor] = useState(false);
  const [showRepoImport, setShowRepoImport] = useState(false);
  const [schemaData, setSchemaData] = useState<SchemaOverview>();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updateProcessorCSV, setUpdateProcessorCSV] = useState<MongoProcessor>();
  const [cleaningFunctions, setCleaningFunctions] = useState<string[]>([]);
  const saving = useRef(false);
  const canEdit = schemaData?.read_only === false && hasPermission("manage_schema");


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

  const fetchedSchema = (schema: SchemaOverview) => {
    setSchemaData(schema);
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

  const updateProcessorAttributeInState = (
    processorName: string,
    fieldName: string,
    updates: Record<string, string | number | null>,
    operation: "update" | "add" | "delete" = "update",
    schemaId?: string
  ) => {
    setSchemaData((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        processors: prev.processors.map((processor) => {
          if (schemaId ? processor.schema_id !== schemaId : processor.name !== processorName) return processor;

          if (operation === "add") {
            const newAttribute = Object.entries(updates).reduce<SchemaField>(
              (acc, [key, value]) => {
                if (value !== null && value !== "") {
                  (acc as unknown as Record<string, string | number | undefined>)[key] = value;
                }
                return acc;
              },
              {} as SchemaField
            );

            return {
              ...processor,
              attributes: [...(processor.attributes || []), newAttribute],
            };
          }

          if (operation === "delete") {
            return {
              ...processor,
              attributes: processor.attributes?.filter(
                (attribute) => attribute.name !== fieldName && !attribute.name.startsWith(`${fieldName}::`)
              ),
            };
          }

          return {
            ...processor,
            attributes: processor.attributes?.map((attribute) => {
              if (attribute.name !== fieldName) return attribute;
              const nextAttribute = { ...attribute } as SchemaField;
              const mutableAttribute = nextAttribute as unknown as Record<string, string | number | undefined>;

              Object.entries(updates).forEach(([key, value]) => {
                if (value === null || value === "") {
                  delete nextAttribute[key as keyof typeof nextAttribute];
                } else {
                  mutableAttribute[key] = value;
                }
              });

              return nextAttribute;
            }),
          };
        }),
      };
    });
  };

  const handleAttributeChange = async (
    processorName: string,
    fieldName: string,
    updates: Record<string, string | number | null>,
    operation: "update" | "add" | "delete" = "update",
    schemaId?: string
  ): Promise<boolean> => {
    if (!canEdit || saving.current) return false;
    saving.current = true;
    setUpdating(true);
    setErrorMsg(null);
    let succeeded = false;
    await callAPI(
      updateProcessorAttribute,
      [processorName, fieldName, updates, operation, schemaId],
      () => {
        updateProcessorAttributeInState(processorName, fieldName, updates, operation, schemaId);
        succeeded = true;
      },
      (error: string) => setErrorMsg(`Failed to update schema field: ${error}`)
    );
    saving.current = false;
    setUpdating(false);
    return succeeded;
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

  const handleUploadDocument = async (
    file: File | null,
    name: string,
    displayName: string,
    processorId: string,
    modelId: string,
    documentType: string
  ) => {
    if (!canEdit || saving.current) return false;
    saving.current = true;
    const formData = new FormData();
    if (file) formData.append("file", file, file.name);
    setUpdating(true);
    setErrorMsg(null);
    let succeeded = false;
    await callAPI(
      file ? uploadProcessorSchema : createSchema,
      file ? [formData, name, displayName, processorId, modelId, documentType, undefined, updateProcessorCSV?.schema_id, updateProcessorCSV?.parser_type]
        : [{ name, displayName, processorId: processorId || null, modelId: modelId || null, documentType, attributes: [] }],
      () => { succeeded = true; },
      (error: string) => setErrorMsg(`Failed to upload schema: ${error}`)
    );
    if (succeeded) {
      await callAPI(getSchema, [], fetchedSchema, handleError);
      setUpdateProcessorCSV(undefined);
    }
    saving.current = false;
    setUpdating(false);
    return succeeded;
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
        buttonName={canEdit ? "Create schema" : undefined}
        handleClickButton={() => setShowUploadProcessor(true)}
        actions={canEdit ? { "Import repo schemas": () => setShowRepoImport(true) } : undefined}
      />
      <Box sx={styles.innerBox}>
        {schemaData && <Alert severity="info" sx={{ mb: 2 }}>
          {schemaData.source === "repo"
            ? "Repo schemas are read-only. To enable editable, database-backed schemas, set USE_DB_PROCESSORS=true on the backend."
            : null}
        </Alert>}
        <SchemaTable
          schema={schemaData}
          loading={loading}
          cleaningFunctions={cleaningFunctions}
          onAttributeChange={handleAttributeChange}
          setErrorMessage={setErrorMsg}
          clickUpdateFields={clickUpdateFields}
          updating={updating}
        />
      </Box>
      {
        showUploadProcessor && canEdit &&
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
      {showRepoImport && canEdit && <SchemaImportDialog onClose={() => setShowRepoImport(false)} onApplied={() => callAPI(getSchema, [], fetchedSchema, handleError)} />}

    </Box>
  );
};

export default SchemaView;
