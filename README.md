# Industrial SOC for Wazuh Dashboard

A graduation-project prototype that adds an Industrial Security Operations Center interface to Wazuh Dashboard. It brings IT security monitoring and industrial OT context into one navigable interface while retaining Wazuh's existing applications and authentication flow.

> **Prototype environment · Sample IT/OT security data**
> The SOC pages use synthetic demonstration records. The Wazuh and OT data-provider seams are present, but production backend integrations are not complete. System Health reports integration readiness; it does not perform fabricated health checks.

## What is included

The Industrial SOC application has eight pages:

1. SOC Overview
2. Security Alerts
3. Log Explorer
4. Asset Inventory
5. OT Monitoring
6. MITRE ATT&CK for ICS
7. Reports & Analytics
8. System Health

The frontend uses React and the Wazuh/OpenSearch Dashboards EUI components. Shared provider and data types centralize sample data and define a boundary for a future live provider. The repository also includes the purple theme and login-page source, integration patches for the Wazuh host repositories, isolated deployment reference files, and browser screenshots captured from the running customized Dashboard.

## Compatibility baseline

This work was developed and validated in an isolated source checkout using:

- OpenSearch Dashboards: **2.19.6**
- Wazuh Dashboard plugins: **4.14.10-02**
- Wazuh Indexer and Manager: **4.14.10**

The Wazuh plugin source changes are represented as patches against the host checkouts used during development. Pin and verify the upstream source revisions before applying patches to any other checkout. The original project repositories are not vendored here.

## Repository layout

```text
frontend/
  industrial-soc/      Eight React pages, data provider/types, shared styles, CSV export
  login/               Themed login-page component and stylesheet
  theme/               Purple global theme stylesheet
integration/patches/   Reviewable changes for the Wazuh host repositories
deployment/
  isolated-reference/  Local validation deployment reference, not a portable stack
  README.md            Safety notes for those files
docs/
  screenshots/         Actual browser captures from the isolated Dashboard
  backend-roadmap.md   Phased plan for live Wazuh and OT data
```

## Run the existing isolated browser demonstration

The original temporary validation checkout remains the runnable source tree. From that checkout, with its isolated Wazuh services running, start the customized Dashboard with:

```bash
cd /tmp/wazuh-industrial-soc-validation-20261123-1317
bash deployment/industrial-soc-wazuh-4.14.10/start-source-dashboard.sh
```

The launcher reads the isolated runtime secrets from `/private/tmp/industrial-soc-wazuh-41410/secrets.env`, generates a protected runtime config, and starts Dashboard on the configured port `15601`. Keep that file local and protected; do not copy credentials into this repository, command history, screenshots, or reports.

For the earlier generic OpenSearch UI-only validation, its separate configuration was `config/industrial-soc-isolated.yml`; it is not a substitute for the Wazuh Indexer and Manager deployment. Neither runtime configuration nor runtime data is committed here.

See [`deployment/README.md`](deployment/README.md) before using deployment references. They contain paths specific to the existing temporary validation host and are not intended as an unattended Docker Compose deployment recipe.

## Install the changes into Wazuh source

Review `integration/README.md` and each patch first. The patches are intended for a clean, compatible Wazuh source checkout. They can conflict with local customizations. Do not apply them over existing work without backing up the target files and reviewing `git diff`.

At a high level, the host changes:

- register the Industrial SOC application in the Wazuh main plugin and route it to the included React app;
- load the global purple stylesheet in the Dashboard UI;
- apply the login presentation while retaining the underlying Wazuh authentication component behavior.

The `frontend/industrial-soc` directory is the application component source. Refer to `integration/README.md` for the intended destination paths and safe patch-check workflow.

## Upload this project to GitHub

This working copy is a local Git repository. To publish it, create a **private, empty** GitHub repository first (for example, `industrial-soc-platform`), then set the remote and push:

```bash
cd /Users/Elhanouf/Wazuh-Development/industrial-soc-platform
git remote add origin https://github.com/<YOUR_GITHUB_ACCOUNT>/industrial-soc-platform.git
git push -u origin main
```

Alternatively, if GitHub CLI is installed and authenticated, create a private remote and push in one step:

```bash
gh repo create industrial-soc-platform --private --source=. --remote=origin --push
```

Before making a repository public or sharing it, inspect the staged files and screenshots. This repository intentionally excludes passwords, private keys, generated certificates, runtime data, backups, and the full Wazuh source trees. Keep it private until your academic disclosure and licensing requirements are confirmed. Wazuh and OpenSearch components retain their own upstream licenses; this project does not relicense them.

## Extend the backend

Follow [`docs/backend-roadmap.md`](docs/backend-roadmap.md). In brief, implement a server-side Wazuh/Indexer provider behind the existing frontend data-provider interface, preserve server-side credentials and TLS verification, then add a separately approved OT ingestion adapter. Keep synthetic and live sources clearly identified and never report a component as healthy without a real, timestamped check.

## Screenshots

The [`docs/screenshots/`](docs/screenshots/) directory contains actual captures from the isolated running Dashboard: login, each of the eight pages, and a MITRE technique-selection interaction. They document the frontend appearance at capture time; they are not proof of a live Wazuh/OT backend connection.
