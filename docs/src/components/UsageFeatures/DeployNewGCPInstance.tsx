import React, { useState } from "react";

export function DeployNewGCPInstanceHelper() {
  const [collaborator, setCollaborator] = useState("");

  const normalizedCollaborator = collaborator.trim().toLowerCase().replace(/\s+/g, "-");
  const collaboratorValue = normalizedCollaborator || "<collaborator>";
  const backendName = `${collaboratorValue}-uow-server`;
  const backendHostname = `${collaboratorValue}-server.uow-carbon.org`;
  const frontendHostname = `${collaboratorValue}.uow-carbon.org`;
  const secretName = normalizedCollaborator ? `${normalizedCollaborator.toUpperCase()}_BACKEND_URL` : "<COLLABORATOR>_BACKEND_URL";
  const backendWorkflowFile = `orphaned-wells-ui-server/.github/workflows/deploy-${collaboratorValue}.yml`;
  const nginxConfigPath = `orphaned-wells-ui-server/nginx/${collaboratorValue}/default.conf`;
  const frontendWorkflowFile = `orphaned-wells-ui/.github/workflows/deploy-${collaboratorValue}.yml`;
  const appYaml = `orphaned-wells-ui/app-${collaboratorValue}.yaml`;
  const certbotCommand = `sudo docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
  --email mpesce@lbl.gov --agree-tos --no-eff-email \
  -d ${backendHostname} --force-renewal`;

  const boxStyle = {
    background: "#f8fafc",
    border: "1px solid #d1d5db",
    borderRadius: "0.75rem",
    padding: "1rem",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word" as const,
    marginTop: "0.75rem",
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem", padding: "1rem 1rem 0", border: "1px solid #e5e5e5", borderRadius: "1rem", background: "#fbfbfb" }}>
        <p style={{ margin: 0, marginBottom: "1rem" }}>
          Enter your collaborator name to update the example commands and deployment values throughout this page.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: "24rem" }}>
            <span style={{ fontWeight: 600, minWidth: "9rem" }}>Collaborator</span>
            <input
              value={collaborator}
              onChange={(event) => setCollaborator(event.target.value)}
              placeholder="e.g. newts"
              style={{
                flex: 1,
                minWidth: "14rem",
                border: "1px solid #cbd5e1",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                fontSize: "0.95rem",
                outline: "none",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
              }}
            />
          </label>
        </div>

        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <strong>Live values</strong>
            <ul style={{ margin: "0.5rem 0 0 1rem", padding: 0, listStyleType: "disc" }}>
              <li><code>{backendName}</code></li>
              <li><code>{backendHostname}</code></li>
              <li><code>{frontendHostname}</code></li>
              <li><code>{secretName}</code></li>
            </ul>
          </div>

          <div>
            <strong>Live files</strong>
            <ul style={{ margin: "0.5rem 0 0 1rem", padding: 0, listStyleType: "disc" }}>
              <li><code>{backendWorkflowFile}</code></li>
              <li><code>{nginxConfigPath}</code></li>
              <li><code>{frontendWorkflowFile}</code></li>
              <li><code>{appYaml}</code></li>
            </ul>
          </div>
        </div>
      </div>

      <div style={{ lineHeight: 1.7 }}>
        <h1>Deploy New GCP Instance</h1>
        <p>
          This page describes the deployment flow for a new OGRRE instance on Google Cloud Platform, including backend VM setup, frontend App Engine deployment, DNS configuration, and MongoDB initialization.
        </p>
        <p>
          <strong>Note:</strong> the collaborator value entered above is used to generate the example hostnames, workflow filenames, and deployment values throughout this page.
        </p>

        <h2 id="backend-deployment">Backend Deployment</h2>

        <h3 id="1-create-the-compute-engine-vm">1. Create the Compute Engine VM</h3>
        <ul>
          <li>Create a new Compute Engine instance using the default settings.</li>
          <li>Set the name to: <code>{backendName}</code></li>
          <li>Under access scopes, select <strong>Allow full access to all Cloud APIs</strong>.</li>
          <li>Reserve a 
            <a href="https://console.cloud.google.com/networking/addresses/list?invt=Abuaug&project=tidy-outlet-412020" target="_blank"> static external IP address</a> for the instance.</li>
          <li>Copy SSH keys from the other servers so you can log in.</li>
          <li>
            <a href="https://console.cloud.google.com/compute/disks?invt=Abuaug&project=tidy-outlet-412020" target="_blank">Increase the boot disk size</a> from <code>10 GB</code> to <code>20 GB</code>.</li>
        </ul>

        <h3 id="2-configure-the-vm">2. Configure the VM</h3>
        <p>SSH into the VM and install required packages.</p>
        <pre style={boxStyle}>
          <code>
            sudo apt-get update
            sudo apt-get install -y gcc
          </code>
        </pre>
        <ul>
          <li>Create the backend environment file in your home directory (<code>~/.env</code> or <code>/home/&lt;user&gt;/.env</code>) with the backend settings for this instance.</li>
          <li>
            <a href="https://docs.docker.com/engine/install/debian/" target="_blank"> Install Docker</a> following the standard Docker installation steps for Ubuntu.</li>
        </ul>

        <h3 id="3-domain-name-and-dns">3. Domain name and DNS</h3>
        <ul>
          <li>In 
            <a href="https://console.cloud.google.com/net-services/dns/zones?project=tidy-outlet-412020" target="_blank"> Google Cloud DNS</a>, add a new A record using the reserved static IP address.</li>
          <li>Use the hostname: <code>{backendHostname}</code></li>
          <li>Ensure the DNS entry points to the VM’s static external IP.</li>
        </ul>

        <h3 id="4-set-up-nginx-and-docker-compose">4. Set up NGINX and Docker Compose</h3>
        <ul>
          <li>On the VM, add or copy the Docker Compose and NGINX configuration files.</li>
          <li>The new collaborator should start with a simple <code>default.conf</code> that only defines the HTTP server block.</li>
          <li>Start the stack:</li>
        </ul>
        <pre style={boxStyle}>
          <code>sudo docker compose up -d</code>
        </pre>
        <ul>
          <li>Verify NGINX started correctly:</li>
        </ul>
        <pre style={boxStyle}>
          <code>sudo docker logs nginx</code>
        </pre>
        <p>If you see a missing file or path error, it is likely from attempting HTTPS configuration before the certificate is available.</p>

        <h3 id="5-request-tls-certificates">5. Request TLS certificates</h3>
        <p>After the HTTP configuration is running, create the certificate using Certbot:</p>
        <pre style={boxStyle}>
          <code>{certbotCommand}</code>
        </pre>
        <ul>
          <li>Update <code>nginx/default.conf</code> to add the HTTPS configuration.</li>
          <li>Restart the containers:</li>
        </ul>
        <pre style={boxStyle}>
          <code>
            sudo docker compose down
            sudo docker compose up -d
          </code>
        </pre>

        <h3 id="6-renewal-and-cronjob">6. Renewal and cronjob</h3>
        <ul>
          <li>To renew certificates manually:</li>
        </ul>
        <pre style={boxStyle}>
          <code>
            sudo docker compose run --rm certbot renew
            sudo docker compose exec nginx nginx -s reload
          </code>
        </pre>
        <p>Add a cron job to check renewal daily at 3 AM:</p>
        <pre style={boxStyle}>
          <code>crontab -e</code>
        </pre>
        <p>Add the job:</p>
        <pre style={boxStyle}>
          <code>0 3 * * * cd /home/mpesce && docker compose run --rm certbot renew && docker compose exec nginx nginx -s reload &gt;&gt; /var/log/certbot-renew.log 2&gt;&1</code>
        </pre>
        <p>This will run every day at 3 am and reload NGINX if certificates are renewed.</p>

        <h3 id="7-github-actions-and-repo-setup">7. GitHub Actions and repo setup</h3>
        <ul>
          <li>Create a new workflow file in the backend repository:
            <ul>
              <li><code>{backendWorkflowFile}</code></li>
            </ul>
          </li>
          <li>Create a new NGINX config directory and <code>default.conf</code> for the collaborator:
            <ul>
              <li><code>{nginxConfigPath}</code></li>
            </ul>
          </li>
          <li>Use the other state files as a template and update all collaborator names accordingly.</li>
          <li>Add the new backend server IP address to GitHub Actions secrets for the repository.</li>
          <li>Deploy to the new VM by creating a new Git branch and pushing that branch.</li>
        </ul>

        <h2 id="frontend-deployment">Frontend Deployment</h2>

        <h3 id="1-app-engine-workflow">1. App Engine workflow</h3>
        <ul>
          <li>Add new workflow files for the frontend deployment:</li>
          <ul>
            <li><code>{frontendWorkflowFile}</code></li>
            <li><code>{appYaml}</code></li>
          </ul>
          <li>Add the backend URL as a GitHub secret named <code>{secretName}</code>.</li>
          <li>Make sure the URL has no trailing slash.</li>
          <li>Deploy the frontend by pushing to the correct branch configured for that collaborator.</li>
        </ul>

        <h3 id="2-domain-name-and-dispatch">2. Domain name and dispatch</h3>
        <ul>
          <li>In <code>orphaned-wells-ui/dispatch.yml</code>, add the new URL route.</li>
          <li>Deploy the dispatch file:</li>
        </ul>
        <pre style={boxStyle}>
          <code>gcloud app deploy dispatch.yaml</code>
        </pre>
        <ul>
          <li>Add a 
            <a href="https://console.cloud.google.com/appengine/settings/domains?project=tidy-outlet-412020" target="_blank"> custom domain </a>
            in App Engine.</li>
          <li>Add DNS records for the frontend domain:</li>
          <ul>
            <li>A record for <code>{frontendHostname}</code> pointing to the frontend IPv4 address</li>
            <li>AAAA record for the same hostname pointing to the frontend IPv6 address</li>
          </ul>
          <li>Use the same addresses as the other frontend instances.</li>
          <li>The <code>dispatch.yml</code> file defines how App Engine routes requests for the new URL.</li>
        </ul>

        <h3 id="3-add-custom-domain-and-oauth">3. Add custom domain and OAuth</h3>
        <ul>
          <li>Add the new custom domain record in Google Cloud App Engine.</li>
          <li>In 
            <a href="https://console.cloud.google.com/apis/credentials?project=tidy-outlet-412020" target="_blank"> Google OAuth credentials</a>
            , add both of the following as authorized origins and redirect URIs:</li>
          <ul>
            <li>the App Engine autogenerated URL for the new deployment</li>
            <li>the custom domain URL defined in <code>dispatch.yml</code></li>
          </ul>
        </ul>
        
        <span id="database-deployment---mongodb"></span>
        <h2>Database Deployment - MongoDB</h2>
        <ul>
          <li>Use the <code>InitializeMongo.py</code> script available in the documentation to initialize the database.</li>
          <li>Confirm that your new backend can connect to the MongoDB instance and that the required collections and indexes are created.</li>
        </ul>
        <span id="notes"></span>
        <h2>Notes</h2>
        <ul>
          <li>Keep the collaborator and hostname names consistent across VM naming, DNS records, workflow filenames, and configuration files.</li>
          <li>For HTTPS rollout, always start with HTTP first, then request certificates and add HTTPS once the site is reachable.</li>
        </ul>
      </div>
    </div>
  );
}
