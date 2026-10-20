import { fireEvent, render, screen } from "@testing-library/react";
import Header from "../components/Header/Header";
import { HashRouter } from "react-router-dom";

test("header displays user name and email in profile dropdown menu", (): void => {
  const { container } = render(
    <HashRouter>
      <Header />
    </HashRouter>
  );

  const profileButton = container.querySelector('[data-cy="profile-menu-button"]');
  expect(profileButton).not.toBeNull();
  fireEvent.click(profileButton!);

  expect(screen.getByText("Test User")).toBeInTheDocument();
  expect(screen.getByText("test@example.com")).toBeInTheDocument();
});