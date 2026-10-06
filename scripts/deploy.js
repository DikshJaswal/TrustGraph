const hre = require('hardhat');
async function main() {
  const Factory = await hre.ethers.getContractFactory('TrustGraphAttestation');
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  console.log(`TrustGraphAttestation deployed to: ${await contract.getAddress()}`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
