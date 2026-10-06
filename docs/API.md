# TrustGraph API

Base URL: `http://localhost:3000`

## Analysis

`GET /api/analysis` returns the pseudonymous graph, counts, anomaly score, and explanations.

`POST /api/analyze` accepts `{ "transactions": [...] }`. Each transaction should include `account`, `device`, `instrument`, `merchant`, `amount`, and `behavior`.

## Attestations

`POST /api/attest` with `{ "issuer": "Company A Verified" }` issues a claim.

`GET /api/attestations` lists claims. `POST /api/revoke` with `{ "id": "0x..." }` revokes one.

`GET /api/verify?id=0x...` verifies an attestation and returns its issuer, network, and revocation status.

`POST /api/reset` restores the synthetic fraud-ring dataset.
