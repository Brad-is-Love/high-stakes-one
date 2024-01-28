const { expect } = require("chai");
const { ethers } = require("hardhat");

const ssAbi = require("../frontend/src/contracts/SweepStakesNFTs.json").abi;
const shAbi = require("../frontend/src/contracts/StakingHelper.json").abi;

//Mainnet current contracts
const oldSweepstakesAddress = require("../frontend/src/contracts/SweepStakesNFTs-address.json").address;
const stakingHelperAddress = require("../frontend/src/contracts/StakingHelper-address.json").address;

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
      // process.exit();
    }
  });
});

describe("set stakinghelper in sweepstakes", function () {
  it("set stakinghelper", async function () {
    await newSweepstakes.setStakingHelper(stakingHelperAddress);
    expect(await newSweepstakes.stakingHelper()).to.equal(stakingHelperAddress);
  });
});


// run with npx hardhat test scripts/redeploySweepstakes.js --network mainnet