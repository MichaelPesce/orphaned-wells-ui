import { useEffect, useState, useRef } from 'react';
import { TextField, IconButton, Grid, Button, Dialog, DialogTitle, DialogContent, DialogContentText } from '@mui/material';
import { FormControlLabel, Switch, Stack, Box } from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';
import { updateSchema } from '../../services/app.service';
import { callAPI } from '../../util';
import { SchemaMeta } from '../../types';

interface EditSchemaDialogProps {
    open: boolean;
    onClose: () => void;
    setErrorMsg: (msg: string) => void;
    schemaData?: SchemaMeta
}

const EditSchemaDialog = ({ open, onClose, setErrorMsg, schemaData }: EditSchemaDialogProps) => {
    const [disableSaveButton, setDisableSaveButton] = useState(false);
    const [schemaName, setSchemaName] = useState("");
    const [useAirtable, setUseAirtable] = useState(true);
    const [baseID, setBaseID] = useState("");
    const [apiToken, setApiToken] = useState("");
    const [iframeViewID, setIframeViewID] = useState("")
    const dialogHeight = '50vh';
    const dialogWidth = '40vw';

    const descriptionElementRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (open) {
            const { current: descriptionElement } = descriptionElementRef;
            if (descriptionElement !== null) {
                descriptionElement.focus();
            }
            if (schemaData)
                fetchedSchema(schemaData)
        }
    }, [open]);

    const styles = {
        dialogPaper: {
            minHeight: dialogHeight,
            minWidth: dialogWidth,
        },
        projectName: {
            marginBottom: 2
        },
    };


    const handleClose = () => {
        onClose();
    };

    const hanldeSaveChanges = () => {
        let body = {
            schema_name: schemaName,
            use_airtable: useAirtable,
            AIRTABLE_API_TOKEN: apiToken,
            AIRTABLE_BASE_ID: baseID,
            AIRTABLE_IFRAME_VIEW_ID: iframeViewID
        };
        callAPI(
            updateSchema,
            [body],
            updatedSchema,
            handleError
        );
    };

    const fetchedSchema = (schema: SchemaMeta) => {
        const {
            schema_name,
            use_airtable,
            AIRTABLE_API_TOKEN,
            AIRTABLE_BASE_ID,
            AIRTABLE_IFRAME_VIEW_ID
        } = schema || {};
        setSchemaName(schema_name || '');
        setUseAirtable(use_airtable);
        setApiToken(AIRTABLE_API_TOKEN || '');
        setBaseID(AIRTABLE_BASE_ID || '');
        setIframeViewID(AIRTABLE_IFRAME_VIEW_ID || '');
    };

    const updatedSchema = (data: any) => {
        console.log("updated schema successfully")
        console.log(data)
        onClose()
    };

    const handleError = (e: string) => {
        console.log("handle error:")
        console.log(e)
        setErrorMsg(e)
        onClose()
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            scroll={"paper"}
            aria-labelledby="edit-schema-dialog"
            aria-describedby="edit-schema-dialog-description"
            PaperProps={{
                sx: {
                display: 'flex',
                flexDirection: 'column',
                }
            }}

        >
            <DialogTitle id="edit-schema-dialog-title"><b>Edit Schema</b></DialogTitle>
            <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{
                    position: 'absolute',
                    right: 0,
                    top: 8,
                }}
            >
                <CloseIcon />
            </IconButton>
            <DialogContent dividers={true} sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <DialogContentText
                    id="scroll-dialog-description"
                    ref={descriptionElementRef}
                    tabIndex={-1}
                    aria-labelledby="edit-schema-dialog-content-text"
                    component={'span'}
                >
                    <Grid container>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Schema Name"
                                variant="outlined"
                                value={schemaName}
                                onChange={(event) => setSchemaName(event.target.value)}
                                sx={styles.projectName}
                                id="schema-name-textbox"
                            />
                            <HiddenTextInput
                                key="api_token"
                                displayName='Airtable API Token'
                                value={apiToken}
                                setValue={setApiToken}
                            />
                            <HiddenTextInput
                                key="base_id"
                                displayName='Airtable Base ID'
                                value={baseID}
                                setValue={setBaseID}
                            />
                            <HiddenTextInput
                                key="view_id"
                                displayName='Airtable View ID'
                                value={iframeViewID}
                                setValue={setIframeViewID}
                            />
                        </Grid>

                        
                    </Grid>
                </DialogContentText>
                <Box sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between">
                    <FormControlLabel
                        control={<Switch />}
                        label="Use Airtable"
                        onChange={(e) => setUseAirtable((e.target as HTMLInputElement).checked)}
                        checked={useAirtable}
                    />
                    <Button
                        variant="contained"
                        disabled={disableSaveButton}
                        onClick={hanldeSaveChanges}
                    >
                        Save changes
                    </Button>
                    </Stack>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

export default EditSchemaDialog;

interface HiddenTextInputProps {
    // key: string;
    displayName: string;
    value: string;
    setValue: (v: string) => void;
    disabled?: boolean;
}

function HiddenTextInput(props: HiddenTextInputProps) {
    const {
        displayName, value, setValue, disabled
    } = props;
    // const [value, setValue] = useState('');
    const [show, setShow] = useState(false);

    const handleToggleShow = () => setShow(!show);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => setValue(event.target.value);

    return (
        <TextField
            label={displayName}
            type={show ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            sx={{marginBottom: 2}}
            disabled={disabled}
            InputProps={{
                endAdornment: (
                <InputAdornment position="end">
                    <IconButton
                    aria-label="toggle visibility"
                    onClick={handleToggleShow}
                    edge="end"
                    >
                    {show ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                </InputAdornment>
                ),
            }}
        />
    );
}
