
// deploy with npx hardhat run scripts/deploy.js --network mainnet

const path = require("path");

async function main() {
  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  const HighStakesONE = await ethers.getContractFactory("HighStakesONE");
  const highStakesONE = await HighStakesONE.deploy();
  await highStakesONE.deployed();


  console.log("HighStakesONE address:", highStakesONE.address);
  console.log("HighStakesONE name:", await highStakesONE.name());
  console.log("HighStakesONE symbol:", await highStakesONE.symbol());

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(highStakesONE, "HighStakesONE");

}

function saveFrontendFiles(contract, name) {
  const fs = require("fs");
  const contractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, name+"-address.json"),
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const artifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    path.join(contractsDir, name+".json"),
    JSON.stringify(artifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
