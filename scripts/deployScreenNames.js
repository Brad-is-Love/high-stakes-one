
// deploy with npx hardhat run scripts/deployScreenNames.js --network mainnet


const path = require("path");

async function main() {
  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const ScreenNames = await ethers.getContractFactory("ScreenNames");
  const screenNames = await ScreenNames.deploy();
  await screenNames.deployed();

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(screenNames, "ScreenNames");
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
