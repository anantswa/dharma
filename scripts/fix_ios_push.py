#!/usr/bin/env python3
"""Enable Push Notifications on the App ID + regenerate the App Store provisioning
profile to include aps-environment. Headless via the App Store Connect API."""
import base64, time
from pathlib import Path
import jwt, requests

KEY_ID = "TQAZ5JQ2LT"; ISSUER = "614cfe80-272d-48d3-b61a-87b4b96adc14"
P8 = "/Users/kashyap/projects/dharma/credentials/AuthKey_TQAZ5JQ2LT.p8"
BUNDLE_DB_ID = "B8Z8HZU6YN"; CERT_ID = "2CDFYDADQH"; OLD_PROFILE = "P29QNRYDLQ"
CRED = Path("/Users/kashyap/projects/dharma/credentials")
API = "https://api.appstoreconnect.apple.com"

def H():
    now = int(time.time())
    t = jwt.encode({"iss": ISSUER, "iat": now, "exp": now+1200, "aud": "appstoreconnect-v1"},
                   open(P8).read(), algorithm="ES256", headers={"kid": KEY_ID, "typ": "JWT"})
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}

# 1. enable Push Notifications capability on the bundle id
r = requests.post(f"{API}/v1/bundleIdCapabilities", headers=H(), json={"data": {
    "type": "bundleIdCapabilities",
    "attributes": {"capabilityType": "PUSH_NOTIFICATIONS"},
    "relationships": {"bundleId": {"data": {"type": "bundleIds", "id": BUNDLE_DB_ID}}}}})
print("enable push:", r.status_code, "(409=already on)" if r.status_code == 409 else r.text[:160] if r.status_code>=400 else "ok")

# 2. delete the old profile (doesn't include push)
d = requests.delete(f"{API}/v1/profiles/{OLD_PROFILE}", headers=H())
print("delete old profile:", d.status_code)

# 3. create a fresh App Store profile (now includes aps-environment)
body = {"data": {"type": "profiles",
        "attributes": {"name": "Dharma App Store v2", "profileType": "IOS_APP_STORE"},
        "relationships": {
            "bundleId": {"data": {"type": "bundleIds", "id": BUNDLE_DB_ID}},
            "certificates": {"data": [{"type": "certificates", "id": CERT_ID}]}}}}
r = requests.post(f"{API}/v1/profiles", headers=H(), json=body)
if r.status_code not in (200, 201):
    print("profile error:", r.status_code, r.text[:300]); raise SystemExit(1)
prof = base64.b64decode(r.json()["data"]["attributes"]["profileContent"])
(CRED / "dharma.mobileprovision").write_bytes(prof)
print("✅ new profile:", r.json()["data"]["id"], "→ dharma.mobileprovision (credentials.json path unchanged)")
