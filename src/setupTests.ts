// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

jest.mock("./usercontext", () => ({
  __esModule: true,
  useUserContext: () => ({
    user: { email: "test@example.com" },
    userEmail: "test@example.com",
    userName: "Test User",
    userPhoto: "",
    hasPermission: () => true,
    databaseEnvironment: "test",
  }),
  UserContextProvider: ({ children }: { children: any }) => children,
}));
