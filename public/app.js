async function get(path, options) {
  const r = await fetch(path, options);
  return r.json();
}
function el(id) {
  return document.getElementById(id);
}
const issuerControl = document.createElement("select");
issuerControl.id = "issuer";
issuerControl.innerHTML =
  "<option>Company A Verified</option><option>Company B Verified</option><option>Company C Verified</option>";
issuerControl.style.cssText =
  "width:100%;margin:12px 0;padding:10px;background:#0b0e13;color:#e8edf2;border:1px solid #252d38;border-radius:6px";
document.addEventListener("DOMContentLoaded", () =>
  el("attest")?.before(issuerControl),
);
document.addEventListener("DOMContentLoaded", () => {
  const panel = document.createElement("section");
  panel.className = "panel";
  panel.style.marginTop = "20px";
  panel.innerHTML = `<div class="panel-head"><h3>Verify an attestation</h3><span>PUBLIC CHECK</span></div><div style="display:flex;gap:10px;margin-top:15px"><input id="verifyId" placeholder="Paste attestation ID" style="flex:1;padding:12px;background:#0b0e13;color:#e8edf2;border:1px solid #252d38;border-radius:6px"><button id="verifyButton" style="width:auto">Verify</button></div><div id="verifyResult" class="attestation hidden"></div>`;
  document.querySelector(".shell").append(panel);
  el("verifyButton").onclick = async () => {
    const result = el("verifyResult");
    const response = await get(`/api/verify?id=${encodeURIComponent(el("verifyId").value)}`);
    result.classList.remove("hidden");
    result.innerHTML = response.valid
      ? `✓ VALID<br>ISSUER: ${response.issuer}<br>NETWORK: ${response.network}`
      : `⚠ INVALID<br>${response.reason || "This attestation is revoked."}`;
  };
});
document.addEventListener("DOMContentLoaded", () => {
  const controls = document.querySelector(".controls");
  if (!controls) return;
  const privacy = document.createElement("section");
  privacy.className = "privacy-card";
  privacy.style.cssText =
    "margin:20px 0;padding:22px;border:1px solid #252d38;border-radius:10px;background:linear-gradient(145deg,#141b24,#10151c);display:grid;grid-template-columns:repeat(3,1fr);gap:18px";
  privacy.innerHTML =
    '<div><div class="eyebrow">01 · MINIMIZE</div><strong>Identity stays private</strong><p style="color:#8995a3;line-height:1.5">Accounts, devices, and instruments become HMAC tokens before graph analysis.</p></div><div><div class="eyebrow">02 · ANALYZE</div><strong>Patterns, not people</strong><p style="color:#8995a3;line-height:1.5">The model detects coordinated clusters and explains the signals behind each score.</p></div><div><div class="eyebrow">03 · ATTEST</div><strong>Proof without data sharing</strong><p style="color:#8995a3;line-height:1.5">Only a signed claim, hash, score, and issuer belong on-chain.</p></div>';
  controls.after(privacy);
  const sample = document.createElement("button");
  sample.textContent = "Download sample CSV";
  sample.className = "secondary";
  sample.style.marginTop = "8px";
  sample.onclick = () => {
    const csv =
      "account,device,instrument,merchant,amount,behavior\nuser-1,device-1,card-1,merchant-a,1200,0.82\nuser-2,device-1,card-2,merchant-a,1800,0.91\nuser-3,device-2,card-3,merchant-b,700,0.31";
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "trustgraph-sample.csv";
    link.click();
  };
  document.querySelector(".control-actions")?.append(sample);
});
function renderGraph(data) {
  const box = el("graph"),
    w = box.clientWidth || 650,
    h = 365,
    cx = w / 2,
    cy = h / 2,
    selected = [];
  ["account", "device", "instrument", "merchant"].forEach((type) =>
    data.nodes
      .filter((n) => n.type === type)
      .slice(0, type === "account" ? 12 : 6)
      .forEach((n) => selected.push(n)),
  );
  const positions = {};
  selected.forEach((n) => {
    const ti = ["account", "device", "instrument", "merchant"].indexOf(n.type),
      list = selected.filter((x) => x.type === n.type),
      i = list.indexOf(n),
      angle = (i / list.length) * Math.PI * 2,
      radius = [145, 85, 105, 155][ti];
    positions[n.id] = {
      x: cx + Math.cos(angle) * radius * (ti % 2 ? 1 : 0.9),
      y: cy + Math.sin(angle) * radius,
    };
  });
  let svg = `<svg viewBox="0 0 ${w} ${h}">`;
  data.edges.forEach((e) => {
    if (positions[e.source] && positions[e.target])
      svg += `<line x1="${positions[e.source].x}" y1="${positions[e.source].y}" x2="${positions[e.target].x}" y2="${positions[e.target].y}" stroke="#33404b" stroke-width="1"/>`;
  });
  selected.forEach((n) => {
    const p = positions[n.id],
      color = {
        account: "#54e0d0",
        device: "#f5c96a",
        instrument: "#a78bfa",
        merchant: "#ff6673",
      }[n.type];
    svg += `<circle cx="${p.x}" cy="${p.y}" r="${n.type === "account" ? 5 : 8}" fill="${color}"/><text x="${p.x + 10}" y="${p.y + 3}">${n.label}</text>`;
  });
  el("graph").innerHTML = svg + "</svg>";
}
function render(data) {
  el("clusterId").textContent = data.clusterId;
  el("riskScore").textContent = data.riskScore;
  el("stats").innerHTML = Object.entries(data.counts)
    .map(
      ([k, v]) =>
        `<div class="stat"><strong>${v}</strong><label>${k}</label></div>`,
    )
    .join("");
  if (data.signals) {
    el("stats").insertAdjacentHTML(
      "beforeend",
      Object.entries(data.signals)
        .map(
          ([key, value]) =>
            `<div class="stat signal-stat"><strong>${value}</strong><label>signal · ${key}</label></div>`,
        )
        .join(""),
    );
  }
  el("reasons").innerHTML = data.reasons
    .map((x) => `<div class="reason">${x}</div>`)
    .join("");
  renderGraph(data);
  loadTransactions();
}
async function loadTransactions() {
  const response = await get("/api/transactions");
  el("transactions").innerHTML = response.transactions
    .slice(0, 12)
    .map(
      (r) =>
        `<tr><td>${r.account}</td><td>${r.device}</td><td>${r.merchant}</td><td>₹${Number(r.amount).toLocaleString()}</td><td><span class="risk-pill">${Number(r.behavior).toFixed(2)}</span></td></tr>`,
    )
    .join("");
}
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/),
    headers = lines
      .shift()
      .split(",")
      .map((x) => x.trim());
  return lines.map((line) => {
    const values = line.split(",");
    return Object.fromEntries(
      headers.map((h, i) => [h, values[i]?.trim() || ""]),
    );
  });
}
async function upload() {
  const file = el("fileInput").files[0];
  if (!file) {
    el("status").textContent = "Choose a JSON or CSV file first.";
    return;
  }
  const text = await file.text(),
    transactions = file.name.toLowerCase().endsWith(".csv")
      ? parseCsv(text)
      : JSON.parse(text);
  const response = await get("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transactions: Array.isArray(transactions)
        ? transactions
        : transactions.transactions,
    }),
  });
  if (response.error) {
    el("status").textContent = response.error;
    return;
  }
  render(response.analysis);
  el("status").textContent =
    `Analyzed ${transactions.length} transactions successfully.`;
}
async function revoke(id) {
  const result = await get("/api/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (result.ok) {
    el("attestation").innerHTML += "\n<br>⚠ ATTESTATION REVOKED";
    await loadAttestationHistory();
  }
}
async function loadAttestationHistory() {
  const result = await get("/api/attestations");
  let panel = el("attestationHistory");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "attestationHistory";
    panel.className = "attestation";
    el("attestation").after(panel);
  }
  panel.classList.toggle("hidden", result.attestations.length === 0);
  panel.innerHTML = `<strong>ATTESTATION AUDIT TRAIL (${result.verificationCount})</strong><br>${result.attestations
    .map((item) => `${item.issuer} · ${item.revoked ? "REVOKED" : "ACTIVE"} · ${item.id}`)
    .join("<br>")}`;
}
async function init() {
  const health = await get("/api/health");
  const badge = document.querySelector(".badge");
  if (badge) {
    badge.textContent = `● ${health.chainMode === "real" ? "REAL CHAIN CONNECTED" : "DEMO CHAIN MODE"}`;
    badge.style.color = health.chainMode === "real" ? "#54e0d0" : "#f5c96a";
  }
  render(await get("/api/analysis"));
  await loadAttestationHistory();
}
el("upload").onclick = () =>
  upload().catch(
    () =>
      (el("status").textContent =
        "Could not parse this file. Check the JSON or CSV format."),
  );
el("reset").onclick = async () => {
  const response = await get("/api/reset", { method: "POST" });
  render(response.analysis);
  el("status").textContent = "Demo fraud-ring data restored.";
};
el("attest").onclick = async () => {
  const b = el("attest");
  b.disabled = true;
  b.textContent = "Writing attestation…";
  const a = await get("/api/attest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ issuer: el("issuer").value }),
  });
  el("attestation").classList.remove("hidden");
  el("attestation").innerHTML =
    `✓ VERIFIED ATTESTATION<br>ISSUER: ${a.issuer}<br>ID: ${a.id}<br>TX: ${a.txHash}<br>INDEPENDENT VERIFICATIONS: ${a.verificationCount}<br>NETWORK: ${a.network}<br><button onclick="revoke('${a.id}')" class="secondary">Revoke this attestation</button>`;
  b.disabled = false;
  b.textContent = "Issue another attestation →";
  await loadAttestationHistory();
};
init();
