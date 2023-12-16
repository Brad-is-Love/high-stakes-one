// This is a script for deploying your contracts. You can adapt it to deploy
// deploy with npx hardhat run scripts/deploy.js --network mainnet

/* on mainnet here with wrong params:
SweepStakesNFTs address: 0x7491CC5da0336f6a88A8a4e82278Fabc84a02114
sweepstakes name: Sweepstakes NFTs
sweepstakes symbol: SSN
StakingHelper address: 0xbC9D60F13e96Da6F97956B4073EB9d6Fa5Ee175F
*/

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

  //set the validators for the StakingHelper contract
  const HoundBurningVal = "0xD763ade0083175237Db4311E2c4A3CC1122F28Cb"
  const reppeggingNode = "0x374489D7c10329975cfd06478fC42bfF97525d01"
  const peaceLoveHarmony = "0xdFEc4fba70443BB3E1a614Df4BF7F122e5344393"
  const fortuneValidator = "0x63e7E9BB58aA72739a7CEc06f6EA9Fe73eb7A598"

  await stakingHelper.setValidators([HoundBurningVal, reppeggingNode, peaceLoveHarmony, fortuneValidator]);

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
