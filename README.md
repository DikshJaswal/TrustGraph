# TrustGraph

TrustGraph is a privacy-preserving fraud intelligence platform for finding coordinated suspicious activity without creating a centralized identity database.

## The problem

Fraud is often organized in networks: many accounts may share devices, payment instruments, merchants, regions, or transaction timing. A simple rule such as “user 18392 is suspicious” misses the bigger pattern and exposes unnecessary identity data.

TrustGraph analyzes relationships instead:

```text
37 accounts → 6 devices → 4 payment instruments → 11 merchants
Risk score: 0.91
```

Identifiers are converted into pseudonymous tokens before graph analysis. Blockchain is used only for signed attestations, not for storing customer records.

## What the app does

- Accepts transaction metadata through an API or dashboard upload.
- Pseudonymizes accounts, devices, and instruments with HMAC-SHA256.
- Builds a relationship graph.
- Detects shared devices, shared instruments, high-risk behavior, and rapid transaction bursts.
- Displays an explainable anomaly score.
- Issues, verifies, and revokes company attestations.
- Supports demo mode and real local Hardhat blockchain mode.

## Quick start

Requirements: Node.js 18 or newer.

```powershell
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

Run the API smoke tests while the server is running:

```powershell
npm test
```

## Local blockchain mode

Use three terminals:

```powershell
npm run chain:node
npm run chain:compile
npm run chain:deploy
```

Create `.env` in the project root with the deployed contract address and a Hardhat test account key:

```env
RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=hardhat-test-account-private-key
CONTRACT_ADDRESS=deployed-contract-address
```

Restart the app and check `GET /api/health`. It should report `chainMode: real`.

## Documentation

- [User guide](docs/USER_GUIDE.md)
- [Team file guide](docs/FILE_GUIDE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API reference](docs/API.md)
- [Deployment guide](docs/DEPLOYMENT.md)
- [Threat model](docs/THREAT_MODEL.md)
- [Demo script](docs/DEMO_SCRIPT.md)

## Privacy and security warning

Pseudonymization is not perfect anonymity. Timing, merchant combinations, behavior, and graph structure can still create re-identification risk. This is a hackathon prototype. Production use requires authentication, tenant isolation, encryption, retention limits, key rotation, legal review, and stronger privacy techniques.

Never commit `.env`, wallet keys, customer data, or `node_modules/` to GitHub.
