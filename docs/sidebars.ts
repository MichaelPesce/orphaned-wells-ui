import type {SidebarsConfig} from "@docusaurus/plugin-content-docs";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    "about/index",
    {
      type: "category",
      label: "Concepts",
      link: {type: "doc", id: "concepts/index"},
      items: ["concepts/docai"],
    },
    {
      type: "category",
      label: "Setup",
      link: {type: "doc", id: "install/index"},
      items: [
        "install/gcp_setup",
        "install/database_setup",
        "install/docker_setup",
        "install/install_ogrre",
        "install/connect_processors",
      ],
    },
    {
      type: "category",
      label: "Development",
      link: {type: "doc", id: "development/index"},
      items: [
        "development/testing",
        "development/e2e-test-contract",
        "development/e2e-ci",
      ],
    },
    {
      type: "category",
      label: "Deploy to GCP",
      link: {type: "doc", id: "deploy-gcp/index"},
      items: [
        "deploy-gcp/terraform",
        "deploy-gcp/backend-gke",
        "deploy-gcp/frontend-app-engine",
        "deploy-gcp/github-secrets",
        "deploy-gcp/add-collaborator",
        "deploy-gcp/legacy-vm",
      ],
    },
    {
      type: "category",
      label: "Document AI Tutorial",
      link: {type: "doc", id: "tutorial/index"},
      items: [
        "tutorial/workflow",
        "tutorial/doc_ai",
        "tutorial/splitter",
        "tutorial/classifier",
        "tutorial/extractor",
        "tutorial/5_1_extractor_schema",
        "tutorial/5_2_extractor_import",
        "tutorial/5_3_1_extractor_label_face",
        "tutorial/5_3_2_extractor_label_action",
        "tutorial/5_3_3_extractor_label_env",
        "tutorial/5_3_4_extractor_label_label",
        "tutorial/5_4_extractor_train",
        "tutorial/5_5_extractor_model",
        "tutorial/schema_spreadsheet",
      ],
    },
    {
      type: "category",
      label: "OGRRE UI",
      link: {type: "doc", id: "usage/index"},
      items: [
        "usage/ui",
        "usage/add_users",
        "usage/updating_processor_schema",
      ],
    },
    "user-issues/index",
  ],
};

export default sidebars;
