const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function loadEnv() {
  try {
    const file = fs.readFileSync(path.join(__dirname, ".env"), "utf8");
    file.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
      }
    });
  } catch {}
}

loadEnv();

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const SECRET =
  process.env.TRUSTGRAPH_SECRET || "hackathon-demo-secret-change-me";

function pseudonymize(value) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(String(value))
    .digest("hex")
    .slice(0, 12);
}

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function makeDemoTransactions() {
  const rows = [];
  const merchants = [
    "Northstar Electronics",
    "QuickCart",
    "Urban Travels",
    "GameVault",
    "FreshBasket",
  ];

  for (let i = 1; i <= 37; i += 1) {
    const ring = i <= 21;
    rows.push({
      account: `customer-${i}`,
      device: ring ? `device-ring-${(i % 3) + 1}` : `device-${i}`,
      instrument: ring ? `card-ring-${(i % 4) + 1}` : `card-${i}`,
      merchant: ring ? merchants[i % 2] : merchants[(i + 2) % merchants.length],
      region: ring ? "IN-NCR" : ["IN-MH", "IN-KA", "IN-TN"][i % 3],
      amount: ring ? 4200 + ((i * 173) % 1600) : 400 + ((i * 89) % 3000),
      timestamp: new Date(
        Date.now() - (ring ? i * 90000 : i * 3600000),
      ).toISOString(),
      behavior: ring ? 0.82 + (i % 5) / 50 : 0.2 + (i % 5) / 20,
    });
  }
  return rows;
}

function analyze(rows) {
  const nodes = new Map();
  const edges = [];
  const grouped = { account: [], device: [], instrument: [], merchant: [] };

  const addNode = (type, raw) => {
    const id = `${type}:${pseudonymize(raw)}`;
    if (!nodes.has(id))
      nodes.set(id, {
        id,
        label: `#${pseudonymize(raw)}`,
        type,
        connections: 0,
      });
    return id;
  };

  rows.forEach((row) => {
    const account = addNode("account", row.account);
    const device = addNode("device", row.device);
    const instrument = addNode("instrument", row.instrument);
    const merchant = addNode("merchant", row.merchant);

    grouped.account.push(account);
    grouped.device.push(device);
    grouped.instrument.push(instrument);
    grouped.merchant.push(merchant);

    [
      [account, device],
      [account, instrument],
      [account, merchant],
    ].forEach(([source, target]) => {
      edges.push({ source, target });
      nodes.get(source).connections += 1;
      nodes.get(target).connections += 1;
    });
  });

  const counts = {
    accounts: new Set(grouped.account).size,
    devices: new Set(grouped.device).size,
    instruments: new Set(grouped.instrument).size,
    merchants: new Set(grouped.merchant).size,
  };
  const sharedDevices = [...new Set(grouped.device)]
    .map((id) => ({
      id,
      count: grouped.device.filter((item) => item === id).length,
    }))
    .filter((item) => item.count > 2)
    .sort((a, b) => b.count - a.count);
  const sharedInstruments = [...new Set(grouped.instrument)]
    .map((id) => ({
      id,
      count: grouped.instrument.filter((item) => item === id).length,
    }))
    .filter((item) => item.count > 2)
    .sort((a, b) => b.count - a.count);
  const highBehaviorCount = rows.filter((row) => row.behavior > 0.8).length;
  const timestamps = rows
    .map((row) => new Date(row.timestamp).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const rapidTransactionPairs = timestamps.filter(
    (time, index) => index > 0 && time - timestamps[index - 1] <= 10 * 60 * 1000,
  ).length;
  const riskScore = Number(
    Math.min(
      0.99,
      0.45 +
        sharedDevices.length * 0.08 +
        sharedInstruments.length * 0.05 +
        Math.min(highBehaviorCount / 100, 0.15) +
        Math.min(rapidTransactionPairs / 100, 0.15) +
        counts.accounts / 100,
    ).toFixed(2),
  );
  const clusterHash = hash(
    JSON.stringify({ counts, riskScore, edgeCount: edges.length, highBehaviorCount, rapidTransactionPairs }),
  );

  return {
    counts,
    riskScore,
    clusterId: `TG-${clusterHash.slice(0, 6).toUpperCase()}`,
    clusterHash,
    nodes: [...nodes.values()],
    edges,
    signals: { sharedDevices: sharedDevices.length, sharedInstruments: sharedInstruments.length, highBehaviorCount, rapidTransactionPairs },
    reasons: [
      `${sharedDevices[0]?.count || 0} accounts share the most connected device`,
      `${sharedInstruments[0]?.count || 0} accounts share the most connected payment instrument`,
      `${highBehaviorCount} transactions have high-risk behavior features`,
      `${rapidTransactionPairs} transaction pairs occurred within a 10-minute window`,
    ],
  };
}

function attestation(analysis, issuer = "TrustGraph Demo Issuer") {
  const payload = JSON.stringify({
    clusterHash: analysis.clusterHash,
    riskScore: analysis.riskScore,
    issuer,
  });
  return {
    id: `0x${hash(payload).slice(0, 16)}`,
    txHash: `0x${hash(`${payload}tx`).slice(0, 64)}`,
    network: "Local demo chain",
    issuer,
    createdAt: new Date().toISOString(),
    revoked: false,
  };
}

async function issueAttestation(analysis, issuer = "TrustGraph Demo Issuer") {
  if (
    !process.env.RPC_URL ||
    !process.env.PRIVATE_KEY ||
    !process.env.CONTRACT_ADDRESS
  ) {
    return attestation(analysis, issuer);
  }

  try {
    const { ethers } = require("ethers");
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      [
        "function issue(bytes32 id, bytes32 clusterHash, uint256 riskScore) external",
      ],
      wallet,
    );
    const id = ethers.id(`${analysis.clusterHash}:${Date.now()}`);
    const tx = await contract.issue(
      id,
      `0x${analysis.clusterHash}`,
      Math.round(analysis.riskScore * 100),
    );
    await tx.wait();
    return {
      id,
      txHash: tx.hash,
      network: process.env.RPC_URL,
      issuer: wallet.address,
      createdAt: new Date().toISOString(),
      revoked: false,
      realChain: true,
    };
  } catch (error) {
    console.error(
      "Real chain unavailable, using demo attestation:",
      error.message,
    );
    return { ...attestation(analysis, issuer), chainError: error.message };
  }
}

