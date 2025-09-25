import { useState, useEffect } from 'react';
import { useUserContext } from '../../usercontext';
import { Box } from '@mui/material';
import { useNavigate } from "react-router-dom";
import Subheader from '../../components/Subheader/Subheader';
import { callAPI } from '../../util';
import { getAirtableTable, getAirtableBases } from '../../services/airtable.service';
import SchemaTable from '../../components/SchemaTable/SchemaTable';
import { SchemaRecord } from '../../types';

const SchemaView = () => {
    const navigate = useNavigate();
    const { userPermissions} = useUserContext();
    const [schemaRecords, setSchemaRecords] = useState<SchemaRecord[]>([])
    const AIRTABLE_IFRAME_SRC = `https://airtable.com/embed/${process.env.REACT_APP_AIRTABLE_BASE_ID}/${process.env.REACT_APP_AIRTABLE_PROCESSORS_VIEW_ID}`

    const handleFetchedBases = (data: any) => {
        console.log("fetched bases")
        console.log(data)
        // setSchemaRecords(data?.records)
    }

    const handleFetchedProcessorData = (data: any) => {
        console.log("fetched processor data from airtable")
        console.log(data)
        setSchemaRecords(data?.records)
    }

    const handleFailure = (e: any) => {
        console.log('failed to get airtable data:')
        console.log(e)
    }

    useEffect(() => {
        const hasAccess = userPermissions?.includes("system_administration");
        if (!hasAccess) navigate("/");
        // callAPI(
        //     getAirtableTable,
        //     [],
        //     handleFetchedProcessorData,
        //     handleFailure,
        // )
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
                currentPage="Schema"
                buttonName={"Edit Schema"}
                // handleClickButton={handleClickNewProject}
            />
            <Box sx={styles.innerBox}>
                {/* <SchemaTable records={schemaRecords}/> */}
                <iframe
                    className="airtable-embed"
                    src={AIRTABLE_IFRAME_SRC}
                    // frameBorder="0"
                    onWheel={() => {}}
                    width="100%"
                    height="533"
                    style={{
                        background: "transparent",
                        border: "1px solid #ccc",
                    }}
                    title="Airtable Embed"
                />
            </Box>  
        </Box>
    );
};

export default SchemaView;