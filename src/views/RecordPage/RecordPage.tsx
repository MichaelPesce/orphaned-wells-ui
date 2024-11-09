import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useParams, useNavigate } from "react-router-dom";
import { getRecordData, updateRecord, deleteRecord } from '../../services/app.service';
import { callAPI, useKeyDown } from '../../assets/util';
import Subheader from '../../components/Subheader/Subheader';
import Bottombar from '../../components/BottomBar/BottomBar';
import DocumentContainer from '../../components/DocumentContainer/DocumentContainer';
import PopupModal from '../../components/PopupModal/PopupModal';
import ErrorBar from '../../components/ErrorBar/ErrorBar';
import { RecordData, handleChangeValueSignature, PreviousPages } from '../../types';



const Record = () => {
    const [recordData, setRecordData] = useState<RecordData>({} as RecordData);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [openUpdateNameModal, setOpenUpdateNameModal] = useState(false);
    const [recordName, setRecordName] = useState("");
    const [previousPages, setPreviousPages] = useState<PreviousPages>({ "Projects": () => navigate("/projects", { replace: true }) });
    const [showErrorBar, setShowErrorBar] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [showResetPrompt, setShowResetPrompt] = useState(false);
    const [locked, setLocked] = useState(false)
    const params = useParams<{ id: string }>();
    const navigate = useNavigate();

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
        callAPI(
            getRecordData,
            [params.id],
            handleSuccessfulFetchRecord,
            handleFailedFetchRecord,
        )
    }, [params.id]);

    const handleFailedFetchRecord = (data: any, response_status?: number) => {
        if (response_status === 303) {
            handleSuccessfulFetchRecord(data, true)
        } else {
            console.error('error getting record data: ', data);
        }
    }

    const handleSuccessfulFetchRecord = (data: any, lock_record?: boolean) => {
        let newRecordData = data.recordData;
        if (lock_record) {
            setShowErrorBar(true)
            setErrorMsg("This record is currently being reviewed by a team member.")
            setLocked(true)
        }
        else {
            setShowErrorBar(false)
            setErrorMsg("")
            setLocked(false)
        }
        setRecordData(newRecordData);
        setRecordName(newRecordData.name);
        let tempPreviousPages: PreviousPages = {
            "Projects": () => navigate("/projects", { replace: true }),
        };
        tempPreviousPages[newRecordData.project_name] = 
            () => navigate("/project/" + newRecordData.project_id, { replace: true });
        tempPreviousPages[newRecordData.rg_name] = 
            () => navigate("/record_group/" + newRecordData.rg_id, { replace: true });
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

    const handleUpdateRecord = (key: string, value: string) => {
        console.log("updating record with key: "+key+ ", value: "+value)
        if (locked) return
        callAPI(
            updateRecord,
            [params.id, { data: recordData, type: "attributesList" }],
            handleSuccessfulAttributeUpdate,
            handleFailedUpdate
        );
    }

    const handleSuccessfulAttributeUpdate = (data: any) => {
        let tempRecordData = { ...recordData } as RecordData;
        tempRecordData["attributesList"] = data["attributesList"]
        tempRecordData["review_status"] = data["review_status"]
        setRecordData(tempRecordData);
    }

    const handleFailedUpdate = (data: any, response_status?: number) => {
        if (response_status === 403) {
            setShowErrorBar(true);
            setErrorMsg(`Unable to update record: ${data.detail}. Returning to records list in 5 seconds.`);
            setTimeout(() => {
                goToRecordGroup();
            }, 5000);
        } else {
            console.error('error updating record data: ', data);
        }
    }

    const handleChangeValue: handleChangeValueSignature = (event, topLevelIndex, isSubattribute, subIndex) => {
        if (locked) return
        let tempRecordData = { ...recordData };
        let tempAttributesList = [...tempRecordData.attributesList];
        let tempAttribute: any;
        if (isSubattribute) {
            let value = event.target.value;
            tempAttribute = tempAttributesList[topLevelIndex];
            let tempSubattributesList = [...tempAttribute["subattributes"]];
            let tempSubattribute = tempSubattributesList[subIndex!];
            tempSubattribute.value = value;
            tempAttribute.edited = true;
            tempSubattribute.edited = true;
            tempAttribute["subattributes"] = tempSubattributesList;
        } else {
            tempAttribute = tempAttributesList[topLevelIndex];
            let value = event.target.value;
            tempAttribute.value = value;
            tempAttribute.edited = true;
        }
        tempAttributesList[topLevelIndex] = tempAttribute;
        tempRecordData.attributesList = tempAttributesList;
        setRecordData(tempRecordData);
    }

    const handleDeleteRecord = () => {
        setOpenDeleteModal(false);
        callAPI(
            deleteRecord,
            [params.id],
            goToRecordGroup,
            (e) => console.error('error on deleting record: ', e)
        );
    }

    const goToRecordGroup = () => {
        navigate("/record_group/" + recordData.record_group_id, { replace: true })
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
        navigateToRecord({recordData: {_id: recordData.next_id}})
    }

    useKeyDown("ArrowLeft", undefined, undefined, handleClickPrevious, undefined);
    useKeyDown("ArrowRight", undefined, undefined, handleClickNext, handleClickMarkReviewed);

    const navigateToRecord = (data: any) => {
        let record_data = data.recordData;
        if (record_data?._id) {
            let newUrl = "/#/record/" + record_data._id;
            window.location.href = newUrl;
        } else {
            console.error("error redirecting")
        }
    }

    const promptResetRecord = () => {
        setShowResetPrompt(true);
    }

    const handleUpdateReviewStatus = (new_status: string) => {
        let data_update;
        if (new_status === "unreviewed") {
            let tempRecordData = { ...recordData };
            tempRecordData["review_status"] = "unreviewed";
            data_update = tempRecordData;
        } else data_update = { review_status: new_status };
        callAPI(
            updateRecord,
            [params.id, { data: data_update, type: "review_status" }],
            (data) => window.location.reload(),
            handleFailedUpdate
        );
    }

    return (
        <Box sx={styles.outerBox}>
            <Subheader
                currentPage={`${recordData.recordIndex !== undefined ? recordData.recordIndex : ""}. ${recordData.name !== undefined ? recordData.name : ""}`}
                actions={(localStorage.getItem("role") && localStorage.getItem("role") === "10") ?
                    {
                        "Change record name": () => setOpenUpdateNameModal(true),
                        "Delete record": () => setOpenDeleteModal(true)
                    }
                    :
                    {
                        "Change record name": () => setOpenUpdateNameModal(true),
                    }
                }
                previousPages={previousPages}
                status={recordData.review_status}
                locked={locked}
            />
            <Box sx={styles.innerBox}>
                <DocumentContainer
                    imageFiles={recordData.img_urls}
                    attributesList={recordData.attributesList}
                    handleChangeValue={handleChangeValue}
                    handleUpdateRecord={handleUpdateRecord}
                    locked={locked}
                />
            </Box>
            <Bottombar
                onPreviousButtonClick={handleClickPrevious}
                onNextButtonClick={handleClickNext}
                onReviewButtonClick={handleClickMarkReviewed}
                recordData={recordData}
                handleUpdateReviewStatus={handleUpdateReviewStatus}
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
                text="Setting status to unreviewed will reset any changes made. Are you sure you want to continue?"
                handleSave={() => handleUpdateReviewStatus("unreviewed")}
                buttonText='Reset'
                buttonColor='primary'
                buttonVariant='contained'
                width={400}
            />
            {showErrorBar &&
                <ErrorBar
                    errorMessage={errorMsg}
                    setOpen={setShowErrorBar}
                    duration={1200000}
                    margin
                />
            }
        </Box>
    );
}

export default Record;