import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { useGoogleLogin } from "@react-oauth/google";
import GoogleIcon from "@mui/icons-material/Google";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { authLogin, getAuthProviders } from "../../services/app.service";
import { AuthProvidersResponse, AuthProviderType } from "../../types";
import { LoginPageStyles as styles } from "../../styles";

interface LoginPageProps {
  handleSuccessfulAuthentication: () => void;
}

export interface CilogonIdpOption {
  label: string;
  entityId: string;
}

export const CILOGON_IDP_OPTIONS: CilogonIdpOption[] = [
  {
    label: "Lawrence Berkeley National Laboratory (LBL)",
    entityId: "urn:mace:incommon:lbl.gov",
  },
  {
    label: "Pacific Northwest National Laboratory (PNNL)",
    entityId: "https://sso.pnnl.gov/idp",
  },
  {
    label: "Lawrence Livermore National Laboratory (LLNL)",
    entityId: "https://eidp.llnl.gov",
  },
  {
    label: "Oak Ridge National Laboratory (ORNL)",
    entityId: "https://idp.ornl.gov/idp",
  },
  {
    label: "Argonne National Laboratory (ANL)",
    entityId: "https://identityprovider.anl.gov/idp/shibboleth",
  },
  {
    label: "ORCID",
    entityId: "http://orcid.org/oauth/authorize",
  },
];

const CILOGON_STATE_STORAGE_KEY = "ogrre_cilogon_oauth_state";
const CILOGON_REDIRECT_STORAGE_KEY = "ogrre_cilogon_redirect_uri";
const CILOGON_CALLBACK_PATH = "/auth/cilogon/callback";
const DEFAULT_CILOGON_AUTHORIZE_URI = "https://cilogon.org/authorize";
const DEFAULT_CILOGON_SCOPE = "openid email profile org.cilogon.userinfo";
const DEFAULT_UNAUTHORIZED_MESSAGE =
  "You are not authorized to access this application. Please login with a different account or contact the development team to gain access.";

