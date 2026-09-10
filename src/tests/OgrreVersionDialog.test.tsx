import { render, screen } from "@testing-library/react";
import OgrreVersionDialog from "../components/Header/OgrreVersionDialog";

test("shows the backend deployment time in the viewer's local time zone", () => {
  const deployedAt = "2026-08-07T00:00:00Z";
  const expectedDeploymentTime = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(new Date(deployedAt));

  render(
    <OgrreVersionDialog
      open
      versionInfo={{ deployment: { deployed_at: deployedAt } }}
      loading={false}
      error=""
      onClose={jest.fn()}
    />
  );

  expect(screen.getByText(expectedDeploymentTime)).toBeInTheDocument();
  expect(screen.queryByText(deployedAt)).not.toBeInTheDocument();
});
