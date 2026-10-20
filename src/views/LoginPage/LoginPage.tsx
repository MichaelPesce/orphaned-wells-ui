import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from "@mui/material";
import { useGoogleLogin } from "@react-oauth/google";
import GoogleIcon from "@mui/icons-material/Google";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import { authLogin, getAuthProviders } from "../../services/app.service";
import {
  AuthProvidersResponse,
  AuthProviderType,
  CilogonIdpOption,
} from "../../types";
import { LoginPageStyles as styles } from "../../styles";

interface LoginPageProps {
  handleSuccessfulAuthentication: () => void;
}

const normalizeIdpOptions = (
  items?: CilogonIdpOption[] | null
): CilogonIdpOption[] => {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const result: CilogonIdpOption[] = [];
  for (const item of items) {
    const label = (item?.label || "").trim();
    const entityId = (item?.entityId || "").trim();
    const logo = (item?.logo || "").trim();
    if (label && entityId && !seen.has(entityId)) {
      seen.add(entityId);
      result.push(logo ? { label, entityId, logo } : { label, entityId });
    }
  }
  return result;
};

const resolveIdpLogoSrc = (logo?: string): string | undefined => {
  if (!logo) return undefined;
  const publicUrl = process.env.PUBLIC_URL || "";
  if (logo.startsWith("/") && publicUrl && !logo.startsWith(publicUrl)) {
    return `${publicUrl}${logo}`;
  }
  return logo;
};

const IdpOptionContent = ({ option }: { option: CilogonIdpOption }) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const logoSrc = resolveIdpLogoSrc(option.logo);

  useEffect(() => {
    setLogoFailed(false);
  }, [option.logo]);

  return (
    <Box sx={styles.idpOptionRow}>
      {logoSrc && !logoFailed ? (
        <Box sx={styles.idpLogoBox}>
          <Box
            component="img"
            src={logoSrc}
            alt=""
            aria-hidden="true"
            data-testid="idp-option-logo"
            data-idp-entity-id={option.entityId}
            onError={() => setLogoFailed(true)}
            sx={styles.idpLogoImg}
          />
        </Box>
      ) : (
        <Box
          sx={styles.idpLogoPlaceholder}
          aria-hidden="true"
          data-testid="idp-option-placeholder"
          data-idp-entity-id={option.entityId}
        >
          <AccountBalanceIcon sx={styles.idpPlaceholderIcon} />
        </Box>
      )}
      <Box component="span" sx={styles.idpOptionLabel}>
        {option.label}
      </Box>
    </Box>
  );
};

const GOOGLE_STATE_STORAGE_KEY = "ogrre_google_oauth_state";
const GOOGLE_REDIRECT_STORAGE_KEY = "ogrre_google_redirect_uri";
const GOOGLE_CALLBACK_PATH = "/auth/google/callback";
const CILOGON_STATE_STORAGE_KEY = "ogrre_cilogon_oauth_state";
const CILOGON_REDIRECT_STORAGE_KEY = "ogrre_cilogon_redirect_uri";
const CILOGON_SELECTED_IDP_STORAGE_KEY = "ogrre_cilogon_selected_idp";
const CILOGON_IDP_OPTIONS_STORAGE_KEY = "ogrre_cilogon_idp_options";
const CILOGON_CALLBACK_PATH = "/auth/cilogon/callback";
const DEFAULT_CILOGON_AUTHORIZE_URI = "https://cilogon.org/authorize";
const DEFAULT_CILOGON_SCOPE = "openid email profile org.cilogon.userinfo";
const DEFAULT_UNAUTHORIZED_MESSAGE =
  "You are not authorized to access this application. Please login with a different account or contact the development team to gain access.";

const ORCID_EMAIL_VISIBILITY_DOCS_URL =
  "https://support.orcid.org/hc/en-us/articles/360006897614-Visibility-settings";
const ORCID_EMAIL_VISIBILITY_DOCS_LABEL =
  "View ORCID visibility settings documentation";

const readStoredIdpOptions = (): CilogonIdpOption[] => {
  try {
    const raw = sessionStorage.getItem(CILOGON_IDP_OPTIONS_STORAGE_KEY);
    if (!raw) return [];
    return normalizeIdpOptions(JSON.parse(raw));
  } catch {
    return [];
  }
};

const readStoredSelectedIdp = (): string => {
  try {
    return sessionStorage.getItem(CILOGON_SELECTED_IDP_STORAGE_KEY) || "";
  } catch {
    return "";
  }
};

