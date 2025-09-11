import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import ProjectsListPage from './views/ProjectsListPage/ProjectsListPage';
import Project from './views/ProjectPage/ProjectPage';
import RecordGroup from './views/RecordGroupPage/RecordGroupPage';
import Record from './views/RecordPage/RecordPage';
import TeamRecordsPage from './views/TeamRecordsPage/TeamRecordsPage';
import AdminPage from './views/AdminPage/AdminPage';
import Header from './components/Header/Header';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: "#000",
      contrastText: "#fff" //button text white instead of black
    },
    secondary: {
      main: "#54E385",
      contrastText: "#262F32",
    }
  },
  typography: {
    button: {
      fontWeight: 500, // Default font weight for all buttons
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { // Common styles for all buttons
          // textTransform: "none", // Prevent uppercase text
          // we'll want to be more precise with our casing before making this ^ change, though it would allow for more control
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: "#333", // Slightly lighter black for hover
          },
        },
        containedSecondary: {
          "&:hover": {
            backgroundColor: "#45D074", // Darker green for hover
          },
        },
        outlinedSecondary: {
          color: '#45D074',
          "&:hover": {
            borderColor: "#3EBB68",
            color: "3EBB68",
          },
        },
      },
    },
  },
});

function App() {

  return (
    <ThemeProvider theme={theme}>
    <div className="App">
          {!window.location.href.includes("login") && 
            <Header/>
          }
          
          <Routes> 
          <Route 
              path="record/:id" 
              element={<Record />}
          />
          <Route 
              path="project/:id" 
              element={<Project />}
          />
          <Route 
              path="record_group/:id" 
              element={<RecordGroup />}
          />
          <Route 
              path="records" 
              element={<TeamRecordsPage />}
          />
          <Route 
              path="projects" 
              element={<ProjectsListPage/>} 
          />
          <Route
              path="users" 
              element={<AdminPage/>}
          />
          <Route
              path="*" 
              element={<Navigate replace to="projects" />}
          />
          </Routes>
    </div>
    </ThemeProvider>
  );
}

export default App;
