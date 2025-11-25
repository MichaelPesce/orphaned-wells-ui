export function InstallOverview() {
  return (
    <div>
            This guide consists of 4 sections:
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
          <a href="install/connect_processors">Connect trained processors to OGRRE</a>
        </li>
      </ol>
      <p>
                Each step is necessary to complete in order to run OGRRE from scratch. Steps 1 and 2 must be completed before attempting to run OGRRE. For an in depth walk through on setting up OGRRE, follow each guide in order.
      </p>
    </div>
  );
}