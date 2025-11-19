import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { checkAuth, } from './services/app.service';
import { callAPI } from './util';
import { User } from './types';
import LoginPage from './views/LoginPage/LoginPage';
import { ThemeProvider } from '@mui/material/styles';
import { ogrre_theme } from './themes/primaryTheme';

interface UserContextObject {
  user: any;
  userEmail: string;
  userName: string;
  userPhoto: string;
  userPermissions: any;
  databaseEnvironment: string;
}

interface AuthResponse {
  user_data: User;
  environment: string;
}

const UserContext = createContext({} as UserContextObject);

export const useUserContext = () => {
  return useContext(UserContext);
};

export const UserContextProvider = ({ children }: any) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [userPermissions, setUserPermissions] = useState<any>(undefined);
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false);
  const [databaseEnvironment, setDatabaseEnvironment] = useState("");

  useEffect(() => {
    if (!authenticated) {
      // check if logged in
      let id_token = localStorage.getItem("id_token")
      if (id_token !== null) {
        callAPI(
          checkAuth,
          [id_token],
          handlePassedAuthentication,
          handleFailedAuthentication
        )
      } else handleFailedAuthentication() // user has no id token so is not logged in
    }
    else setLoading(false)
    
  },[location]);

  const handlePassedAuthentication = (data: AuthResponse) => {
    const {
      user_data,
      environment,
    } = data || {};
    setAuthenticated(true)
    setUser(user_data)
    setUserEmail(user_data.email)
    setUserPermissions(JSON.stringify(user_data.permissions))
    if (user_data.name && user_data.name !== "") setUserName(user_data.name)
    if (user_data.picture) setUserPhoto(user_data.picture)
    if (window.location.href.includes("login")){
      navigate('/projects', { replace: true })
    }
    setLoading(false)
    setDatabaseEnvironment(environment);
  }

  const handleFailedAuthentication = () => {
    setAuthenticated(false)
    setLoading(false)
    if (!window.location.href.includes("login")) navigate('/login', {replace: true})
  }

  const handleSuccessfulLogin = (access_token: string, refresh_token: string, id_token: string) => {
    // gotta store credentials so they stay logged in
    localStorage.setItem("access_token", access_token)
    localStorage.setItem("refresh_token", refresh_token)
    localStorage.setItem("id_token", id_token)
    callAPI(
      checkAuth,
      [id_token],
      handlePassedAuthentication,
      handleFailedAuthentication
    )
  }

  const value = {
    user,
    userEmail,
    userName,
    userPhoto,
    userPermissions,
    databaseEnvironment,
  };

  return (
    <UserContext.Provider value={value}>
      <ThemeProvider theme={ogrre_theme}>
        {(!loading && authenticated) ? children :
        !loading &&
        <LoginPage handleSuccessfulAuthentication={handleSuccessfulLogin}/>
        }
      </ThemeProvider>
    </UserContext.Provider>
  );
};
