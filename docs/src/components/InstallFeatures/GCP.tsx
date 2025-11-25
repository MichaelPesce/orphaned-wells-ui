
export function GCPOverview() {
  return (
    <div>
            OGRRE relies on <a target='_blank' href="https://cloud.google.com/?hl=en" rel="noreferrer">Google Cloud Platform (GCP)</a> for multiple services. To process documents, OGRRE uses <a target='_blank' href="https://cloud.google.com/document-ai?hl=en" rel="noreferrer">Document AI</a>. To store document files, OGRRE uses <a target='_blank' href="https://cloud.google.com/storage?hl=en" rel="noreferrer">Cloud Storage</a>. To authenticate users, OGRRE uses <a target='_blank' href="https://developers.google.com/identity/protocols/oauth2" rel="noreferrer">Google OAuth Platform</a>. It is configured to work with any Google Cloud project, as long as the proper credentials are provided. To learn how to configure OGRRE with GCP, read the following tutorials.
    </div>
  );
}

export function GCPInstructions() {
  return (
    <ol>
      <li>Create an account: </li> To create a GCP account, you must have a Google account. Then, simply sign up on the <a target='_blank' href="https://console.cloud.google.com" rel="noreferrer">GCP console</a>.

      <li>Create a project:</li> To create a project and grant access to it, see the <a target='_blank' href="https://cloud.google.com/resource-manager/docs/creating-managing-projects" rel="noreferrer">Google documentation on creating and managing projects</a>.

      <li>Create a bucket:</li> OGRRE uses cloud storage buckets to store and retrieve well document image files. To create a bucket, see the <a target='_blank' href="https://cloud.google.com/storage/docs/creating-buckets" rel="noreferrer">documentation on creating a storage bucket</a>.

      <li>Set up OAuth:</li> OGRRE relies on Google OAuth to authenticate users. To create an OAuth client, see the <a target='_blank' href="https://support.google.com/cloud/answer/15544987?hl=en&ref_topic=15540269&sjid=18121873989066748574-NC" rel="noreferrer">documentation on using Google OAuth</a>.
      <li>Get access credentials:</li>OGRRE requires a user account with credentials to access the GCP APIs. To create a service account, follow the <a target='_blank' href="https://cloud.google.com/iam/docs/service-accounts-create" rel="noreferrer">documentation on creating a service account</a>. To include your service account in OGRRE, you'll want to create a JSON key file for your service account by following the <a target='_blank' href="https://cloud.google.com/iam/docs/keys-create-delete" rel="noreferrer">documentation on creating service account keys</a>.
    </ol>
  );
}

export function GCPEnvironmentVariables() {
  return (
    <div>
        The OGRRE backend requires 7 environment variables from your GCP project. As explained in the <a href="getting_started">backend installation section</a>, the following variables must go inside your <code>.env</code> file.
      <ul>
        <li>
          <b>PROJECT_ID</b>: The project ID of your GCP project.
        </li>
        <li>
          <b>LOCATION</b>: The location you chose for document AI processors, likely to be "us".
        </li>
        <li>
          <b>STORAGE_BUCKET_NAME</b>: The name you chose for your storage bucket.
        </li>
        <li>
          <b>STORAGE_SERVICE_KEY</b>: The name of the file storing your GCP access credentials. <b>This file should be stored in the same directory as the <code>.env</code> file.</b>
        </li>
        <li>
          <b>token_uri</b>: The endpoint URL where an application requests and receives access tokens. This is necessary for user authentication. For more information, see the <a target='_blank' href="https://developers.google.com/identity/protocols/oauth2" rel="noreferrer">Google's documentation on OAuth2</a>.
        </li>
        <li>
          <b>client_id</b>: The client ID of your OAuth client.
        </li>
        <li>
          <b>client_secret</b>: The client secret of your OAuth client.
        </li>
      </ul>
    </div>
  );
}