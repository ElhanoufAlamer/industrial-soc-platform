#!/usr/bin/env python3
import base64
import json
import ssl
import urllib.error
import urllib.request
from pathlib import Path

runtime = Path('/private/tmp/industrial-soc-wazuh-41410')
values = {}
for line in (runtime / 'secrets.env').read_text().splitlines():
    if line and not line.startswith('#') and '=' in line:
        key, value = line.split('=', 1)
        values[key] = value
ctx = ssl.create_default_context(cafile=str(runtime / 'certs/root-ca-verified-v2.pem'))
base = 'https://127.0.0.1:19201'

def get(path, username=None, password=None):
    req = urllib.request.Request(base + path)
    if username is not None:
        token = base64.b64encode(f'{username}:{password}'.encode()).decode()
        req.add_header('Authorization', 'Basic ' + token)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=6) as response:
            body = response.read()
            return response.status, body
    except urllib.error.HTTPError as error:
        return error.code, b''

unauth, _ = get('/')
print(f'unauthenticated root: HTTP {unauth} (expected 401)')
admin_status, root_body = get('/', 'admin', values['INDEXER_ADMIN_PASSWORD'])
print(f'admin authentication: HTTP {admin_status} (expected 200)')
if admin_status == 200:
    root_data = json.loads(root_body)
    print(f'Indexer version: {root_data.get("version", {}).get("number", "unknown")}')
health_status, health_body = get('/_cluster/health', 'admin', values['INDEXER_ADMIN_PASSWORD'])
health = json.loads(health_body) if health_status == 200 else {}
print(f'cluster health: HTTP {health_status}, status={health.get("status", "unavailable")}')
login_user = values['DASHBOARD_LOGIN_USERNAME']
login_status, _ = get('/_plugins/_security/authinfo', login_user, values['DASHBOARD_LOGIN_PASSWORD'])
service_status, _ = get('/_plugins/_security/authinfo', values['OPENSEARCH_USERNAME'], values['OPENSEARCH_PASSWORD'])
service_health, _ = get('/_cluster/health', values['OPENSEARCH_USERNAME'], values['OPENSEARCH_PASSWORD'])
service_indices, _ = get('/_cat/indices?format=json', values['OPENSEARCH_USERNAME'], values['OPENSEARCH_PASSWORD'])
admin_indices, body_indices = get('/_cat/indices?format=json', 'admin', values['INDEXER_ADMIN_PASSWORD'])
service_saved_objects, _ = get('/.opensearch_dashboards_industrial_soc_wazuh_41410/_search', values['OPENSEARCH_USERNAME'], values['OPENSEARCH_PASSWORD'])
print(f'disposable UI account authinfo: HTTP {login_status} (expected 200)')
print(f'Dashboard service account authinfo: HTTP {service_status} (expected 200)')
print(f'Dashboard service account cluster health permission: HTTP {service_health}')
print(f'Dashboard service account index listing permission: HTTP {service_indices}')
print(f'Admin index listing: HTTP {admin_indices}; SOC saved-object index present={b".opensearch_dashboards_industrial_soc_wazuh_41410" in body_indices}')
print(f'Dashboard service account saved-object access: HTTP {service_saved_objects}')
if (unauth, admin_status, health_status, login_status, service_status) != (401, 200, 200, 200, 200):
    raise SystemExit(1)