const LoginPage = (props: LoginPageProps) => {
  const { handleSuccessfulAuthentication } = props;
  const envCilogonClientId = process.env.REACT_APP_CILOGON_CLIENTID || "";

  const [googleEnabled, setGoogleEnabled] = useState(true);
  const [cilogonEnabled, setCilogonEnabled] = useState(Boolean(envCilogonClientId));
  const [cilogonClientId, setCilogonClientId] = useState(envCilogonClientId);
  const [cilogonAuthorizeUri, setCilogonAuthorizeUri] = useState(DEFAULT_CILOGON_AUTHORIZE_URI);
  const [cilogonScope, setCilogonScope] = useState(DEFAULT_CILOGON_SCOPE);
  const [selectedIdp, setSelectedIdp] = useState<string>(
    CILOGON_IDP_OPTIONS[0].entityId
  );
  const [authenticatingProvider, setAuthenticatingProvider] = useState<AuthProviderType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handledCallbackRef = useRef(false);

  const completeCodeExchange = useCallback(
    async (code: string, provider?: AuthProviderType, redirectUri?: string) => {
      setErrorMessage(null);
      setAuthenticatingProvider(provider || "google");
      try {
        const response = provider
          ? await authLogin(code, provider, redirectUri)
          : await authLogin(code);
        let data: { detail?: { message?: string } | string } = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (response.status === 200) {
          handleSuccessfulAuthentication();
          return;
        }

        if (response.status === 403) {
          const detailMessage =
            typeof data?.detail === "object" ? data?.detail?.message : undefined;
          setErrorMessage(
            detailMessage
              ? `${detailMessage} ${DEFAULT_UNAUTHORIZED_MESSAGE}`
              : DEFAULT_UNAUTHORIZED_MESSAGE
          );
        } else {
          const detailMessage =
            typeof data?.detail === "object"
              ? data?.detail?.message
              : typeof data?.detail === "string"
                ? data.detail
                : undefined;
          setErrorMessage(detailMessage || "Unable to sign in. Please try again.");
        }
      } catch (e) {
        console.error("error trying to login: " + e);
        setErrorMessage("Unable to connect to authentication service. Please try again.");
      } finally {
        setAuthenticatingProvider(null);
      }
    },
    [handleSuccessfulAuthentication]
  );

  useEffect(() => {
    let active = true;
    getAuthProviders()
      .then((res) => (res.ok ? res.json() : null))
      .then((data: AuthProvidersResponse | null) => {
        if (!active || !data) return;
        const nextGoogle = data.google ? Boolean(data.google.enabled) : true;
        const nextCilogonClientId = data.cilogon?.client_id || envCilogonClientId;
        const nextCilogon =
          data.cilogon !== undefined
            ? Boolean(data.cilogon.enabled && nextCilogonClientId)
            : Boolean(envCilogonClientId);
        setGoogleEnabled(nextGoogle || !nextCilogon);
        setCilogonEnabled(nextCilogon);
        if (nextCilogonClientId) {
          setCilogonClientId(nextCilogonClientId);
        }
        if (data.cilogon?.authorize_uri) {
          setCilogonAuthorizeUri(data.cilogon.authorize_uri);
        }
        if (data.cilogon?.scope) {
          setCilogonScope(data.cilogon.scope);
        }
      })
      .catch(() => {
        // Keep default provider state when backend provider discovery is unavailable.
      });
    return () => {
      active = false;
    };
  }, [envCilogonClientId]);

  useEffect(() => {
    if (handledCallbackRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const oauthError = params.get("error");
    const oauthErrorDescription = params.get("error_description");

    if (!code && !oauthError) return;
    handledCallbackRef.current = true;

    if (window.history?.replaceState) {
      window.history.replaceState({}, document.title, "/login");
    }

    const expectedState = sessionStorage.getItem(CILOGON_STATE_STORAGE_KEY);
    const storedRedirectUri =
      sessionStorage.getItem(CILOGON_REDIRECT_STORAGE_KEY) ||
      `${window.location.origin}${CILOGON_CALLBACK_PATH}`;
    sessionStorage.removeItem(CILOGON_STATE_STORAGE_KEY);
    sessionStorage.removeItem(CILOGON_REDIRECT_STORAGE_KEY);

    if (oauthError) {
      setErrorMessage(
        oauthErrorDescription || `Institutional sign-in failed (${oauthError}).`
      );
      return;
    }

    if (expectedState && state !== expectedState) {
      setErrorMessage("Sign-in session expired or state mismatch. Please try again.");
      return;
    }

    if (code) {
      completeCodeExchange(code, "cilogon", storedRedirectUri);
    }
  }, [completeCodeExchange]);

  const googleLogin = useGoogleLogin({
    onSuccess: async ({ code }: { code: string }) => {
      await completeCodeExchange(code);
    },
    flow: "auth-code",
  });

  const handleSelectedIdpChange = (event: SelectChangeEvent<string>) => {
    setSelectedIdp(event.target.value);
  };

  const handleCilogonLogin = () => {
    if (!cilogonClientId) {
      setErrorMessage("CILogon client ID is not configured.");
      return;
    }
    setErrorMessage(null);
    setAuthenticatingProvider("cilogon");

    const redirectUri = `${window.location.origin}${CILOGON_CALLBACK_PATH}`;
    const randomPart =
      typeof window.crypto?.randomUUID === "function"
        ? window.crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    const state = `cilogon_${randomPart}`;

    sessionStorage.setItem(CILOGON_STATE_STORAGE_KEY, state);
    sessionStorage.setItem(CILOGON_REDIRECT_STORAGE_KEY, redirectUri);

    const authorizeUrl = new URL(cilogonAuthorizeUri);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", cilogonClientId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("scope", cilogonScope);
    authorizeUrl.searchParams.set("state", state);
    if (selectedIdp) {
      authorizeUrl.searchParams.set("idphint", selectedIdp);
    }

    window.location.assign(authorizeUrl.toString());
  };

  const isBusy = authenticatingProvider !== null;

  return (
    <Box sx={styles.outerBox}>
      <Box sx={styles.cardBox} role="region" aria-label="Sign in to OGRRE">
        <Box sx={styles.logoContainer}>
          <img
            src={`${process.env.PUBLIC_URL}/img/OGRRE_logo.svg`}
            width="88"
            alt="OGRRE logo"
          />
        </Box>
        <Typography sx={styles.title} variant="h5" component="h1">
          OGRRE
        </Typography>
        <Typography sx={styles.subtitle} variant="body2">
        </Typography>

        <Box sx={styles.buttonStack}>
          {googleEnabled && (
            <Button
              id="login-button"
              data-cy="google-login-button"
              onClick={() => {
                setErrorMessage(null);
                googleLogin();
              }}
              variant="contained"
              fullWidth
              disabled={isBusy}
              sx={styles.primaryButton}
              startIcon={
                authenticatingProvider === "google" ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <GoogleIcon />
                )
              }
            >
              Login with Google
            </Button>
          )}

          {googleEnabled && cilogonEnabled && (
            <Divider sx={styles.divider}>or</Divider>
          )}

          {cilogonEnabled && (
            <Box sx={styles.cilogonGroup}>
              <FormControl fullWidth size="small" disabled={isBusy}>
                <InputLabel id="cilogon-idp-select-label">
                  Institution
                </InputLabel>
                <Select
                  labelId="cilogon-idp-select-label"
                  id="cilogon-idp-select"
                  data-cy="cilogon-idp-select"
                  value={selectedIdp}
                  label="Institution"
                  onChange={handleSelectedIdpChange}
                  sx={styles.idpSelect}
                >
                  {CILOGON_IDP_OPTIONS.map((option) => (
                    <MenuItem key={option.entityId} value={option.entityId}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                id="cilogon-login-button"
                data-cy="cilogon-login-button"
                onClick={handleCilogonLogin}
                variant={googleEnabled ? "outlined" : "contained"}
                fullWidth
                disabled={isBusy}
                sx={googleEnabled ? styles.secondaryButton : styles.primaryButton}
                startIcon={
                  authenticatingProvider === "cilogon" ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <AccountBalanceIcon />
                  )
                }
              >
                {authenticatingProvider === "cilogon"
                  ? "Signing in with CILogon..."
                  : "Login with Institutional Account"}
              </Button>
            </Box>
          )}
        </Box>

        {errorMessage && (
          <Alert
            severity="error"
            variant="outlined"
            sx={styles.alert}
            data-cy="login-error-alert"
          >
            {errorMessage}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default LoginPage;
