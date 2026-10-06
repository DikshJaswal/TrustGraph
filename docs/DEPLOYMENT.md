# Deployment guide

## Render deployment

1. Push the repository to GitHub.
2. In Render, choose **New → Blueprint**.
3. Select the repository.
4. Render reads `render.yaml`.
5. Deploy the service.
6. Open the generated Render URL.
7. Check `/api/health`.

Render uses:

```text
Build command: npm install
Start command: npm start
Health check: /api/health
```

## Render blockchain settings

The local Hardhat URL `127.0.0.1:8545` works only on your computer. For a deployed real-chain mode, use a public testnet RPC and a test wallet, then add these Render environment variables:

```text
RPC_URL
PRIVATE_KEY
CONTRACT_ADDRESS
```

For the fastest hackathon deployment, leave these variables unset and use demo mode.

## Git safety checklist

- `.env` is ignored.
- No private key appears in source files.
- No customer data is committed.
- `npm test` passes before deployment.
