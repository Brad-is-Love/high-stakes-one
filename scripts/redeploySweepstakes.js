const { expect } = require("chai");
const { ethers } = require("hardhat");

const fs = require("fs");
const path = require("path");

const ssAbi = require("../frontend/src/contracts/SweepStakesNFTs.json").abi;
const shAbi = require("../frontend/src/contracts/StakingHelper.json").abi;

//Mainnet current contracts
const oldSweepstakesAddress = require("../frontend/src/contracts/SweepStakesNFTs-address.json").address;
const stakingHelperAddress = require("../frontend/src/contracts/StakingHelper-address.json").address;

const harmonyMultisig = "0x73484BFf016a25CDEB0d9B892aA6cfF2Ee0f2ce7"

before(async function () {
  [owner] = await ethers.getSigners();
});

// get current contracts

describe("deploy contracts", function () {
  it("get SweepStakesNFTs", async function () {
    oldSweepstakes = await ethers.getContractAt(
      "SweepStakesNFTs",
      oldSweepstakesAddress
    );
  });
  it("get StakingHelper", async function () {
    stakingHelper = await ethers.getContractAt(
      "StakingHelper",
      stakingHelperAddress
    );
  });
});

describe("get all token values", function () {
  it("get totalsupply", async function () {
    totalSupply = await oldSweepstakes.tokenCounter();
    console.log("totalSupply",totalSupply.toString());
  });
  it("get all holders and holdings", async function () {
    holders = []
    staked = []
    unstaked = []
    withdrawEpochs = []
    totalStaked = ethers.BigNumber.from(0);
    for (let i = 0; i < totalSupply; i++) {
      holders.push(await oldSweepstakes.ownerOf(i));
      const token = await oldSweepstakes.tokenIdToInfo(i);
      staked.push(token.staked.toString());
      unstaked.push(token.unstaked.toString());
      withdrawEpochs.push(token.withdrawEpoch.toString());
      totalStaked = totalStaked.add(token.staked);
    }
    // replace the HSOne contract with mine 0xDfAF08706eF28337c7D81F320982f4B2D9615EA0
    const index = holders.findIndex(holder => holder === "0xDfAF08706eF28337c7D81F320982f4B2D9615EA0");
    holders[index] = "0x7188CC2282c105DfcE5249e6a909DB71b914B25b";
    console.log("holders",holders);
    console.log("staked",staked);
    console.log("unstaked",unstaked);
    console.log("withdrawEpochs",withdrawEpochs);
    console.log("added totalStaked",totalStaked.toString());
    console.log("actual totalStaked", await oldSweepstakes.totalStaked());
    // check totalStake matches oldSweepstakes.totalStake() otherwise end process
    if(totalStaked.toString() !== (await oldSweepstakes.totalStaked()).toString()){
      console.log("added up totalStaked does not match oldSweepstakes.totalStaked()");
      process.exit();
    }
  });
});

describe("deploy new sweepstakesNFTs contract", function () {
  it("deploy SweepStakesNFTs", async function () {
    const SweepStakesNFTs = await ethers.getContractFactory("SweepStakesNFTs");
    // constructor(address[] memory _holders, uint256[] memory _staked, uint256[] memory _unstaked, uint256[] memory _withdrawEpochs)
    newSweepstakes = await SweepStakesNFTs.deploy(holders, staked, unstaked, withdrawEpochs);
    await newSweepstakes.deployed();
    console.log("sweepstakes deployed to:", newSweepstakes.address);
  });
});

describe("check new sweepstakesNFTs contract", function () {
  // check totalSupply, totalStaked, holders, staked, unstaked, withdrawEpochs all match
  it("check totalsupply and totalStaked", async function () {
    expect(await newSweepstakes.tokenCounter()).to.equal(totalSupply);
    expect(await newSweepstakes.totalStaked()).to.equal(totalStaked);
  });
  it("check tokens", async function () {
    allMatched = false;
    for(let i=0;i<totalSupply;i++) {
      expect(await newSweepstakes.ownerOf(i)).to.equal(holders[i]);
      expect((await newSweepstakes.getNFTValue(i)).toString()).to.equal(staked[i]);
      const token = await newSweepstakes.tokenIdToInfo(i);
      expect(token.staked.toString()).to.equal(staked[i]);
      expect(token.unstaked.toString()).to.equal(unstaked[i]);
      expect(token.withdrawEpoch.toString()).to.equal(withdrawEpochs[i]);
    }
    allMatched = true;
  });
  it("exit if not all matched", async function () {
    if(!allMatched) {
      console.log("not all matched");
      process.exit();
    }
  });
});

describe("set stakinghelper in sweepstakes", function () {
  it("set stakinghelper", async function () {
    await newSweepstakes.setStakingHelper(stakingHelperAddress);
    expect(await newSweepstakes.stakingHelper()).to.equal(stakingHelperAddress);
  });
});

describe("set prize schedule", function () {
  it("set prize schedule", async function () {
    // set prize schedule
    const prizeSchedule = [15,15,20,25,100,15,15];
    await newSweepstakes.setPrizeSchedule(prizeSchedule);
    expect(await newSweepstakes.prizeSchedule(0)).to.equal(15);
    expect(await newSweepstakes.prizeSchedule(4)).to.equal(100);
  });
});

describe("transfer ownership to the multisig", function () {
  it("transfer ownership to the multisig", async function () {
    await newSweepstakes.setOwner(harmonyMultisig);
    expect(await newSweepstakes.owner()).to.equal(harmonyMultisig);
  });
});

describe("save to frontend", function () {
  it("save to frontend", async function () {
    saveFrontendFiles(newSweepstakes, "SweepStakesNFTs");
  });
});


function saveFrontendFiles(contract, name) {
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


// run with npx hardhat test scripts/redeploySweepstakes.js --network mainnet