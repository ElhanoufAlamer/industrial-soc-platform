# Backend expansion roadmap

The current application is intentionally frontend-first. Its centralized provider and TypeScript data types create a seam for backend work without pretending sample records are live telemetry.

## 1. Preserve a provider boundary

Keep page components dependent on the existing Industrial SOC data-provider interface rather than calling APIs directly. Retain the demo provider for offline screenshots. Add a live provider implementation selected through explicit server configuration, and label every returned dataset with source, retrieval time, and whether it is synthetic or live. Avoid mixing demo rows into live result sets.

## 2. Add a server-side Wazuh integration

Implement a Wazuh plugin server service and authenticated routes for the views that need Manager API data. The server should hold the Manager API credentials, validate the Dashboard user's authorization, apply request timeouts, handle pagination/rate limits, and return only fields needed by the UI. Never put API credentials in browser code, client configuration, Git, or query strings. Keep TLS verification enabled and use a dedicated least-privilege API account.

Start with read-only capabilities such as Manager/API version, agent inventory and status, and approved monitoring metadata. Map API errors and missing permissions to explicit unavailable/unknown states; do not synthesize a success response.

## 3. Add Indexer-backed security data

Use the supported server-side Wazuh/OpenSearch client and existing Dashboard authentication context to query only approved alert and event indices. Confirm the actual index names, mappings, time fields, tenant/security role boundaries, and retention policy in the target deployment before writing queries. Use bounded time ranges, pagination, and field allowlists. Keep saved-object indices and security system indices separate from SOC event queries.

## 4. Define OT ingestion and asset context

Add OT records through a documented, approved ingestion path: for example, Wazuh agent integrations, passive network monitoring/export, or an approved OT gateway. Normalize timestamps, asset IDs, site/zone, protocol, source, severity, and event references. Keep sensor provenance and data freshness visible. Start read-only and avoid active requests to PLCs or control networks unless the OT owner has explicitly approved a vendor-supported method.

A future Schneider Electric adapter should be a distinct integration with its own documented protocol/API, credentials, TLS policy, supported device models, and test environment. Do not assume a device API or generate device inventory to make the UI look populated.

## 5. Make health truthful

Only show Connected/Healthy after a real check to the named component succeeds. Record the check time and source. Distinguish `Integration pending`, `Not connected`, `Unknown`, and actual failure. Define timeouts and stale-data behavior. Until checks exist, retain the current pending/not-connected states and the concise live-monitoring note.

## 6. Security and verification gates

- Keep secrets in an approved secret store or protected local runtime files, never in frontend bundles or Git.
- Use least-privilege service accounts, verified TLS, network isolation, and auditable access.
- Validate server routes with mocked fixtures first, then isolated integration tests against version-matched services.
- Test authorization, empty data, timeout, malformed response, pagination, stale data, and partial service failures.
- Preserve CSV exports' source and time context; escape spreadsheet formula prefixes when exporting untrusted text.
- Keep the demo and live providers explicitly selectable and test that a live mode cannot silently fall back to fabricated rows.

A live integration is ready only after the backend route, authentication boundary, source mapping, failure states, and user-visible data provenance have all been reviewed.
