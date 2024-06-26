import React from 'react'; 
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';


export default function ErrorBar(props) {

    const handleErrorClose = () => {
        props.setOpen(false)
    }

    return ( 
      <Snackbar open={true} autoHideDuration={props.duration || 5000} onClose={handleErrorClose} style={props.margin && {marginBottom:'50px'}}>
        <Alert onClose={handleErrorClose} severity={props.severity || "error"}>
          {props.errorMessage}
        </Alert>
      </Snackbar>
      
    );
  
}