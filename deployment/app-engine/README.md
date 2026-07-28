# Frontend App Engine Deployment

This directory contains the Google App Engine configuration for the frontend.
Each deployed frontend instance has its own App Engine service, branch-triggered
GitHub Actions workflow, backend URL secret, dispatch route, DNS records, custom
domain, and OAuth configuration.

Use `<state>` below as the short environment name, such as `ca`, `isgs`,
`newts`, `osage`, or `rrc`.

## Add a Frontend Instance

1. Add an App Engine service config:

   `deployment/app-engine/app-<state>.yaml`

   Copy an existing `app-*.yaml` file and update the `service` value. Existing
   services use the `<state>-uow` naming pattern.

2. Add a deployment workflow:

   `.github/workflows/deploy-<state>.yml`

   Copy an existing state deployment workflow and update:

   - workflow name
   - trigger branch
   - job name
   - `app_yaml`
   - `state`
   - `collaborator`, if needed
   - `app_environment`
   - backend URL secret name

3. Add the backend URL as a GitHub repository secret:

   `<STATE>_BACKEND_URL`

   Do not include a trailing slash.

4. Deploy the frontend by pushing to the workflow's configured branch.

## Add the Domain Route

1. Add the new hostname to `deployment/app-engine/dispatch.yaml`:

   ```yaml
   - url: "<state>.uow-carbon.org/*"
     service: <state>-uow
   ```

2. Deploy the dispatch file from this directory:

   ```sh
   gcloud app deploy dispatch.yaml
   ```

## Configure DNS and Custom Domain

1. In [Google Cloud DNS](https://console.cloud.google.com/net-services/dns/zones?project=tidy-outlet-412020),
   add records for `<state>.uow-carbon.org`:

   - `A` record using the same IPv4 address as the other frontend instances.
   - `AAAA` record using the same IPv6 address as the other frontend instances.

2. In [App Engine custom domains](https://console.cloud.google.com/appengine/settings/domains?project=tidy-outlet-412020),
   add `<state>.uow-carbon.org` as a custom domain.

## Update OAuth

In [Google OAuth credentials](https://console.cloud.google.com/apis/credentials?project=tidy-outlet-412020),
add both frontend URLs:

- the App Engine generated service URL
- `https://<state>.uow-carbon.org`

Add them anywhere the frontend origin is required, including authorized
JavaScript origins and authorized redirect URIs. Use the exact URL format
required by the OAuth client, and avoid trailing slashes unless the existing
entries use them.
