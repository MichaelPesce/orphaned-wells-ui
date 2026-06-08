import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { checkAuth, } from "./services/app.service";
import { callAPI } from "./util";
import { User } from "./types";
import { ThemeProvider } from "@mui/material/styles";
import { ogrre_theme } from "./themes/primaryTheme";

interface UserContextObject {
  user: any;
  userEmail: string;
  userName: string;
  userPhoto: string;
  hasPermission: (permission: string) => boolean;
  databaseEnvironment: string;
  isAuthenticated: boolean;
  authLoading: boolean;
  handleSuccessfulAuthentication: () => void;
}

interface AuthResponse {
  user_data: User;
  environment: string;
}

const anonymousDisabledPermissions = new Set([
  "add_user",
  "manage_team",
  "manage_system",
  "system_administration",
]);

const UserContext = createContext({} as UserContextObject);

export const useUserContext = () => {
  return useContext(UserContext);
};

export const UserContextProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [userPermissions, setUserPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [databaseEnvironment, setDatabaseEnvironment] = useState("");

  const resetUser = useCallback(() => {
    setUser(null);
    setUserEmail("");
    setUserName("");
    setUserPhoto("");
    setUserPermissions(new Set());
    setDatabaseEnvironment("");
  }, []);

  const handlePassedAuthentication = useCallback((data: AuthResponse) => {
    const {
      user_data,
      environment,
    } = data || {};
    setAuthenticated(true);
    setUser(user_data);
    setUserEmail(user_data.email);
    setUserPermissions(new Set(Array.isArray(user_data.permissions) ? user_data.permissions : []));
    setUserName(user_data.name || "");
    setUserPhoto(user_data.picture || "");
    setLoading(false);
    setDatabaseEnvironment(environment || "");
  }, []);

  const handleFailedAuthentication = useCallback(() => {
    setAuthenticated(false);
    resetUser();
    setLoading(false);
  }, [resetUser]);

  const checkCurrentAuthentication = useCallback((showLoading = true) => {
    if (showLoading) setLoading(true);
    callAPI(
      checkAuth,
      [],
      handlePassedAuthentication,
      handleFailedAuthentication,
      true,
      false
    );
  }, [handlePassedAuthentication, handleFailedAuthentication]);

  useEffect(() => {
    checkCurrentAuthentication();
  }, [checkCurrentAuthentication]);

  const handleSuccessfulLogin = useCallback(() => {
    checkCurrentAuthentication(false);
  }, [checkCurrentAuthentication]);

  const hasPermission = useCallback((permission: string) => {
    if (user?.anonymous) return !anonymousDisabledPermissions.has(permission);
    return userPermissions.has(permission);
  }, [user, userPermissions]);

  const value = useMemo(() => ({
    user,
    userEmail,
    userName,
    userPhoto,
    hasPermission,
    databaseEnvironment,
    isAuthenticated: authenticated,
    authLoading: loading,
    handleSuccessfulAuthentication: handleSuccessfulLogin,
  }), [
    user,
    userEmail,
    userName,
    userPhoto,
    hasPermission,
    databaseEnvironment,
    authenticated,
    loading,
    handleSuccessfulLogin,
  ]);

  return (
    <UserContext.Provider value={value}>
      <ThemeProvider theme={ogrre_theme}>
        {children}
      </ThemeProvider>
    </UserContext.Provider>
  );
};
