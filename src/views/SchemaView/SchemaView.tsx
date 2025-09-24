import { useState, useEffect } from 'react';
import { useUserContext } from '../../usercontext';
import { Box } from '@mui/material';
import { useNavigate } from "react-router-dom";
import Subheader from '../../components/Subheader/Subheader';
import { callAPI } from '../../util';
import { getAirtableProcessors } from '../../services/airtable.service';

const SchemaView = () => {
    const navigate = useNavigate();
    const { userPermissions} = useUserContext();

    const handleFetchedProcessorData = (data: any) => {
        console.log("fetched processor data from airtable")
        console.log(data)
    }

    const handleFailure = (e: any) => {
        console.log('failed to get airtable data:')
        console.log(e)
    }

    useEffect(() => {
        const hasAccess = userPermissions?.includes("system_administration");
        if (!hasAccess) navigate("/");
        callAPI(
            getAirtableProcessors,
            [],
            handleFetchedProcessorData,
            handleFailure,
        )
    }, [userPermissions]);

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

    return (
        <Box sx={styles.outerBox}>
            <Subheader
                currentPage="Testing"
                // buttonName={(userPermissions && userPermissions.includes('create_project')) ? "New Project" : undefined}
                // handleClickButton={handleClickNewProject}
            />
            <Box sx={styles.innerBox}>
                <iframe
                    className="airtable-embed"
                    src="https://airtable.com/embed/appvX9mfhrPSMEzpW/shri2mTyxQijro3Ox"
                    // frameBorder="0"
                    onWheel={() => {}}
                    width="100%"
                    height="533"
                    style={{
                        // background: "transparent",
                        border: "1px solid #ccc",
                    }}
                    title="Airtable Embed"
                />
            </Box>  
        </Box>
    );
};

export default SchemaView;