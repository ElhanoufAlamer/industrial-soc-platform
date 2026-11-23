#!/usr/bin/env python3
import json
import os
from pathlib import Path

runtime = Path('/private/tmp/industrial-soc-wazuh-41410')
secret_file = runtime / 'secrets.env'
values = {}
for line in secret_file.read_text().splitlines():
    if line and not line.startswith('#') and '=' in line:
        key, value = line.split('=', 1)
        values[key] = value
required = ('WAZUH_API_USERNAME', 'WAZUH_API_PASSWORD')
if any(not values.get(key) for key in required):
    raise SystemExit('Required local API settings are missing.')
path = runtime / 'dashboard-data/wazuh/config/wazuh.yml'
path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
text = (
    'hosts:\n'
    '  - default:\n'
    '      url: "https://127.0.0.1"\n'
    '      port: 15550\n'
    f'      username: {json.dumps(values["WAZUH_API_USERNAME"])}\n'
    f'      password: {json.dumps(values["WAZUH_API_PASSWORD"])}\n'
    '      run_as: true\n'
)
fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, 'w') as stream:
    stream.write(text)
os.chmod(path, 0o600)
print('Generated isolated Wazuh API config with mode 0600; secret values suppressed.')
