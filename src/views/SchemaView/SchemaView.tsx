import { useState, useEffect } from 'react';
import { useUserContext } from '../../usercontext';
import { Box } from '@mui/material';
import { useNavigate } from "react-router-dom";
import Subheader from '../../components/Subheader/Subheader';
import { callAPI } from '../../util';
import { getSchema, uploadProcessorSchema } from '../../services/app.service';
import SchemaTable from '../../components/SchemaTable/SchemaTable';
import { SchemaOverview, MongoProcessor } from '../../types';
import UploadProcessorDialog from '../../components/UploadProcessorDialog/UploadProcessorDialog';

const SchemaView = () => {
    const navigate = useNavigate();
    const { userPermissions} = useUserContext();
    const [showUploadProcessor, setShowUploadProcessor] = useState(false);
    const [schemaData, setSchemaData] = useState<SchemaOverview>()
    const [loading, setLoading] = useState(true);


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

    const handleUploadDocument = (
        file: File,
        name: string,
        displayName: string,
        processorId: string,
        modelId: string,
        documentType: string
    ) => {
        const formData = new FormData();
        formData.append('file', file, file.name);
        callAPI(
            uploadProcessorSchema,
            [formData, name, displayName, processorId, modelId, documentType],
            successfulUpload,
            failedUpload,
        )
    }

    const successfulUpload = (data: any) => {
        console.log("success:")
        console.log(data)
        callAPI(
            getSchema,
            [],
            fetchedSchema,
            handleError
        );
    }

    const failedUpload = (data: any) => {
        console.log("failure:")
        console.log(data)
    }

    return (
        <Box sx={styles.outerBox}>
            <Subheader
                currentPage="Schema"
                buttonName={"Upload Processor"}
                handleClickButton={() => setShowUploadProcessor(true)}
            />
            <Box sx={styles.innerBox}>
                <SchemaTable schema={schemaData} loading={loading}/>
            </Box>
            {
                showUploadProcessor && 
                <UploadProcessorDialog
                    handleUploadDocument={handleUploadDocument}
                    setShowModal={setShowUploadProcessor}
                />
            }
            
        </Box>
    );
};

export default SchemaView;