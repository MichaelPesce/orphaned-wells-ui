import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Subheader from '../../components/Subheader/Subheader';
import ProjectsListTable from '../../components/ProjectsListTable/ProjectsListTable';
import { getProjects } from '../../services/app.service';

export default function ProjectsListPage(props) {
    const [ projects, setProjects ] = useState([])
    const [ unableToConnect, setUnableToConnect ]  = useState(false)

    useEffect(()=> {
        console.log('getting projects')
        getProjects().then((response) => response.json()).then((data)=> {
            console.log('projects data: ')
            console.log(data)
            setProjects(data)
        }).catch((e) => {
            console.error(e)
            setUnableToConnect(true)
        })
    },[])

    const styles = {
        outerBox: {
            backgroundColor: "#F5F5F6",
            height: "100vh"
        },
        innerBox: {
            paddingY:5,
            paddingX:5,
        },
    }

    return (
        <Box sx={styles.outerBox}>
            <Subheader
                currentPage="Projects"
                buttonName="New Project"
            />
            <Box sx={styles.innerBox}>
                {!unableToConnect ? 
                    <ProjectsListTable projects={projects}/>
                :
                    <h1>Unable to connect to backend. Please make sure that backend server is up and running.</h1>
                }
                
            </Box>
            
        </Box>
        
    );

}