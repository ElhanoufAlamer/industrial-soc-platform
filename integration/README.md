# Wazuh source integration guide

The patch files contain the tracked Wazuh host-repository edits from the isolated project checkout. The application component itself is stored at `../frontend/industrial-soc/` for convenient review. Login and global theme source are also provided separately.

## Patch targets

- `wazuh-dashboard-theme-loader.patch` → `wazuh-dashboard`
- `wazuh-dashboard-plugins-industrial-soc.patch` → `wazuh-dashboard-plugins`
- `wazuh-security-dashboards-login-theme.patch` → `wazuh-security-dashboards-plugin`

The patches were captured from local changes at these base commits:

- `wazuh-dashboard`: `4a81e59`
- `wazuh-dashboard-plugins`: `5005c3e`
- `wazuh-security-dashboards-plugin`: `50cd2ba`

These short SHAs are provenance references, not a promise that every upstream branch has the same base. Check out the matching full commit/branch, inspect all local changes, and use `git apply --check` before applying. Never reset or clean a Wazuh checkout to make a patch apply.

## Safe patch workflow

For each host repository, preserve its current work and make a dedicated branch or worktree. For example:

```bash
git status --short
git switch -c industrial-soc-integration
# From the project repository, run the applicable check first:
git apply --check /path/to/industrial-soc-platform/integration/patches/wazuh-dashboard-theme-loader.patch
```

If the check succeeds, apply the patch and inspect `git diff` before building. If it fails, stop and reconcile the changes manually; do not force-apply. The SOC component files need to be copied into `plugins/main/public/components/industrial-soc/` in the plugin checkout, preserving any existing directory contents and reviewing any name collisions. The theme CSS belongs in the Dashboard UI assets path shown by the theme-loader patch. Login files belong in the Security Dashboards plugin login app.

Build and browser-check using the versions in the root README. Test Wazuh login/logout and existing navigation as well as all eight SOC pages. The sample provider is for UI demonstration only; it does not make the Wazuh API or Indexer integration live.
