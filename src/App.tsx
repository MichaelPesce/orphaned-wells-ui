import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import ProjectsListPage from './views/ProjectsListPage/ProjectsListPage';
import Project from './views/ProjectPage/ProjectPage';
import RecordGroup from './views/RecordGroupPage/RecordGroupPage';
import Record from './views/RecordPage/RecordPage';
import TeamRecordsPage from './views/TeamRecordsPage/TeamRecordsPage';
import AdminPage from './views/AdminPage/AdminPage';
import Header from './components/Header/Header';
import SchemaView from './views/SchemaView/SchemaView';
import './App.css';
import { DownloadProvider } from './context/DownloadContext';
import DownloadProgressBar from './components/DownloadProgressBar/DownloadProgressBar';
import { useUserContext } from './usercontext';
import StagingBanner from './components/StagingBanner/StagingBanner';

function App() {

    const { databaseEnvironment } = useUserContext();

  return (
    <DownloadProvider>
        <div className="App">
            {!window.location.href.includes("login") && 
                <Header/>
            }
            <StagingBanner isStaging={databaseEnvironment === "staging"}/>
            
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
                path="schema" 
                element={<SchemaView/>}
            />
            <Route
                path="*" 
                element={<Navigate replace to="projects" />}
            />
            </Routes>
            <DownloadProgressBar/>
        </div>
    </DownloadProvider>
  );
}

export default App;
