// This is a script for deploying your contracts. You can adapt it to deploy
// deploy with npx hardhat run scripts/deploy.js --network localhost

const path = require("path");

async function main() {
  // ethers is available in the global scope
  const [deployer] = await ethers.getSigners();
  console.log(
    "Deploying the contracts with the account:",
    await deployer.getAddress()
  );

  console.log("Account balance:", (await deployer.getBalance()).toString());

  const SweepStakesNFTs = await ethers.getContractFactory("SweepStakesNFTs");
  const sweepStakesNFTs = await SweepStakesNFTs.deploy();
  await sweepStakesNFTs.deployed();

  console.log("SweepStakesNFTs address:", sweepStakesNFTs.address);
  console.log("sweepstakes name:", await sweepStakesNFTs.name());
  console.log("sweepstakes symbol:", await sweepStakesNFTs.symbol());

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(sweepStakesNFTs, "SweepStakesNFTs");

  //get the StakingHelper contract
  const stakingHelperAddress = await sweepStakesNFTs.stakingHelper();
  const stakingHelper = await ethers.getContractAt("StakingHelper", stakingHelperAddress);
  console.log("StakingHelper address:", stakingHelper.address);

  saveFrontendFiles(stakingHelper, "StakingHelper");
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