let currentRows = makeDemoTransactions();
let analysis = analyze(currentRows);
let latestAttestation = null;
let attestations = [];

function sendJson(res, value, status = 200) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(value));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 2e6) req.destroy();
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function normalizeRows(rows) {
  return rows
    .filter(
      (row) => row.account && row.device && row.instrument && row.merchant,
    )
    .map((row, index) => ({
      account: String(row.account),
      device: String(row.device),
      instrument: String(row.instrument),
      merchant: String(row.merchant),
      region: String(row.region || "unknown"),
      amount: Number(row.amount) || 0,
      timestamp:
        row.timestamp || new Date(Date.now() - index * 60000).toISOString(),
      behavior: Number(row.behavior ?? row.behavior_score ?? 0.5),
    }));
}

function server(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === "/api/health")
    return sendJson(res, {
      ok: true,
      project: "TrustGraph",
      chainMode:
        process.env.RPC_URL &&
        process.env.PRIVATE_KEY &&
        process.env.CONTRACT_ADDRESS
          ? "real"
          : "demo",
    });
  if (url.pathname === "/api/transactions")
    return sendJson(res, {
      transactions: currentRows.map((row) => ({
        ...row,
        account: `#${pseudonymize(row.account)}`,
        device: `#${pseudonymize(row.device)}`,
        instrument: `#${pseudonymize(row.instrument)}`,
      })),
    });
  if (url.pathname === "/api/analysis") return sendJson(res, analysis);
  if (url.pathname === "/api/reset" && req.method === "POST") {
    currentRows = makeDemoTransactions();
    analysis = analyze(currentRows);
    latestAttestation = null;
    attestations = [];
    return sendJson(res, { ok: true, analysis });
  }
  if (url.pathname === "/api/analyze" && req.method === "POST")
    return readBody(req).then((raw) => {
      try {
        const rows = normalizeRows(JSON.parse(raw).transactions || []);
        if (rows.length < 3)
          return sendJson(
            res,
            { error: "Upload at least 3 valid transactions" },
            400,
          );
        currentRows = rows;
        analysis = analyze(rows);
        latestAttestation = null;
        return sendJson(res, { ok: true, analysis });
      } catch {
        return sendJson(
          res,
          { error: "Invalid JSON transaction payload" },
          400,
        );
      }
    });
  if (url.pathname === "/api/attest" && req.method === "POST")
    return readBody(req).then((raw) => {
      let issuer = "TrustGraph Demo Issuer";
      try {
        issuer = JSON.parse(raw || "{}").issuer || issuer;
      } catch {}
      return issueAttestation(analysis, issuer).then((result) => {
        latestAttestation = result;
        attestations.push(result);
        return sendJson(res, {
          ...result,
          verificationCount: attestations.length,
          attestations,
        });
      });
    });
  if (url.pathname === "/api/attestations")
    return sendJson(res, {
      attestations,
      verificationCount: attestations.length,
    });
  if (url.pathname === "/api/verify") {
    const item = attestations.find(
      (entry) => entry.id === url.searchParams.get("id"),
    );
    if (!item)
      return sendJson(res, { valid: false, reason: "Attestation not found" }, 404);
    return sendJson(res, {
      valid: !item.revoked,
      issuer: item.issuer,
      id: item.id,
      txHash: item.txHash,
      revoked: item.revoked,
      network: item.network,
    });
  }
  if (url.pathname === "/api/attestation")
    return sendJson(res, latestAttestation || { exists: false });
  if (url.pathname === "/api/revoke" && req.method === "POST")
    return readBody(req).then((raw) => {
      try {
        const item = attestations.find(
          (entry) => entry.id === JSON.parse(raw).id,
        );
        if (!item)
          return sendJson(res, { error: "Attestation not found" }, 404);
        item.revoked = true;
        return sendJson(res, { ok: true, attestation: item });
      } catch {
        return sendJson(res, { error: "Invalid request" }, 400);
      }
    });

  const requested = url.pathname === "/" ? "/public/index.html" : url.pathname;
  const file = path.join(ROOT, requested.replace(/^\/+/, ""));
  if (!file.startsWith(path.join(ROOT, "public")))
    return sendJson(res, { error: "Not found" }, 404);
  fs.readFile(file, (error, data) => {
    if (error) return sendJson(res, { error: "Not found" }, 404);
    const types = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
    };
    res.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
    });
    res.end(data);
  });
}

const app = http.createServer(server);
app.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Stop the existing TrustGraph server or run with a different port.`,
    );
    process.exitCode = 1;
  } else throw error;
});
app.listen(PORT, () =>
  console.log(`TrustGraph running at http://localhost:${PORT}`),
);
