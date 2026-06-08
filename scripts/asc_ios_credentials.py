#!/usr/bin/env python3
"""
Mint iOS build credentials (Distribution Certificate + App Store Provisioning Profile)
directly via the App Store Connect API using the .p8 key — fully headless, no Apple ID
login, no 2FA. Writes credentials/ + credentials.json so `eas build -p ios` uses them locally.
"""
import base64, json, os, subprocess, time, secrets
from pathlib import Path
import jwt, requests

KEY_ID   = "TQAZ5JQ2LT"
ISSUER   = "614cfe80-272d-48d3-b61a-87b4b96adc14"
P8       = "/Users/kashyap/projects/dharma/credentials/AuthKey_TQAZ5JQ2LT.p8"
BUNDLE   = "com.taraventures.dharma"
APP_NAME = "Dharma"
CRED = Path("/Users/kashyap/projects/dharma/credentials"); CRED.mkdir(exist_ok=True)
API = "https://api.appstoreconnect.apple.com"


def token():
    key = open(P8).read()
    now = int(time.time())
    return jwt.encode({"iss": ISSUER, "iat": now, "exp": now + 1200, "aud": "appstoreconnect-v1"},
                      key, algorithm="ES256", headers={"kid": KEY_ID, "typ": "JWT"})


def H():
    return {"Authorization": f"Bearer {token()}", "Content-Type": "application/json"}


def find_or_create_bundle():
    r = requests.get(f"{API}/v1/bundleIds", headers=H(),
                     params={"filter[identifier]": BUNDLE, "limit": 200})
    r.raise_for_status()
    for b in r.json()["data"]:
        if b["attributes"]["identifier"] == BUNDLE:
            print(f"  bundleId exists: {b['id']}")
            return b["id"]
    r = requests.post(f"{API}/v1/bundleIds", headers=H(), json={"data": {
        "type": "bundleIds",
        "attributes": {"identifier": BUNDLE, "name": APP_NAME.replace(" ", ""), "platform": "IOS"}}})
    r.raise_for_status()
    bid = r.json()["data"]["id"]
    print(f"  bundleId created: {bid}")
    return bid


def create_distribution_cert():
    # private key + CSR
    subprocess.run(["openssl", "req", "-new", "-newkey", "rsa:2048", "-nodes",
                    "-keyout", str(CRED / "dist.key"), "-out", str(CRED / "dist.csr"),
                    "-subj", "/CN=Dharma Distribution/O=TARA VENTURES PTE. LTD./C=SG"],
                   check=True, capture_output=True)
    csr = open(CRED / "dist.csr").read()
    for ctype in ("DISTRIBUTION", "IOS_DISTRIBUTION"):
        r = requests.post(f"{API}/v1/certificates", headers=H(), json={"data": {
            "type": "certificates", "attributes": {"certificateType": ctype, "csrContent": csr}}})
        if r.status_code in (200, 201):
            d = r.json()["data"]
            der = base64.b64decode(d["attributes"]["certificateContent"])
            open(CRED / "dist.cer", "wb").write(der)
            print(f"  certificate created ({ctype}): {d['id']}")
            return d["id"]
        print(f"  [{ctype}] {r.status_code}: {r.text[:200]}")
    raise SystemExit("certificate creation failed")


def make_p12():
    pw = secrets.token_urlsafe(12)
    subprocess.run(["openssl", "x509", "-inform", "DER", "-in", str(CRED / "dist.cer"),
                    "-out", str(CRED / "dist.pem")], check=True, capture_output=True)
    subprocess.run(["openssl", "pkcs12", "-export", "-legacy",
                    "-inkey", str(CRED / "dist.key"), "-in", str(CRED / "dist.pem"),
                    "-out", str(CRED / "dist.p12"), "-name", "Apple Distribution",
                    "-passout", f"pass:{pw}"], check=True, capture_output=True)
    print("  dist.p12 built")
    return pw


def create_profile(bundle_db_id, cert_id):
    body = {"data": {"type": "profiles",
            "attributes": {"name": "Dharma App Store", "profileType": "IOS_APP_STORE"},
            "relationships": {
                "bundleId": {"data": {"type": "bundleIds", "id": bundle_db_id}},
                "certificates": {"data": [{"type": "certificates", "id": cert_id}]}}}}
    r = requests.post(f"{API}/v1/profiles", headers=H(), json=body)
    if r.status_code not in (200, 201):
        print("  profile error:", r.status_code, r.text[:300]); r.raise_for_status()
    d = r.json()["data"]
    prof = base64.b64decode(d["attributes"]["profileContent"])
    open(CRED / "dharma.mobileprovision", "wb").write(prof)
    print(f"  provisioning profile created: {d['id']}")


def main():
    print("→ bundle id");  bid = find_or_create_bundle()
    print("→ distribution certificate"); cert_id = create_distribution_cert()
    print("→ p12"); pw = make_p12()
    print("→ provisioning profile"); create_profile(bid, cert_id)
    creds = {"ios": {"provisioningProfilePath": "credentials/dharma.mobileprovision",
                     "distributionCertificate": {"path": "credentials/dist.p12", "password": pw}}}
    open("/Users/kashyap/projects/dharma/credentials.json", "w").write(json.dumps(creds, indent=2))
    print("\n✅ credentials.json written. p12 password:", pw)


if __name__ == "__main__":
    main()
