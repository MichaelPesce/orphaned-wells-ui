import { useState, useEffect } from 'react';
import { useUserContext } from '../../usercontext';
import { Box } from '@mui/material';
import { useNavigate } from "react-router-dom";
import Subheader from '../../components/Subheader/Subheader';
import { callAPI } from '../../util';
import { getSchema } from '../../services/app.service';
import SchemaTable from '../../components/SchemaTable/SchemaTable';
import { SchemaOverview, MongoProcessor } from '../../types';
import EditSchemaDialog from '../../components/EditSchemaDialog/EditSchemaDialog';

const SchemaView = () => {
    const navigate = useNavigate();
    const { userPermissions} = useUserContext();
    // const [schemaRecords, setSchemaRecords] = useState<SchemaRecord[]>([])
    const [showEditSchema, setShowEditSchema] = useState(false);
    const [schemaData, setSchemaData] = useState<SchemaOverview>()
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const hasAccess = userPermissions?.includes("system_administration");
        if (!hasAccess) navigate("/");
        callAPI(
            getSchema,
            [],
            fetchedSchema,
            handleError
        );
        
    }, [userPermissions, showEditSchema]);

    const fetchedSchema = (processors: MongoProcessor[]) => {
        // console.log(schema)
        setSchemaData({
            processors: processors
        });
        setLoading(false);
    };

    const handleError = (e: string) => {
        console.log("handle error:")
        console.log(e)
        setLoading(false);
    }

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
                handleClickButton={() => setShowEditSchema(true)}
            />
            <Box sx={styles.innerBox}>
                <SchemaTable schema={schemaData} loading={loading}/>
            </Box>  
        </Box>
    );
};

export default SchemaView;