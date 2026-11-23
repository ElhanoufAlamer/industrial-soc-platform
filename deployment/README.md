# Isolated deployment references

The files in `isolated-reference/` document the disposable Wazuh 4.14.10 validation stack and source Dashboard startup helpers used during development. They are retained as implementation references, not as a portable production deployment.

They contain temporary-host paths and assume runtime-only files (certificates, generated API configuration, and a local `secrets.env`) exist outside this repository. Those secret/runtime files are deliberately not included. Do not run these files unchanged on another host. First review and adapt paths, port bindings, container/network/volume names, and secret provisioning for a new isolated environment. Never point this stack at a live Indexer, Wazuh API, Docker network, or data volume.

The compose definition uses dedicated service/container/network/volume names and local validation bindings. Verify the actual file and all interpolated variables before use. Keep TLS certificate verification enabled. Do not place credentials directly in Compose, shell commands, source, or Git.

For the already prepared temporary checkout, the tested source-build launch command is documented in the root README. Runtime paths and secrets remain in that environment, not in this repository.
