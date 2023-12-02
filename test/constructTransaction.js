//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");

let jsonData = {
  sweepstakes: "0x058DCD4FcB02d0cD2df9E8Be992bfB89998A6Bbd",
  lastDraw: 1698460661,
  stakingHelper: "0x6eB221b1654BA536784029ce2fd34BA813Cf3261",
  acc2UnstakedAtEpoch: 2259,
};

before(async function () {
  //load the data from the file
  [owner, acc1, acc2, acc3] = await ethers.getSigners();
});

describe("get contracts", function () {
  it("get SweepStakesNFTs", async function () {
    sweepstakes = await ethers.getContractAt(
      "SweepStakesNFTs",
      jsonData.sweepstakes
    );
    console.log("SweepStakesNFTs already at:", sweepstakes.address);
  });
});

describe("deploy staking helper", function () {
  it("get StakingHelper: ", async function () {
    stakingHelper = await ethers.getContractAt(
      "StakingHelper",
      jsonData.stakingHelper
    );
  });
});

describe("construct transaction data to set minstake to 20ONE", function () {
    it("construct transaction data", async function () {
        const data = sweepstakes.interface.encodeFunctionData("setMinStake", [ethers.utils.parseEther("20")]);
        console.log(data);
    });
});





// npx hardhat test test/constructTransaction.js --network mainnet
