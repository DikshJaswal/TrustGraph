const assert = require("assert");
const base = "http://localhost:3000";
async function request(path, options) {
  const response = await fetch(base + path, options);
  const body = await response.json();
  assert.equal(response.ok, true, `${path} failed: ${JSON.stringify(body)}`);
  return body;
}
async function main() {
  const analysis = await request("/api/analysis");
  assert.ok(
    analysis.clusterId && analysis.nodes.length > 0,
    "analysis should contain a graph",
  );
  assert.ok(
    analysis.riskScore >= 0 && analysis.riskScore <= 1,
    "risk score should be normalized",
  );
  const uploaded = await request("/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      transactions: [
        {
          account: "a",
          device: "shared-device",
          instrument: "card-a",
          merchant: "shop-a",
          amount: 100,
          behavior: 0.2,
        },
        {
          account: "b",
          device: "shared-device",
          instrument: "card-b",
          merchant: "shop-a",
          amount: 200,
          behavior: 0.9,
        },
        {
          account: "c",
          device: "shared-device",
          instrument: "card-c",
          merchant: "shop-b",
          amount: 300,
          behavior: 0.8,
        },
      ],
    }),
  });
  assert.equal(
    uploaded.analysis.counts.accounts,
    3,
    "uploaded data should replace the active dataset",
  );
  const attestation = await request("/api/attest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ issuer: "Test Company" }),
  });
  assert.ok(
    attestation.issuer === "Test Company" || attestation.realChain === true,
    "attestation should use the requested demo issuer or a real-chain wallet issuer",
  );
  const revoked = await request("/api/revoke", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: attestation.id }),
  });
  assert.equal(revoked.attestation.revoked, true);
  const reset = await request("/api/reset", { method: "POST" });
  assert.equal(
    reset.analysis.counts.accounts,
    37,
    "reset should restore demo data",
  );
  console.log("TrustGraph API smoke tests passed.");
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
