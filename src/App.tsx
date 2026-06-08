import React from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import ProjectsListPage from "./views/ProjectsListPage/ProjectsListPage";
import Project from "./views/ProjectPage/ProjectPage";
import RecordGroup from "./views/RecordGroupPage/RecordGroupPage";
import Record from "./views/RecordPage/RecordPage";
import TeamRecordsPage from "./views/TeamRecordsPage/TeamRecordsPage";
import AdminPage from "./views/AdminPage/AdminPage";
import LoginPage from "./views/LoginPage/LoginPage";
import Header from "./components/Header/Header";
import SchemaView from "./views/SchemaView/SchemaView";
import "./App.css";
import { DownloadProvider } from "./context/DownloadContext";
import DownloadProgressBar from "./components/DownloadProgressBar/DownloadProgressBar";
import { useUserContext } from "./usercontext";
import StagingBanner from "./components/StagingBanner/StagingBanner";

function ProtectedRoutes() {
  const location = useLocation();
  const { authLoading, isAuthenticated } = useUserContext();

  if (authLoading) return null;
  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />;
  }

  return <Outlet />;
}

function LoginRoute() {
  const {
    authLoading,
    isAuthenticated,
    handleSuccessfulAuthentication,
  } = useUserContext();

  if (authLoading) return null;
  if (isAuthenticated) return <Navigate replace to="/projects" />;

  return (
    <LoginPage
      handleSuccessfulAuthentication={handleSuccessfulAuthentication}
    />
  );
}

function App() {

  const location = useLocation();
  const { authLoading, databaseEnvironment, isAuthenticated } = useUserContext();
  const showAuthenticatedShell = (
    isAuthenticated &&
    !authLoading &&
    location.pathname !== "/login"
  );

  return (
    <DownloadProvider>
      <div className="App">
        {showAuthenticatedShell && <Header/>}
        {showAuthenticatedShell && (
          <StagingBanner isStaging={databaseEnvironment === "staging"}/>
        )}
            
        <Routes>
          <Route
            path="login"
            element={<LoginRoute />}
          />
          <Route element={<ProtectedRoutes />}>
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
              element={<Navigate replace to="/projects" />}
            />
          </Route>
        </Routes>
        {showAuthenticatedShell && <DownloadProgressBar/>}
      </div>
    </DownloadProvider>
  );
}

export default App;
