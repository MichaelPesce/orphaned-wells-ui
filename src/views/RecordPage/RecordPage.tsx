import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getRecordData, updateRecord, deleteRecord, cleanRecords } from '../../services/app.service';
import { callAPI, useKeyDown, convertFiltersToMongoFormat } from '../../util';
import Subheader from '../../components/Subheader/Subheader';
import Bottombar from '../../components/BottomBar/BottomBar';
import DocumentContainer from '../../components/DocumentContainer/DocumentContainer';
import PopupModal from '../../components/PopupModal/PopupModal';
import ErrorBar from '../../components/ErrorBar/ErrorBar';
import { RecordData, handleChangeValueSignature, PreviousPages, SubheaderActions, RecordSchema } from '../../types';
import { useUserContext } from '../../usercontext';

const Record = () => {
    const [recordData, setRecordData] = useState<RecordData>({} as RecordData);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [openCleanPrompt, setOpenCleanPrompt] = useState(false);
    const [openUpdateNameModal, setOpenUpdateNameModal] = useState(false);
    const [recordName, setRecordName] = useState("");
    const [previousPages, setPreviousPages] = useState<PreviousPages>({ "Projects": () => navigate("/projects") });
    const [errorMsg, setErrorMsg] = useState<string | null>("");
    const [showResetPrompt, setShowResetPrompt] = useState(false);
    const [ lastUpdatedField, setLastUpdatedField ] = useState<any>()
    const [ subheaderActions, setSubheaderActions ] = useState<SubheaderActions>()
    const [ recordSchema, setRecordSchema ] = useState<RecordSchema>()
    const [locked, setLocked] = useState(false)
    const params = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { userPermissions, userEmail } = useUserContext();

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
    }

    useEffect(() => {
        let body = {}
        if (location.state) {
            body = {
                sort: [location.state?.sortBy, location.state?.sortAscending],
                filter: convertFiltersToMongoFormat(location.state?.filterBy),
                id: location.state?.id,
                level: location.state?.level
            };
        }
        
        callAPI(
            getRecordData,
            [params.id, body],
            handleSuccessfulFetchRecord,
            handleFailedFetchRecord,
        )
    }, [params.id]);

    useEffect(() => {
        let tempActions = {
            "Change record name": () => setOpenUpdateNameModal(true)
        } as SubheaderActions
        if (userPermissions && userPermissions.includes('clean_record')) {
            tempActions["Clean record"] = () => setOpenCleanPrompt(true)
            tempActions["Reset record"] = () => setShowResetPrompt(true)
        }
        if (userPermissions && userPermissions.includes('delete')) {
            tempActions["Delete record"] = () => setOpenDeleteModal(true)
        }
        setSubheaderActions(tempActions)
    }, [userPermissions])

    const handleFailedFetchRecord = (data: any, response_status?: number) => {
        if (response_status === 303) {
            handleSuccessfulFetchRecord(data, true)
        } else if (response_status === 403) {
            setErrorMsg(`${data}`);
        }
        else {
            setErrorMsg('error getting record data: ' + data)
        }
    }

    const handleSuccessfulFetchRecord = (data: any, lock_record?: boolean) => {
        let newRecordData = data.recordData;
        if (lock_record) {
            setErrorMsg(data.lockedMessage)
            setLocked(true)
        }
        else {
            setErrorMsg("")
            setLocked(false)
        }
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
    }

    const handleChangeRecordName = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRecordName(event.target.value);
    }

    const handleUpdateRecordName = () => {
        if (locked) return
        setOpenUpdateNameModal(false);
        callAPI(
            updateRecord,
            [params.id, { data: { name: recordName }, type: "name" }],
            (data) => window.location.reload(),
            handleFailedUpdate
        );
    }

    const handleUpdateRecord = (cleanFields: boolean = true) => {
        if (locked) return
        let body = { data: recordData, type: "attributesList", fieldToClean: null }
        if (cleanFields) body['fieldToClean'] = lastUpdatedField
        callAPI(
            updateRecord,
            [params.id, body],
            handleSuccessfulAttributeUpdate,
            handleFailedUpdate
        );
    }

    const handleSuccessfulAttributeUpdate = (data: any) => {
        let tempRecordData = { ...recordData } as RecordData;
        tempRecordData["attributesList"] = data["attributesList"]
        if (data["review_status"]) tempRecordData["review_status"] = data["review_status"]
        setLastUpdatedField(undefined)
        setRecordData(tempRecordData);
    }

    const handleFailedUpdate = (data: any, response_status?: number) => {
        if (response_status === 403) {
            setErrorMsg(`${data}.`);
        } else {
            console.error('error updating record data: ', data);
        }
    }

    const handleChangeValue: handleChangeValueSignature = (event, topLevelIndex, isSubattribute, subIndex) => {
        if (locked) return true
        let tempRecordData = { ...recordData };
        let tempAttributesList = [...tempRecordData.attributesList];
        let tempAttribute: any;
        let rightNow = Date.now();
        let value;
        if (isSubattribute) {
            value = event.target.value;
            tempAttribute = tempAttributesList[topLevelIndex];
            let tempSubattributesList = [...tempAttribute["subattributes"]];
            let tempSubattribute = tempSubattributesList[subIndex!];
            tempSubattribute.value = value;
            tempAttribute.edited = true;
            tempAttribute.lastUpdated = rightNow;
            tempAttribute.lastUpdatedBy = userEmail
            tempSubattribute.edited = true;
            tempSubattribute.lastUpdated = rightNow;
            tempSubattribute.lastUpdatedBy = userEmail
            tempAttribute["subattributes"] = tempSubattributesList;
        } else {
            tempAttribute = tempAttributesList[topLevelIndex];
            value = event.target.value;
            tempAttribute.value = value;
            tempAttribute.edited = true;
            tempAttribute.lastUpdated = rightNow;
            tempAttribute.lastUpdatedBy = userEmail
        }
        tempAttributesList[topLevelIndex] = tempAttribute;
        tempRecordData.attributesList = tempAttributesList;
        tempRecordData.lastUpdated = rightNow;
        tempRecordData.lastUpdatedBy = userEmail;
        let tempLastUpdatedField = {
            topLevelIndex: topLevelIndex,
            'isSubattribute': isSubattribute,
            'subIndex': subIndex
        }
        setLastUpdatedField(tempLastUpdatedField)
        setRecordData(tempRecordData);
    }

    const handleDeleteRecord = () => {
        setOpenDeleteModal(false);
        callAPI(
            deleteRecord,
            [params.id],
            goToRecordGroup,
            handleFailedUpdate
        );
    }

    const goToRecordGroup = () => {
        navigate("/record_group/" + recordData.record_group_id)
    }

    const handleClickNext = () => {
        navigateToRecord({recordData: {_id: recordData.next_id}})
    }

    const handleClickPrevious = () => {
        navigateToRecord({recordData: {_id: recordData.previous_id}})
    }

    const handleClickMarkReviewed = () => {
        if (locked) return
        handleUpdateReviewStatus("reviewed")
    }

    useKeyDown("ArrowLeft", undefined, undefined, handleClickPrevious, undefined, true);
    useKeyDown("ArrowRight", undefined, undefined, handleClickNext, handleClickMarkReviewed, true);

    const navigateToRecord = (data: any) => {
        let record_data = data.recordData;
        if (record_data?._id) {
            let newUrl = "/record/" + record_data._id;
            if (record_data._id == recordData._id) window.location.reload()
            else navigate(newUrl, {state: location.state})
        } else {
            console.error("error redirecting")
        }
    }

    const promptResetRecord = () => {
        setShowResetPrompt(true);
    }

    const handleUpdateReviewStatus = (new_status: string, categories?: string[], description?: string) => {
        let data_update;
        if (new_status === "unreviewed") {
            let tempRecordData = { ...recordData };
            tempRecordData["review_status"] = "unreviewed";
            data_update = tempRecordData;
        } else if (new_status === "defective") {
            data_update = {review_status: new_status, defective_categories: categories, defective_description: description};
        } else if (new_status === "verification_required") {
            return
        } else if (new_status === "reviewed-verified") {
            return
        } else if (new_status === "defective-verified") {
            return
        }
        else data_update = { review_status: new_status };
        callAPI(
            updateRecord,
            [params.id, { data: data_update, type: "review_status" }],
            (data) => handleSuccessfulStatusUpdate(data, new_status),
            handleFailedUpdate
        );
    }

    const handleUpdateVerificationStatus = (verification_status: string, review_status?: string) => {
        let data_update: any;
        let type = "verification_status"
        data_update = { verification_status: verification_status };
        if (review_status) {
            data_update["review_status"] = review_status
        }
        callAPI(
            updateRecord,
            [params.id, { data: data_update, type: type }],
            (data) => handleSuccessfulStatusUpdate(data, verification_status),
            handleFailedUpdate
        );
    }

    const handleSuccessfulStatusUpdate = (data: any, new_status: string) => {
        if (new_status === "reviewed") navigateToRecord({recordData: {_id: recordData.next_id}})
        else window.location.reload()
    }

    const runCleaningFunctions = () => {
        callAPI(
            cleanRecords,
            ['record', params.id],
            handleSuccessfulClean,
            handleFailedUpdate
        );
    }
    
    const handleSuccessfulClean = () => {
        setOpenCleanPrompt(false)
        window.location.reload()
    }

    return (
        <Box sx={styles.outerBox}>
            <Subheader
                currentPage={`${recordData.recordIndex !== undefined ? recordData.recordIndex : ""}. ${recordData.name !== undefined ? recordData.name : ""}`}
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
                    handleUpdateRecord={handleUpdateRecord}
                    locked={locked}
                    recordSchema={recordSchema || {}}
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
}

export default Record;