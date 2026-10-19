import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginPage from "../views/LoginPage/LoginPage";
import { authLogin, getAuthProviders } from "../services/app.service";

let mockGoogleOnSuccess: ((res: { code: string }) => void) | null = null;

jest.mock("@react-oauth/google", () => ({
  useGoogleLogin: (options: { onSuccess: (res: { code: string }) => void }) => {
    mockGoogleOnSuccess = options.onSuccess;
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

  test("renders Google login button by default and authenticates with Google code", async () => {
    const onSuccess = jest.fn();
    render(<LoginPage handleSuccessfulAuthentication={onSuccess} />);

    const googleButton = await screen.findByRole("button", { name: /login with google/i });
    expect(googleButton).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /login with institutional account/i })
    ).not.toBeInTheDocument();

    fireEvent.click(googleButton);

    await waitFor(() => {
      expect(authLogin).toHaveBeenCalledWith("google-auth-code");
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test("renders both Google and CILogon login options when CILogon is enabled and redirects to CILogon authorize URL", async () => {
    (getAuthProviders as jest.Mock).mockResolvedValue(
      makeResponse({
        google: { enabled: true },
        cilogon: {
          enabled: true,
          client_id: "cilogon-client-123",
          authorize_uri: "https://cilogon.org/authorize",
          scope: "openid email profile org.cilogon.userinfo",
        },
      })
    );

    render(<LoginPage handleSuccessfulAuthentication={jest.fn()} />);

    const cilogonButton = await screen.findByRole("button", {
      name: /login with institutional account/i,
    });
    expect(cilogonButton).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login with google/i })).toBeInTheDocument();

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
    expect(assignedUrl.searchParams.get("state")).toMatch(/^cilogon_/);
  });

  test("completes CILogon callback code exchange when returning with code and matching state", async () => {
    sessionStorage.setItem("ogrre_cilogon_oauth_state", "cilogon_state_abc");
    sessionStorage.setItem(
      "ogrre_cilogon_redirect_uri",
      "http://localhost:3000/auth/cilogon/callback"
    );
    window.location.pathname = "/auth/cilogon/callback";
    window.location.search = "?code=cilogon-code-xyz&state=cilogon_state_abc";

    const onSuccess = jest.fn();
    render(<LoginPage handleSuccessfulAuthentication={onSuccess} />);

    await waitFor(() => {
      expect(authLogin).toHaveBeenCalledWith(
        "cilogon-code-xyz",
        "cilogon",
        "http://localhost:3000/auth/cilogon/callback"
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test("displays unauthorized error alert when backend returns 403", async () => {
    (authLogin as jest.Mock).mockResolvedValue(
      makeResponse({ detail: { message: "User scientist@lbl.gov is not registered." } }, 403)
    );

    const onSuccess = jest.fn();
    render(<LoginPage handleSuccessfulAuthentication={onSuccess} />);

    const googleButton = await screen.findByRole("button", { name: /login with google/i });
    fireEvent.click(googleButton);

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/User scientist@lbl.gov is not registered\./i);
    expect(alert).toHaveTextContent(/not authorized to access this application/i);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
