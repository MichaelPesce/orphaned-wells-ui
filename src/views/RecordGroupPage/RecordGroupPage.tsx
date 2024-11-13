import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { useParams, useNavigate } from "react-router-dom";
import { getRecordGroup, uploadDocument, deleteRecordGroup, updateRecordGroup } from '../../services/app.service';
import RecordsTable from '../../components/RecordsTable/RecordsTable';
import Subheader from '../../components/Subheader/Subheader';
import UploadDocumentsModal from '../../components/UploadDocumentsModal/UploadDocumentsModal';
import PopupModal from '../../components/PopupModal/PopupModal';
import { callAPI } from '../../assets/util';
import { RecordGroup, ProjectData, PreviousPages } from '../../types';

const RecordGroupPage = () => {
    const params = useParams<{ id: string }>(); 
    const navigate = useNavigate();
    const [project, setProject] = useState({} as ProjectData)
    const [recordGroup, setRecordGroup] = useState<RecordGroup>({ } as RecordGroup);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [openUpdateNameModal, setOpenUpdateNameModal] = useState(false);
    const [recordGroupName, setRecordGroupName] = useState("");
    const [navigation, setNavigation] = useState<PreviousPages>({"Projects": () => navigate("/projects", { replace: true })})
    

    useEffect(() => {
        if (params.id) {
            loadRecordGroup()
        }
    }, [params.id]);

    useEffect(() => {
        let temp_navigation: PreviousPages = { 
            "Projects": () => navigate("/projects", { replace: true })
        }
        temp_navigation[project.name] = () => navigate("/project/"+project._id, { replace: true })
        setNavigation(temp_navigation)
    }, [project]);

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
            (e: Error) => { console.error('error on deleting record group: ', e); }
        );
    }

    const gotRecordGroup = (data: {project: any, rg_data: any}) => {
        setRecordGroup(data.rg_data)
        setRecordGroupName(data.rg_data.name)
        setProject(data.project)
    } 

    const handleUploadDocument = (file: File) => {
        const formData = new FormData();
        formData.append('file', file, file.name);
        callAPI(
            uploadDocument,
            [formData, recordGroup._id, false],
            handleSuccessfulDocumentUpload,
            (e: Error) => { console.error('error on file upload: ', e); }
        );
    };

    const handleSuccessfulDocumentUpload = () => {
        setTimeout(() => {
            window.location.reload();
        }, 500);
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
            (e: Error) => { console.error('error on deleting record group: ', e); }
        );
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
            (e: Error) => console.error('error on updating record group name: ', e)
        );
    };

    const handleUpdateRecordGroup = (update: any) => {
        callAPI(
            updateRecordGroup,
            [params.id, update],
            (data: RecordGroup) => setRecordGroup(data),
            (e: Error) => console.error('error on updating record group name: ', e)
        );
    };

    

    return (
        <Box sx={styles.outerBox}>
            <Subheader
                currentPage={recordGroup.name}
                buttonName="Upload new record(s)"
                handleClickButton={() => setShowDocumentModal(true)}
                actions={(localStorage.getItem("role") && localStorage.getItem("role") === "10") ?
                    {
                        "Change record group name": handleClickChangeName, 
                        "Delete record group": () => setOpenDeleteModal(true),
                    }
                    :
                    {
                        "Change record group name": handleClickChangeName, 
                    }
                }
                previousPages={navigation}
            />
            <Box sx={styles.innerBox}>
                <RecordsTable
                    location="record_group"
                    params={params}
                    handleUpdate={handleUpdateRecordGroup}
                />
            </Box>
            {showDocumentModal && 
                <UploadDocumentsModal 
                    setShowModal={setShowDocumentModal}
                    handleUploadDocument={handleUploadDocument}
                />
            }
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
        </Box>
    );
};

export default RecordGroupPage;