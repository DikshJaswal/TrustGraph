# TrustGraph user guide

## 1. Start the application

```powershell
npm start
```

Open `http://localhost:3000`.

## 2. Understand the dashboard

- **Cluster ID:** pseudonymous identifier for the suspicious group.
- **Graph anomaly:** overall risk score from 0 to 1.
- **Stats:** number of accounts, devices, instruments, and merchants.
- **Signal cards:** specific factors contributing to the score.
- **Trust graph:** visual relationships between pseudonymous entities.
- **Why this is risky:** human-readable model explanations.

## 3. Analyze your own data

Upload a JSON or CSV file containing:

```text
account,device,instrument,merchant,amount,behavior
user-1,device-1,card-1,merchant-a,1200,0.82
```

Use **Reset demo data** to restore the built-in fraud-ring example.

## 4. Issue an attestation

Choose an issuer and click **Issue attestation**. The app creates a signed claim containing a cluster hash, risk score, issuer, and transaction hash. It does not place raw identity or transaction data on-chain.

## 5. Verify and revoke

Copy the attestation ID into the verification box. A valid claim displays its issuer and network. Revoking the claim changes its status to invalid.

## Demo mode versus real-chain mode

Without blockchain environment variables, the app uses a local simulated attestation. With `RPC_URL`, `PRIVATE_KEY`, and `CONTRACT_ADDRESS`, it submits the attestation to the configured blockchain.
