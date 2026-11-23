#!/usr/bin/env python3
import json
import os
from pathlib import Path

runtime = Path('/private/tmp/industrial-soc-wazuh-41410')
values = {}
for line in (runtime / 'secrets.env').read_text().splitlines():
    if line and not line.startswith('#') and '=' in line:
        key, value = line.split('=', 1)
        values[key] = value
required = ('WAZUH_API_USERNAME', 'WAZUH_API_PASSWORD', 'WAZUH_CLUSTER_KEY')
if any(not values.get(key) for key in required):
    raise SystemExit('Required isolated runtime settings are missing.')

def private_write(path: Path, text: str) -> None:
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as stream:
        stream.write(text)
    os.chmod(path, 0o600)

api_config = (
    'hosts:\n'
    '  - default:\n'
    '      url: "https://localhost"\n'
    '      port: 15550\n'
    f'      username: {json.dumps(values["WAZUH_API_USERNAME"])}\n'
    f'      password: {json.dumps(values["WAZUH_API_PASSWORD"])}\n'
    '      run_as: true\n'
)
private_write(runtime / 'dashboard-data/wazuh/config/wazuh.yml', api_config)

dashboard_template = Path(__file__).parent / 'config/industrial-soc-wazuh-41410.yml'
dashboard_config = dashboard_template.read_text() + (
    f'opensearch.username: {json.dumps(values["OPENSEARCH_USERNAME"])}\n'
    f'opensearch.password: {json.dumps(values["OPENSEARCH_PASSWORD"])}\n'
)
private_write(runtime / 'dashboard-config.yml', dashboard_config)
manager_template = Path(__file__).parent / 'config/wazuh_manager.conf'
manager_config = manager_template.read_text().replace(
    '__WAZUH_CLUSTER_KEY__', values['WAZUH_CLUSTER_KEY']
)
if '__WAZUH_CLUSTER_KEY__' in manager_config:
    raise SystemExit('Manager configuration template was not fully rendered.')
private_write(runtime / 'manager/wazuh_manager.conf', manager_config)
print('Generated isolated Manager and Dashboard runtime configs with mode 0600; secret values suppressed.')
