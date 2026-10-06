# TrustGraph architecture

```text
Business transaction metadata
            ↓
HMAC pseudonymization gateway
            ↓
Private relationship graph
            ↓
Explainable risk signals
            ↓
Signed attestation
            ↓
Blockchain registry
```

## Backend

The Node server accepts uploads, converts sensitive identifiers into keyed pseudonyms, creates graph nodes and edges, and calculates explainable signals.

## Frontend

The browser dashboard visualizes the graph and lets a user upload data, inspect risk reasons, issue attestations, verify claims, and revoke claims.

## Blockchain

The Solidity contract stores a cluster hash, risk score, issuer, timestamp, and revocation state. It does not store names, IP addresses, devices, payment details, or transaction history.

## Production evolution

The prototype can evolve into a multi-tenant service with authenticated issuers, rotating pseudonyms, encrypted storage, zero-knowledge proofs, and independent model governance.
