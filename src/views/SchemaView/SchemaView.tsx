import { useState, useEffect } from 'react';
import { useUserContext } from '../../usercontext';
import { Box } from '@mui/material';
import { useNavigate } from "react-router-dom";
import Subheader from '../../components/Subheader/Subheader';
import { callAPI } from '../../util';
import { getSchema } from '../../services/app.service';
import SchemaTable from '../../components/SchemaTable/SchemaTable';
import { SchemaRecord, SchemaMeta } from '../../types';
import EditSchemaDialog from '../../components/EditSchemaDialog/EditSchemaDialog';

const SchemaView = () => {
    const navigate = useNavigate();
    const { userPermissions} = useUserContext();
    // const [schemaRecords, setSchemaRecords] = useState<SchemaRecord[]>([])
    const [showEditSchema, setShowEditSchema] = useState(false);
    const [schemaData, setSchemaData] = useState<SchemaMeta>()
    const [loading, setLoading] = useState(true);
    const {
        AIRTABLE_BASE_ID,
        AIRTABLE_IFRAME_VIEW_ID
    } = schemaData || {};

    const AIRTABLE_IFRAME_SRC = `https://airtable.com/embed/${AIRTABLE_BASE_ID}/${AIRTABLE_IFRAME_VIEW_ID}`


    useEffect(() => {
        navigate("/"); // DISABLE THIS VIEW FOR NOW
        const hasAccess = userPermissions?.includes("system_administration");
        if (!hasAccess) navigate("/");
        callAPI(
            getSchema,
            [],
            fetchedSchema,
            handleError
        );
        
    }, [userPermissions, showEditSchema]);

    const fetchedSchema = (schema: SchemaMeta) => {
        setSchemaData(schema);
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
                // disableButton={!(userPermissions.includes("manage_schema"))}
            />
            <Box sx={styles.innerBox}>
                <EditSchemaDialog
                    open={showEditSchema}
                    onClose={() => setShowEditSchema(false)}
                    setErrorMsg={() => {}}
                    schemaData={schemaData}
                />
                {
                    loading && "loading..."
                }
                {
                    AIRTABLE_BASE_ID && AIRTABLE_IFRAME_VIEW_ID ? (
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
                    ) : !loading && (
                        <span>
                            To view your schema, please add your airtable api token, base id, and view id. For more information, <a href='https://support.airtable.com/docs/embedding-airtable-views' target='_blank'>see here</a>. <p>Airtable embeddings are in the format: https://airtable.com/embed/&#123;BASE_ID&#125;/&#123;VIEW_ID&#125;</p>
                        </span>
                    )
                }
                
            </Box>  
        </Box>
    );
};

export default SchemaView;