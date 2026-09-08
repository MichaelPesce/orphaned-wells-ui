# Frontend App Engine Deployment

This directory contains the Google App Engine configuration for the frontend.
Each deployed frontend instance has its own App Engine service, branch-triggered
GitHub Actions workflow, backend URL secret, dispatch route, DNS records, custom
domain, and OAuth configuration.

Use `<collaborator>` below as the short collaborator key, such as `ca`, `isgs`,
`newts`, `osage`, or `rrc`.

## Add a Frontend Instance

1. Add an App Engine service config:

   `deployment/app-engine/app-<collaborator>.yaml`

   Copy an existing `app-*.yaml` file and update the `service` value. Existing
   services use the `<collaborator>-uow` naming pattern.

2. Add a deployment workflow:

   `.github/workflows/deploy-<collaborator>.yml`

   Copy an existing collaborator deployment workflow and update:

   - workflow name
   - trigger branch
   - job name
   - `app_yaml`
   - `collaborator`
   - backend URL secret name

3. Add the backend URL as a GitHub repository secret:

   `<COLLABORATOR>_BACKEND_URL`

   Do not include a trailing slash.

4. Deploy the frontend by pushing to the workflow's configured branch.

## Deployment Account Permissions

The frontend GitHub Actions workflow deploys with `gcloud app deploy`, which
creates a new App Engine version and promotes it to receive traffic by default.
The deployment service account needs:

- App Engine Deployer (`roles/appengine.deployer`)
- App Engine Service Admin (`roles/appengine.serviceAdmin`) for traffic promotion
- Cloud Build Editor (`roles/cloudbuild.builds.editor`)
- Storage Object Admin (`roles/storage.objectAdmin`) on the App Engine staging/build buckets or project
- Service Account User (`roles/iam.serviceAccountUser`) on the App Engine runtime service account

If the deploy uploads a version but fails with `appengine.services.update`, the
missing role is App Engine Service Admin.

## Add the Domain Route

1. Add the new hostname to `deployment/app-engine/dispatch.yaml`:

   ```yaml
   - url: "<collaborator>.uow-carbon.org/*"
     service: <collaborator>-uow
   ```

2. Deploy the dispatch file from this directory:

   ```sh
   gcloud app deploy dispatch.yaml
   ```

## Configure DNS and Custom Domain

1. In [Google Cloud DNS](https://console.cloud.google.com/net-services/dns/zones?project=tidy-outlet-412020),
   add records for `<collaborator>.uow-carbon.org`:

   - `A` record using the same IPv4 address as the other frontend instances.
   - `AAAA` record using the same IPv6 address as the other frontend instances.

2. In [App Engine custom domains](https://console.cloud.google.com/appengine/settings/domains?project=tidy-outlet-412020),
   add `<collaborator>.uow-carbon.org` as a custom domain.

## Update OAuth

In [Google OAuth credentials](https://console.cloud.google.com/apis/credentials?project=tidy-outlet-412020),
add both frontend URLs:

- the App Engine generated service URL
- `https://<collaborator>.uow-carbon.org`

Add them anywhere the frontend origin is required, including authorized
JavaScript origins and authorized redirect URIs. Use the exact URL format
required by the OAuth client, and avoid trailing slashes unless the existing
entries use them.
