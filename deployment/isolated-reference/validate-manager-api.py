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
ctx = ssl.create_default_context(cafile=str(runtime / 'manager/api-server.crt'))
base = 'https://localhost:15550'
basic = base64.b64encode(
    f'{values["WAZUH_API_USERNAME"]}:{values["WAZUH_API_PASSWORD"]}'.encode()
).decode()
login = urllib.request.Request(
    base + '/security/user/authenticate', method='POST',
    headers={'Authorization': 'Basic ' + basic},
)
try:
    with urllib.request.urlopen(login, context=ctx, timeout=8) as response:
        payload = json.loads(response.read())
        token = payload.get('data', {}).get('token')
        print(f'Manager API authentication: HTTP {response.status}, token issued={bool(token)}; TLS peer verified.')
except urllib.error.HTTPError as error:
    print(f'Manager API authentication: HTTP {error.code}; TLS peer verified.')
    raise SystemExit(1)
if not token:
    raise SystemExit(1)
headers = {'Authorization': 'Bearer ' + token}
for endpoint, label in (('/manager/info', 'manager info'), ('/agents?limit=1', 'agent inventory')):
    request = urllib.request.Request(base + endpoint, headers=headers)
    try:
        with urllib.request.urlopen(request, context=ctx, timeout=8) as response:
            result = json.loads(response.read())
            data = result.get('data', {})
            if label == 'manager info':
                items = data.get('affected_items', [{}])
                version = items[0].get('version', 'unknown') if items else 'unknown'
                print(f'{label}: HTTP {response.status}, version={version}')
            else:
                total = data.get('total_affected_items', 'unknown')
                print(f'{label}: HTTP {response.status}, total agents={total}')
    except urllib.error.HTTPError as error:
        print(f'{label}: HTTP {error.code}')
        raise SystemExit(1)
