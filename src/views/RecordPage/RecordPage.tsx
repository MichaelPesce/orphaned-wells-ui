import React, { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getRecordData, updateRecord, deleteRecord, cleanRecords } from "../../services/app.service";
import { callAPI, useKeyDown } from "../../util";
import Subheader from "../../components/Subheader/Subheader";
import Bottombar from "../../components/BottomBar/BottomBar";
import DocumentContainer from "../../components/DocumentContainer/DocumentContainer";
import PopupModal from "../../components/PopupModal/PopupModal";
import ErrorBar from "../../components/ErrorBar/ErrorBar";
import { 
  RecordData,
  handleChangeValueSignature,
  insertFieldSignature,
  deleteFieldSignature,
  PreviousPages,
  SubheaderActions,
  RecordSchema,
  Attribute,
  updateFieldCoordinatesSignature,
  FieldID } from "../../types";
import { useUserContext } from "../../usercontext";
import { convertFiltersToMongoFormat } from "../../util";

const Record = () => {
  const [recordData, setRecordData] = useState<RecordData>({} as RecordData);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openCleanPrompt, setOpenCleanPrompt] = useState(false);
  const [openUpdateNameModal, setOpenUpdateNameModal] = useState(false);
  const [recordName, setRecordName] = useState("");
  const [previousPages, setPreviousPages] = useState<PreviousPages>({ "Projects": () => navigate("/projects") });
  const [errorMsg, setErrorMsg] = useState<string | null>("");
  const [showResetPrompt, setShowResetPrompt] = useState(false);
  const [ subheaderActions, setSubheaderActions ] = useState<SubheaderActions>();
  const [ recordSchema, setRecordSchema ] = useState<RecordSchema>();
  const [ forceEditMode, setForceEditMode ] = useState<number[]>([-1, -1]);
  const [ loading, setLoading ] = useState(true);
  const [locked, setLocked] = useState(false);
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, userEmail } = useUserContext();
  const { state } = useLocation();
  const { group_id, location } = state || {};

  const styles = {
    outerBox: {
      backgroundColor: "#F5F5F6",
      height: "100%"
    },
    innerBox: {
      paddingTop: 2,
      paddingBottom: 2,
      paddingX: 5,
    },
    navigationBox: {
      paddingX: 5,
      paddingTop: 2,
      display: "flex",
      justifyContent: "space-between",
    },
    navigationBoxBottom: {
      paddingX: 5,
      paddingBottom: 5,
      display: "flex",
      justifyContent: "space-between",
    },
  };

  useEffect(() => {
    const filterBy = convertFiltersToMongoFormat(JSON.parse(localStorage.getItem("appliedFilters") || "{}")[group_id || ""] || []);
    const sorted = JSON.parse(localStorage.getItem("sorted") || "{}")[group_id || ""] || ["dateCreated", 1];
    const page_state = {
      location: location,
      group_id: group_id,
      filterBy: filterBy,
      sortBy: sorted,
    };
    setLoading(true);
    callAPI(
      getRecordData,
      [params.id, page_state],
      handleSuccessfulFetchRecord,
      handleFailedFetchRecord,
    );
  }, [params.id]);

  useEffect(() => {
    let tempActions = {
      "Change record name": () => setOpenUpdateNameModal(true)
    } as SubheaderActions;
    if (hasPermission("clean_record")) {
      tempActions["Clean record"] = () => setOpenCleanPrompt(true);
      tempActions["Reset record"] = () => setShowResetPrompt(true);
    }
    if (hasPermission("delete")) {
      tempActions["Delete record"] = () => setOpenDeleteModal(true);
    }
    setSubheaderActions(tempActions);
  }, [hasPermission]);

  const handleFailedFetchRecord = (data: any, response_status?: number) => {
    setLoading(false);
    if (response_status === 303) {
      handleSuccessfulFetchRecord(data, true);
    } else if (response_status === 403) {
      setErrorMsg(`${data}`);
    }
    else {
      setErrorMsg("error getting record data: " + data);
    }
  };

  const handleSuccessfulFetchRecord = (data: any, lock_record?: boolean) => {
    let newRecordData = data.recordData;
    if (lock_record) {
      setErrorMsg(data.lockedMessage);
      setLocked(true);
    }
    else {
      setErrorMsg("");
      setLocked(false);
    }
    setLoading(false);
    setRecordData(newRecordData);
    setRecordName(newRecordData.name);
    setRecordSchema(data.recordSchema);
    let tempPreviousPages: PreviousPages = {
      "Projects": () => navigate("/projects"),
    };
    tempPreviousPages[newRecordData.project_name] = 
            () => navigate("/project/" + newRecordData.project_id);
    tempPreviousPages[newRecordData.rg_name] = 
            () => navigate("/record_group/" + newRecordData.rg_id);
    setPreviousPages(tempPreviousPages);
  };

  const handleChangeRecordName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRecordName(event.target.value);
  };

  const handleUpdateRecord = (newRecordData: RecordData) => {
    if (locked) return;
    let body = { data: newRecordData, type: "attributesList" };
    callAPI(
      updateRecord,
      [params.id, body],
      handleSuccessfulDeletion,
      handleFailedUpdate
    );
  };

  const handleUpdateRecordName = () => {
    if (locked) return;
    setOpenUpdateNameModal(false);
    callAPI(
      updateRecord,
      [params.id, { data: { name: recordName }, type: "name" }],
      (data) => window.location.reload(),
      handleFailedUpdate
    );
  };

  const handleSuccessfulDeletion = (data: any) => {};

  const handleSuccessfulAttributeUpdate = React.useCallback((data: any) => {
    const { fieldId, v, review_status } = data;
    handleChangeAttribute(v, fieldId, review_status);
  }, []);

  const handleFailedUpdate = (data: any, response_status?: number) => {
    if (response_status === 403) {
      showError(`${data}.`);
    } else {
      console.error("error updating record data: ", data);
    }
  };

  const showError = React.useCallback((errorMessage: string) => {
    setErrorMsg(errorMessage);
  }, []);

  const insertField: insertFieldSignature = React.useCallback((fieldID, parentAttribute) => {
    const k = fieldID.key;
    const primaryIndex = fieldID.primaryIndex;
    const isSubattribute = fieldID.isSubattribute;
    const subIndex = fieldID.subIndex || 0;
    if (isSubattribute) {
      const newSubIndex = subIndex + 1;
      const newSubField = {
        "key": k,
        "ai_confidence": null,
        "confidence": null,
        "raw_text": null,
        "text_value": null,
        "value": "",
        "normalized_vertices": null,
        "normalized_value": null,
        "subattributes": null,
        "isSubattribute": true,
        "edited": false,
        "page": null,
        "user_added": true,
        "topLevelAttribute": parentAttribute,
      };
      setRecordData(tempRecordData => {
        const newAttributesList = tempRecordData.attributesList.map((attribute, i) => {
          if (i !== primaryIndex) return attribute;

          const currentSubattributes = attribute.subattributes;
          if (!attribute.subattributes) {
            return {
              ...attribute,
              subattributes: [newSubField],
            };
          } else {
            const newSubattributes = [
              ...currentSubattributes.slice(0, newSubIndex),
              newSubField,
              ...currentSubattributes.slice(newSubIndex),
            ];
            return {
              ...attribute,
              subattributes: newSubattributes,
            };
          }
        });
        let newRecordData: RecordData;
        if (tempRecordData.review_status === "unreviewed")
          newRecordData = { ...tempRecordData, review_status: "incomplete", attributesList: newAttributesList };
        else
          newRecordData = { ...tempRecordData, attributesList: newAttributesList };

        handleUpdateRecord(newRecordData);
        return newRecordData;
      });
      setTimeout(() => {
        setForceEditMode([primaryIndex, newSubIndex]);
        setTimeout(() => {
          setForceEditMode([-1, -1]);
        }, 0);
      }, 0);
    } else {
      const newIndex = primaryIndex+1;
      const newField = {
        "key": k,
        "ai_confidence": null,
        "confidence": null,
        "raw_text": null,
        "text_value": null,
        "value": "",
        "normalized_vertices": null,
        "normalized_value": null,
        "subattributes": null,
        "isSubattribute": false,
        "edited": false,
        "page": null,
        "user_added": true,
      };
      setRecordData(tempRecordData => {
        const newRecordData = {
          ...tempRecordData,
          attributesList: [
            ...tempRecordData.attributesList.slice(0, newIndex),
            newField,
            ...tempRecordData.attributesList.slice(newIndex),
          ]
        };
        handleUpdateRecord(newRecordData);
        return newRecordData;
      });
      // force new field to be in edit mode (open text field)
      // is there a better way to do this?
      setTimeout(() => {
        setForceEditMode([newIndex, -1]);
        setTimeout(() => {
          setForceEditMode([-1, -1]);
        }, 0);
      }, 0);
    }
        
  }, []);

  const deleteField: deleteFieldSignature = React.useCallback((fieldID: FieldID) => {
    const primaryIndex = fieldID.primaryIndex;
    const isSubattribute = fieldID.isSubattribute;
    const subIndex = fieldID.subIndex || 0;
    if (isSubattribute) {
      setRecordData(tempRecordData => {
        const newAttributesList = tempRecordData.attributesList.map((attribute, idx) => {
          if (idx !== primaryIndex) return attribute;
          else {
            return {
              ...attribute,
              subattributes: attribute.subattributes.filter((_: any, subidx: number) => subidx !== subIndex)
            };
          }
        });
        const newRecordData = { ...tempRecordData, attributesList: newAttributesList };
        handleUpdateRecord(newRecordData);
        return newRecordData;
      });
    } else {
      setRecordData(tempRecordData => {
        const newRecordData = {
          ...tempRecordData,
          attributesList: tempRecordData.attributesList.filter((_, i) => i !== primaryIndex),
        };
        handleUpdateRecord(newRecordData);
        return newRecordData;
      });
    }
  }, []);

  const updateFieldCoordinates: updateFieldCoordinatesSignature = React.useCallback((fieldId, new_coordinates, pageNumber) => {
    if (locked) return true;
    let rightNow = Date.now();
    // TODO: need to update backend as well
    if (!fieldId.isSubattribute) {
      setRecordData(tempRecordData => {
        const newRecordData = {
          ...tempRecordData,
          attributesList: tempRecordData.attributesList.map((tempAttribute, idx) =>
            fieldId.primaryIndex === idx ? { 
              ...tempAttribute,
              lastUpdated: rightNow,
              lastUpdatedBy: userEmail,
              edited: true,
              user_provided_coordinates: new_coordinates,
              page: pageNumber,
            } : tempAttribute
          )
        };
        handleUpdateRecord(newRecordData);
        return newRecordData;
      });
    } else {
      setRecordData(tempRecordData => {
        const newRecordData = {
          ...tempRecordData,
          attributesList: tempRecordData.attributesList.map((tempAttribute, idx) =>
            fieldId.primaryIndex === idx ? { 
              ...tempAttribute,
              subattributes: tempAttribute.subattributes.map((tempSubattribute: Attribute, subidx: number) => {
                if (fieldId.subIndex === subidx) {
                  return {
                    ...tempSubattribute,
                    lastUpdated: rightNow,
                    lastUpdatedBy: userEmail,
                    edited: true,
                    user_provided_coordinates: new_coordinates,
                    page: pageNumber,
                  };
                } else return tempSubattribute;
              }
              )
            } : tempAttribute
          )
        };
        handleUpdateRecord(newRecordData);
        return newRecordData;
      });
    }
  }, []);

  const handleChangeAttribute = (newAttribute: Attribute, fieldID: FieldID, reviewStatus: string) => {
    if (locked) return true;
    const newValue = newAttribute.value;
    const newNormalizedValue = newAttribute.normalized_value;
    const new_uncleaned_value = newAttribute.uncleaned_value;
    const new_cleaned = newAttribute.cleaned;
    const new_cleaning_error = newAttribute.cleaning_error;
    const new_edited = newAttribute.edited;
    const new_lastUpdated = newAttribute.lastUpdated;
    const new_lastUpdatedBy = newAttribute.lastUpdatedBy;
    const new_last_cleaned = newAttribute.last_cleaned;
    const topLevelAttribute = newAttribute.topLevelAttribute;

    const primaryIndex = fieldID.primaryIndex;
    const isSubattribute = fieldID.isSubattribute;
    const subIndex = fieldID.subIndex;

    if (!isSubattribute) {
      setRecordData(tempRecordData => ({
        ...tempRecordData,
        review_status: reviewStatus || tempRecordData.review_status,
        attributesList: tempRecordData.attributesList.map((tempAttribute, idx) =>
          primaryIndex === idx ? { 
            ...tempAttribute, 
            value: newValue,
            normalized_value: newNormalizedValue,
            cleaned: new_cleaned,
            cleaning_error: new_cleaning_error,
            uncleaned_value: new_uncleaned_value,
            edited: new_edited,
            lastUpdated: new_lastUpdated,
            lastUpdatedBy: new_lastUpdatedBy,
            last_cleaned: new_last_cleaned,
            // user_added: new_user_added,
          } : tempAttribute
        )
      }));
    } else {
      setRecordData(tempRecordData => ({
        ...tempRecordData,
        review_status: reviewStatus || tempRecordData.review_status,
        attributesList: tempRecordData.attributesList.map((tempAttribute, idx) =>
          primaryIndex === idx ? { 
            ...tempAttribute,
            subattributes: tempAttribute.subattributes.map((tempSubattribute: Attribute, subidx: number) => {
              if (subIndex === subidx) {
                return {
                  ...tempSubattribute,
                  value: newValue,
                  normalized_value: newNormalizedValue,
                  cleaned: new_cleaned,
                  cleaning_error: new_cleaning_error,
                  uncleaned_value: new_uncleaned_value,
                  edited: new_edited,
                  lastUpdated: new_lastUpdated,
                  lastUpdatedBy: new_lastUpdatedBy,
                  last_cleaned: new_last_cleaned,
                  topLevelAttribute: topLevelAttribute,
                };
              } else return tempSubattribute;
            }
            )
          } : tempAttribute
        )
      }));
    }
  };

  const handleChangeValue: handleChangeValueSignature = React.useCallback((event, fieldId) => {
    const primaryIndex = fieldId.primaryIndex;
    const isSubattribute = fieldId.isSubattribute;
    const subIndex = fieldId.subIndex;
    if (locked) return true;
    let value = event.target.value;
    let rightNow = Date.now();
    if (!isSubattribute) {
      setRecordData(tempRecordData => ({
        ...tempRecordData,
        lastUpdated: rightNow,
        lastUpdatedBy: userEmail,
        attributesList: tempRecordData.attributesList.map((tempAttribute, idx) =>
          primaryIndex === idx ? { 
            ...tempAttribute, 
            value: value,
            edited: true,
            lastUpdated: rightNow,
            lastUpdatedBy: userEmail,
          } : tempAttribute
        )
      }));
    } else {
      setRecordData(tempRecordData => ({
        ...tempRecordData,
        lastUpdated: rightNow,
        lastUpdatedBy: userEmail,
        attributesList: tempRecordData.attributesList.map((tempAttribute, idx) =>
          primaryIndex === idx ? { 
            ...tempAttribute, 
            edited: true,
            lastUpdated: rightNow,
            lastUpdatedBy: userEmail,
            subattributes: tempAttribute.subattributes.map((tempSubattribute: Attribute, subidx: number) => {
              if (subIndex === subidx) {
                return {
                  ...tempSubattribute,
                  value: value,
                  edited: true,
                  lastUpdated: rightNow,
                  lastUpdatedBy: userEmail,
                };
              } else return tempSubattribute;
            }
            )
          } : tempAttribute
        )
      }));
    }
  }, []);

  const handleDeleteRecord = () => {
    setOpenDeleteModal(false);
    callAPI(
      deleteRecord,
      [params.id],
      goToRecordGroup,
      handleFailedUpdate
    );
  };

  const goToRecordGroup = () => {
    navigate("/record_group/" + recordData.record_group_id);
  };

  const handleClickNext = () => {
    const next_id = recordData.next_id;
    setRecordData({} as RecordData);
    navigateToRecord({recordData: {_id: next_id}});
  };

  const handleClickPrevious = () => {
    const next_id = recordData.previous_id;
    setRecordData({} as RecordData);
    navigateToRecord({recordData: {_id: next_id}});
  };

  const handleClickMarkReviewed = () => {
    if (locked) return;
    handleUpdateReviewStatus("reviewed");
  };

  useKeyDown("ArrowLeft", undefined, undefined, handleClickPrevious, undefined, false);
  useKeyDown("ArrowRight", undefined, undefined, handleClickNext, handleClickMarkReviewed, true);

  const navigateToRecord = (data: any) => {
    let record_data = data.recordData;
    if (record_data?._id) {
      let newUrl = "/record/" + record_data._id;
      if (record_data._id == recordData._id) window.location.reload();
      else navigate(newUrl, { state: { group_id: group_id, location: location}, replace: true  });
    } else {
      console.error("error redirecting");
    }
  };

  const promptResetRecord = () => {
    setShowResetPrompt(true);
  };

  const handleUpdateReviewStatus = (new_status: string, categories?: string[], description?: string) => {
    let data_update;
    if (new_status === "unreviewed") {
      let tempRecordData = { ...recordData };
      tempRecordData["review_status"] = "unreviewed";
      data_update = tempRecordData;
    } else if (new_status === "defective") {
      data_update = {review_status: new_status, defective_categories: categories, defective_description: description};
    } else if (new_status === "verification_required") {
      return;
    } else if (new_status === "reviewed-verified") {
      return;
    } else if (new_status === "defective-verified") {
      return;
    }
    else data_update = { review_status: new_status };
    callAPI(
      updateRecord,
      [params.id, { data: data_update, type: "review_status" }],
      (data) => handleSuccessfulStatusUpdate(data, new_status),
      handleFailedUpdate
    );
  };

  const handleUpdateVerificationStatus = (verification_status: string, review_status?: string) => {
    let data_update: any;
    let type = "verification_status";
    data_update = { verification_status: verification_status };
    if (review_status) {
      data_update["review_status"] = review_status;
    }
    callAPI(
      updateRecord,
      [params.id, { data: data_update, type: type }],
      (data) => handleSuccessfulStatusUpdate(data, verification_status),
      handleFailedUpdate
    );
  };

  const handleSuccessfulStatusUpdate = (data: any, new_status: string) => {
    if (new_status === "reviewed") {
      setRecordData({} as RecordData);
      navigateToRecord({recordData: {_id: recordData.next_id}});
    }
    else window.location.reload();
  };

  const runCleaningFunctions = () => {
    callAPI(
      cleanRecords,
      ["record", params.id],
      handleSuccessfulClean,
      handleFailedUpdate
    );
  };
    
  const handleSuccessfulClean = () => {
    setOpenCleanPrompt(false);
    window.location.reload();
  };

  return (
    <Box sx={styles.outerBox}>
      <Subheader
        currentPage={`${recordData.rank !== undefined ? recordData.rank+"." : ""} ${recordData.name !== undefined ? recordData.name : ""}`}
        actions={subheaderActions}
        previousPages={previousPages}
        status={recordData.review_status}
        verification_status={recordData.verification_status}
        locked={locked}
      />
      <Box sx={styles.innerBox}>
        <DocumentContainer
          imageFiles={recordData.img_urls}
          attributesList={recordData.attributesList}
          handleChangeValue={handleChangeValue}
          locked={locked}
          recordSchema={recordSchema || {}}
          insertField={insertField}
          deleteField={deleteField}
          forceEditMode={forceEditMode}
          handleSuccessfulAttributeUpdate={handleSuccessfulAttributeUpdate}
          showError={showError}
          reviewStatus={recordData.review_status || ""}
          updateFieldCoordinates={updateFieldCoordinates}
          loading={loading}
          recordStatus={recordData.status}
          errorMessage={recordData.error_message}
        />
      </Box>
      <Bottombar
        onPreviousButtonClick={handleClickPrevious}
        onNextButtonClick={handleClickNext}
        onReviewButtonClick={handleClickMarkReviewed}
        recordData={recordData}
        handleUpdateReviewStatus={handleUpdateReviewStatus}
        handleUpdateVerificationStatus={handleUpdateVerificationStatus}
        promptResetRecord={promptResetRecord}
        locked={locked}
      />
      <PopupModal
        open={openDeleteModal}
        handleClose={() => setOpenDeleteModal(false)}
        text="Are you sure you want to delete this record?"
        handleSave={handleDeleteRecord}
        buttonText='Delete'
        buttonColor='error'
        buttonVariant='contained'
        width={400}
      />
      <PopupModal
        input
        open={openUpdateNameModal}
        handleClose={() => setOpenUpdateNameModal(false)}
        text={recordName}
        textLabel='Record Name'
        handleEditText={handleChangeRecordName}
        handleSave={handleUpdateRecordName}
        buttonText='Update'
        buttonColor='primary'
        buttonVariant='contained'
        width={400}
      />
      <PopupModal
        open={showResetPrompt}
        handleClose={() => setShowResetPrompt(false)}
        text="Setting status to unreviewed will reset any changes made, and revert all fields to uncleaned values. Are you sure you want to continue?"
        handleSave={() => handleUpdateReviewStatus("unreviewed")}
        buttonText='Reset'
        buttonColor='primary'
        buttonVariant='contained'
        width={400}
      />
      <PopupModal
        open={openCleanPrompt}
        handleClose={() => setOpenCleanPrompt(false)}
        text="Are you sure you want to clean all the records in this record group?"
        handleSave={runCleaningFunctions}
        buttonText='Clean Record'
        buttonColor='primary'
        buttonVariant='contained'
        width={400}
      />
      <ErrorBar
        errorMessage={errorMsg}
        setErrorMessage={setErrorMsg}
        duration={1200000}
        margin
      />
    </Box>
  );
};

export default Record;
