import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "../views/LoginPage/LoginPage";
import { authLogin, getAuthProviders } from "../services/app.service";

let mockGoogleOnSuccess: ((res: { code: string }) => void) | null = null;
let mockGoogleLoginOptions: Record<string, unknown> | null = null;

jest.mock("@react-oauth/google", () => ({
  useGoogleLogin: (options: {
    onSuccess: (res: { code: string }) => void;
    [key: string]: unknown;
  }) => {
    mockGoogleOnSuccess = options.onSuccess;
    mockGoogleLoginOptions = options;
    return () => {
      if (mockGoogleOnSuccess) {
        mockGoogleOnSuccess({ code: "google-auth-code" });
      }
    };
  },
}));

jest.mock("../services/app.service", () => ({
  authLogin: jest.fn(),
  getAuthProviders: jest.fn(),
}));

const MOCK_DEFAULT_IDP_OPTIONS = [
  {
    label: "Lawrence Berkeley National Laboratory",
    entityId: "urn:mace:incommon:lbl.gov",
    logo: "/img/idp/lbl.svg",
  },
  {
    label: "ORCID",
    entityId: "http://orcid.org/oauth/authorize",
    logo: "/img/idp/orcid.svg",
  },
];

const makeResponse = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe("LoginPage", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockGoogleOnSuccess = null;
    mockGoogleLoginOptions = null;

    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        origin: "http://localhost:3000",
        pathname: "/login",
        search: "",
        assign: jest.fn(),
      },
    });

    (getAuthProviders as jest.Mock).mockResolvedValue(
      makeResponse({
        google: { enabled: true },
        cilogon: { enabled: false },
      })
    );
    (authLogin as jest.Mock).mockResolvedValue(
      makeResponse({ user_info: { email: "user@lbl.gov" } }, 200)
    );
  });

  afterAll(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  test("renders Google login button by default and configures same-tab redirect to /auth/google/callback", async () => {
    const onSuccess = jest.fn();
    render(<LoginPage handleSuccessfulAuthentication={onSuccess} />);

    const googleButton = await screen.findByRole("button", { name: /login with google/i });
    expect(googleButton).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /login with institutional account/i })
    ).not.toBeInTheDocument();
    expect(mockGoogleLoginOptions).toMatchObject({
      flow: "auth-code",
      ux_mode: "redirect",
      redirect_uri: "http://localhost:3000/auth/google/callback",
    });
    expect(String(mockGoogleLoginOptions?.state || "")).toMatch(/^google_/);

    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(authLogin).toHaveBeenCalledWith("google-auth-code");
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test("completes Google callback code exchange when returning to /auth/google/callback with code and matching state", async () => {
    sessionStorage.setItem("ogrre_google_oauth_state", "google_state_123");
    sessionStorage.setItem(
      "ogrre_google_redirect_uri",
      "http://localhost:3000/auth/google/callback"
    );
    window.location.pathname = "/auth/google/callback";
    window.location.search = "?code=google-code-xyz&state=google_state_123";

    const onSuccess = jest.fn();
    render(<LoginPage handleSuccessfulAuthentication={onSuccess} />);

    await waitFor(() => {
      expect(authLogin).toHaveBeenCalledWith(
        "google-code-xyz",
        "google",
        "http://localhost:3000/auth/google/callback"
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test("renders both Google and CILogon login options when CILogon is enabled and redirects to CILogon authorize URL with selected institution idphint", async () => {
    (getAuthProviders as jest.Mock).mockResolvedValue(
      makeResponse({
        google: { enabled: true },
        cilogon: {
          enabled: true,
          client_id: "cilogon-client-123",
          authorize_uri: "https://cilogon.org/authorize",
          scope: "openid email profile org.cilogon.userinfo",
          idp_options: MOCK_DEFAULT_IDP_OPTIONS,
        },
      })
    );

    render(<LoginPage handleSuccessfulAuthentication={jest.fn()} />);

    const cilogonButton = await screen.findByRole("button", {
      name: /login with institutional account/i,
    });
    expect(cilogonButton).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login with google/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/institution/i)).toBeInTheDocument();

    fireEvent.click(cilogonButton);

    expect(window.location.assign).toHaveBeenCalledTimes(1);
    const assignedUrl = new URL((window.location.assign as jest.Mock).mock.calls[0][0]);
    expect(assignedUrl.origin + assignedUrl.pathname).toBe("https://cilogon.org/authorize");
    expect(assignedUrl.searchParams.get("client_id")).toBe("cilogon-client-123");
    expect(assignedUrl.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/auth/cilogon/callback"
    );
    expect(assignedUrl.searchParams.get("scope")).toBe(
      "openid email profile org.cilogon.userinfo"
    );
    expect(assignedUrl.searchParams.get("idphint")).toBe(
      "urn:mace:incommon:lbl.gov"
    );
    expect(assignedUrl.searchParams.get("state")).toMatch(/^cilogon_/);
  });

  test("allows selecting ORCID in the institution selector and passes ORCID idphint to CILogon", async () => {
    (getAuthProviders as jest.Mock).mockResolvedValue(
      makeResponse({
        google: { enabled: true },
        cilogon: {
          enabled: true,
          client_id: "cilogon-client-123",
          authorize_uri: "https://cilogon.org/authorize",
          scope: "openid email profile org.cilogon.userinfo",
          idp_options: MOCK_DEFAULT_IDP_OPTIONS,
        },
      })
    );

    render(<LoginPage handleSuccessfulAuthentication={jest.fn()} />);

    const institutionSelect = await screen.findByLabelText(/institution/i);
    fireEvent.mouseDown(institutionSelect);

    const orcidOption = await screen.findByRole("option", { name: /orcid/i });
    fireEvent.click(orcidOption);

    const cilogonButton = screen.getByRole("button", {
      name: /login with institutional account/i,
    });
    fireEvent.click(cilogonButton);

    expect(window.location.assign).toHaveBeenCalledTimes(1);
    const assignedUrl = new URL((window.location.assign as jest.Mock).mock.calls[0][0]);
    expect(assignedUrl.searchParams.get("idphint")).toBe(
      "http://orcid.org/oauth/authorize"
    );
  });

  test("renders backend idp_options with logos or fallback placeholders", async () => {
    (getAuthProviders as jest.Mock).mockResolvedValue(
      makeResponse({
        google: { enabled: true },
        cilogon: {
          enabled: true,
          client_id: "cilogon-client-123",
          authorize_uri: "https://cilogon.org/authorize",
          scope: "openid email profile org.cilogon.userinfo",
          idp_options: [
            {
              label: "ORCID",
              entityId: "http://orcid.org/oauth/authorize",
              logo: "/img/idp/orcid.svg",
            },
            {
              label: "Custom Lab Without Logo",
              entityId: "https://idp.custom.org",
            },
          ],
        },
      })
    );

    render(<LoginPage handleSuccessfulAuthentication={jest.fn()} />);

    const cilogonButton = await screen.findByRole("button", {
      name: /login with institutional account/i,
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/institution/i)).toHaveTextContent(/orcid/i);
    });
    expect(screen.getAllByTestId("idp-option-logo").length).toBeGreaterThan(0);

    const institutionSelect = screen.getByLabelText(/institution/i);
    fireEvent.mouseDown(institutionSelect);

    expect(await screen.findByTestId("idp-option-placeholder")).toBeInTheDocument();

    fireEvent.click(cilogonButton);

    const assignedUrl = new URL((window.location.assign as jest.Mock).mock.calls[0][0]);
    expect(assignedUrl.searchParams.get("idphint")).toBe(
      "http://orcid.org/oauth/authorize"
    );
  });

  test("completes CILogon callback code exchange and preserves selected institution across redirect", async () => {
    (getAuthProviders as jest.Mock).mockResolvedValue(
      makeResponse({
        google: { enabled: true },
        cilogon: {
          enabled: true,
          client_id: "cilogon-client-123",
          authorize_uri: "https://cilogon.org/authorize",
          scope: "openid email profile org.cilogon.userinfo",
          idp_options: MOCK_DEFAULT_IDP_OPTIONS,
        },
      })
    );

    sessionStorage.setItem("ogrre_cilogon_oauth_state", "cilogon_state_abc");
    sessionStorage.setItem(
      "ogrre_cilogon_redirect_uri",
      "http://localhost:3000/auth/cilogon/callback"
    );
    sessionStorage.setItem(
      "ogrre_cilogon_selected_idp",
      "http://orcid.org/oauth/authorize"
    );
    sessionStorage.setItem(
      "ogrre_cilogon_idp_options",
      JSON.stringify(MOCK_DEFAULT_IDP_OPTIONS)
    );
    window.location.pathname = "/auth/cilogon/callback";
    window.location.search = "?code=cilogon-code-xyz&state=cilogon_state_abc";

    const onSuccess = jest.fn();
    render(<LoginPage handleSuccessfulAuthentication={onSuccess} />);

    // Immediately displays ORCID rather than resetting to Lawrence Berkeley National Laboratory
    expect(screen.getByLabelText(/institution/i)).toHaveTextContent(/orcid/i);

    await waitFor(() => {
      expect(authLogin).toHaveBeenCalledWith(
        "cilogon-code-xyz",
        "cilogon",
        "http://localhost:3000/auth/cilogon/callback"
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByLabelText(/institution/i)).toHaveTextContent(/orcid/i);
  });

  test("displays unauthorized error alert when backend returns 403", async () => {
    (authLogin as jest.Mock).mockResolvedValue(
      makeResponse(
        {
          detail: {
            detail_key: "account_not_registered",
            message:
              "This account is not registered for this application. Please login with a different account or contact the development team to gain access.",
          },
        },
        403
      )
    );

    const onSuccess = jest.fn();
    render(<LoginPage handleSuccessfulAuthentication={onSuccess} />);

    const googleButton = await screen.findByRole("button", { name: /login with google/i });
    fireEvent.click(googleButton);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      /This account is not registered for this application\. Please login with a different account or contact the development team to gain access\./i
    );
    expect(alert).not.toHaveTextContent(/not authorized to access this application/i);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test("displays ORCID visibility guidance and documentation link when backend returns missing_email 403", async () => {
    (authLogin as jest.Mock).mockResolvedValue(
      makeResponse(
        {
          detail: {
            detail_key: "missing_email",
            message:
              "Your identity is not associated with an email. If signing in with ORCID, open 'View my ORCID record' (orcid.org/my-orcid), click the edit pencil icon in the 'Emails & domains' section on the left sidebar, and set your verified email visibility to 'Everyone' (Public).",
            help_url:
              "https://support.orcid.org/hc/en-us/articles/360006897614-Visibility-settings",
            help_label: "View ORCID visibility settings documentation",
          },
        },
        403
      )
    );

    const onSuccess = jest.fn();
    render(<LoginPage handleSuccessfulAuthentication={onSuccess} />);

    const googleButton = await screen.findByRole("button", { name: /login with google/i });
    fireEvent.click(googleButton);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/Emails & domains/i);
    const docsLink = screen.getByRole("link", {
      name: /view orcid visibility settings documentation/i,
    });
    expect(docsLink).toHaveAttribute(
      "href",
      "https://support.orcid.org/hc/en-us/articles/360006897614-Visibility-settings"
    );
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test("resets CILogon loading state when navigating back to the login page", async () => {
    (getAuthProviders as jest.Mock).mockResolvedValue(
      makeResponse({
        google: { enabled: true },
        cilogon: {
          enabled: true,
          client_id: "cilogon-client-123",
          authorize_uri: "https://cilogon.org/authorize",
          scope: "openid email profile org.cilogon.userinfo",
          idp_options: MOCK_DEFAULT_IDP_OPTIONS,
        },
      })
    );

    render(<LoginPage handleSuccessfulAuthentication={jest.fn()} />);

    const cilogonButton = await screen.findByRole("button", {
      name: /login with institutional account/i,
    });
    const googleButton = screen.getByRole("button", { name: /login with google/i });

    fireEvent.click(cilogonButton);

    expect(
      screen.getByRole("button", { name: /signing in with cilogon/i })
    ).toBeDisabled();
    expect(googleButton).toBeDisabled();

    fireEvent(window, new Event("pageshow"));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /login with institutional account/i })
      ).toBeEnabled();
      expect(googleButton).toBeEnabled();
    });
  });
});
