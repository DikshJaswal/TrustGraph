# Team file guide

| File or folder | Responsibility |
|---|---|
| `server.js` | Node API, pseudonymization, graph analysis, attestations, static file server |
| `public/index.html` | Dashboard structure and visible sections |
| `public/app.js` | Browser behavior, graph rendering, uploads, attestations, verification |
| `public/styles.css` | Dashboard layout, colors, responsive styling |
| `contracts/TrustGraphAttestation.sol` | Solidity registry for issuing and revoking claims |
| `hardhat.config.js` | Hardhat network and Solidity configuration |
| `scripts/deploy.js` | Deploys the Solidity contract |
| `test.js` | API smoke tests |
| `render.yaml` | Render deployment configuration |
| `.env.example` | Template for local blockchain variables |
| `docs/` | User, architecture, API, deployment, privacy, and demo documentation |

## Suggested ownership

- **Backend/data:** `server.js`, `test.js`
- **Frontend/UI:** `public/index.html`, `public/app.js`, `public/styles.css`
- **Blockchain:** `contracts/`, `hardhat.config.js`, `scripts/deploy.js`
- **Deployment/documentation:** `render.yaml`, `README.md`, `docs/`

## Safe editing rules

- Never commit `.env` or private keys.
- Never put raw identities or transaction details into the smart contract.
- Run `npm test` after backend changes.
- Keep API response field names stable when changing the frontend.