const createOAuthState = (prefix: AuthProviderType): string => {
  const randomPart =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}_${randomPart}`;
};

const LoginPage = (props: LoginPageProps) => {
  const { handleSuccessfulAuthentication } = props;
  const envCilogonClientId = process.env.REACT_APP_CILOGON_CLIENTID || "";

  const [googleEnabled, setGoogleEnabled] = useState(true);
  const [googleOAuthState] = useState(() => createOAuthState("google"));
  const [cilogonEnabled, setCilogonEnabled] = useState(() =>
    Boolean(
      envCilogonClientId ||
        readStoredIdpOptions().length > 0 ||
        sessionStorage.getItem(CILOGON_STATE_STORAGE_KEY)
    )
  );
  const [cilogonClientId, setCilogonClientId] = useState(envCilogonClientId);
  const [cilogonAuthorizeUri, setCilogonAuthorizeUri] = useState(DEFAULT_CILOGON_AUTHORIZE_URI);
  const [cilogonScope, setCilogonScope] = useState(DEFAULT_CILOGON_SCOPE);
  const [idpOptions, setIdpOptions] = useState<CilogonIdpOption[]>(readStoredIdpOptions);
  const [selectedIdp, setSelectedIdp] = useState<string>(readStoredSelectedIdp);
  const [authenticatingProvider, setAuthenticatingProvider] = useState<AuthProviderType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorHelpLink, setErrorHelpLink] = useState<{
    url: string;
    label: string;
  } | null>(null);
  const handledCallbackRef = useRef(false);
  const isExchangingCodeRef = useRef(false);

  const completeCodeExchange = useCallback(
    async (code: string, provider?: AuthProviderType, redirectUri?: string) => {
      setErrorMessage(null);
      setErrorHelpLink(null);
      isExchangingCodeRef.current = true;
      setAuthenticatingProvider(provider || "google");
      let succeeded = false;
      try {
        const response = provider
          ? await authLogin(code, provider, redirectUri)
          : await authLogin(code);
        let data: {
          detail?:
            | {
                detail_key?: string;
                message?: string;
                help_url?: string;
                help_label?: string;
              }
            | string;
        } = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (response.status === 200) {
          succeeded = true;
          handleSuccessfulAuthentication();
          return;
        }

        if (response.status === 403) {
          const detailObj =
            typeof data?.detail === "object" && data?.detail !== null
              ? data.detail
              : undefined;
          const detailMessage = detailObj?.message;
          const isMissingEmail =
            detailObj?.detail_key === "missing_email" ||
            Boolean(detailMessage?.includes("not associated with an email"));
          const helpUrl =
            detailObj?.help_url ||
            (isMissingEmail ? ORCID_EMAIL_VISIBILITY_DOCS_URL : undefined);
          const helpLabel =
            detailObj?.help_label ||
            (isMissingEmail ? ORCID_EMAIL_VISIBILITY_DOCS_LABEL : undefined);
          if (helpUrl && helpLabel) {
            setErrorHelpLink({ url: helpUrl, label: helpLabel });
          }
          setErrorMessage(
            detailMessage
              ? `${detailMessage}`
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
        isExchangingCodeRef.current = false;
        if (!succeeded) {
          setAuthenticatingProvider(null);
        }
      }
    },
    [handleSuccessfulAuthentication]
  );

  useEffect(() => {
    const resetRedirectState = () => {
      if (!isExchangingCodeRef.current) {
        setAuthenticatingProvider(null);
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetRedirectState();
      }
    };

    window.addEventListener("pageshow", resetRedirectState);
    window.addEventListener("pagehide", resetRedirectState);
    window.addEventListener("popstate", resetRedirectState);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", resetRedirectState);
      window.removeEventListener("pagehide", resetRedirectState);
      window.removeEventListener("popstate", resetRedirectState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

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
        const nextOptions = normalizeIdpOptions(data.cilogon?.idp_options);
        if (nextOptions.length > 0) {
          setIdpOptions(nextOptions);
          sessionStorage.setItem(
            CILOGON_IDP_OPTIONS_STORAGE_KEY,
            JSON.stringify(nextOptions)
          );
          setSelectedIdp((prev) => {
            const storedIdp = readStoredSelectedIdp();
            const candidate = prev || storedIdp;
            const resolved = nextOptions.some((opt) => opt.entityId === candidate)
              ? candidate
              : nextOptions[0]?.entityId || "";
            if (resolved) {
              sessionStorage.setItem(CILOGON_SELECTED_IDP_STORAGE_KEY, resolved);
            }
            return resolved;
          });
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

    const pathname = window.location.pathname;
    const isGoogleCallback =
      pathname === GOOGLE_CALLBACK_PATH ||
      Boolean(state && state.startsWith("google_")) ||
      (!pathname.includes("cilogon") &&
        !state?.startsWith("cilogon_") &&
        Boolean(sessionStorage.getItem(GOOGLE_STATE_STORAGE_KEY)));

    if (window.history?.replaceState) {
      window.history.replaceState({}, document.title, "/login");
    }

    const callbackProvider: AuthProviderType = isGoogleCallback ? "google" : "cilogon";
    const stateStorageKey = isGoogleCallback
      ? GOOGLE_STATE_STORAGE_KEY
      : CILOGON_STATE_STORAGE_KEY;
    const redirectStorageKey = isGoogleCallback
      ? GOOGLE_REDIRECT_STORAGE_KEY
      : CILOGON_REDIRECT_STORAGE_KEY;
    const defaultCallbackPath = isGoogleCallback
      ? GOOGLE_CALLBACK_PATH
      : CILOGON_CALLBACK_PATH;

    const expectedState = sessionStorage.getItem(stateStorageKey);
    const storedRedirectUri =
      sessionStorage.getItem(redirectStorageKey) ||
      `${window.location.origin}${defaultCallbackPath}`;
    sessionStorage.removeItem(stateStorageKey);
    sessionStorage.removeItem(redirectStorageKey);

    if (oauthError) {
      const providerLabel = isGoogleCallback ? "Google" : "Institutional";
      setErrorMessage(
        oauthErrorDescription || `${providerLabel} sign-in failed (${oauthError}).`
      );
      return;
    }

    if (expectedState && state !== expectedState) {
      setErrorMessage("Sign-in session expired or state mismatch. Please try again.");
      return;
    }

    if (code) {
      completeCodeExchange(code, callbackProvider, storedRedirectUri);
    }
  }, [completeCodeExchange]);

  const googleRedirectUri = `${window.location.origin}${GOOGLE_CALLBACK_PATH}`;

  const googleLogin = useGoogleLogin({
    onSuccess: async ({ code }: { code: string }) => {
      sessionStorage.removeItem(GOOGLE_STATE_STORAGE_KEY);
      sessionStorage.removeItem(GOOGLE_REDIRECT_STORAGE_KEY);
      await completeCodeExchange(code);
    },
    flow: "auth-code",
    ux_mode: "redirect",
    redirect_uri: googleRedirectUri,
    state: googleOAuthState,
  });

  const handleGoogleLogin = () => {
    setErrorMessage(null);
    setErrorHelpLink(null);
    setAuthenticatingProvider("google");
    sessionStorage.setItem(GOOGLE_STATE_STORAGE_KEY, googleOAuthState);
    sessionStorage.setItem(GOOGLE_REDIRECT_STORAGE_KEY, googleRedirectUri);
    googleLogin();
  };

  const handleSelectedIdpChange = (event: SelectChangeEvent<string>) => {
    const nextIdp = event.target.value;
    setSelectedIdp(nextIdp);
    sessionStorage.setItem(CILOGON_SELECTED_IDP_STORAGE_KEY, nextIdp);
  };

  const handleCilogonLogin = () => {
    if (!cilogonClientId) {
      setErrorHelpLink(null);
      setErrorMessage("CILogon client ID is not configured.");
      return;
    }
    setErrorMessage(null);
    setErrorHelpLink(null);
    setAuthenticatingProvider("cilogon");

    const redirectUri = `${window.location.origin}${CILOGON_CALLBACK_PATH}`;
    const state = createOAuthState("cilogon");

    sessionStorage.setItem(CILOGON_STATE_STORAGE_KEY, state);
    sessionStorage.setItem(CILOGON_REDIRECT_STORAGE_KEY, redirectUri);
    if (selectedIdp) {
      sessionStorage.setItem(CILOGON_SELECTED_IDP_STORAGE_KEY, selectedIdp);
    }

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
              onClick={handleGoogleLogin}
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
              {idpOptions.length > 0 && (
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
                    {idpOptions.map((option) => (
                      <MenuItem key={option.entityId} value={option.entityId}>
                        <IdpOptionContent option={option} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
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
            {errorHelpLink && (
              <Box sx={{ mt: 1 }}>
                <Link
                  href={errorHelpLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  underline="always"
                  color="inherit"
                  sx={{ fontWeight: 600 }}
                >
                  {errorHelpLink.label}
                </Link>
              </Box>
            )}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default LoginPage;
