export function InstallOverview() {
  return (
    <div>
            This guide includes the following sections:
      <ol>
        <li>
          <a href="install/gcp_setup">Create and connect a Google project</a>
        </li>
        <li>
          <a href="install/database_setup">Create and connect MongoDB database</a>
        </li>
        <li>
          <a href="install/install_ogrre">Install OGRRE on your computer</a>
        </li>
        <li>
          <a href="install/docker_setup">Run OGRRE with Docker</a>
        </li>
        <li>
          <a href="install/connect_processors">Connect trained processors to OGRRE</a>
        </li>
      </ol>
      <p>
                Use the manual setup pages when configuring each service yourself. For local development, the Docker guide starts the frontend, backend, and MongoDB together.
      </p>
    </div>
  );
}
