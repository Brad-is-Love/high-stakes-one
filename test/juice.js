//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");

const ssAbi = require("../frontend/src/contracts/SweepStakesNFTs.json").abi;
const shAbi = require("../frontend/src/contracts/StakingHelper.json").abi;

let jsonData = {"sweepstakes":"0x3eCd6879485B1383bA9F45177f12276325DCdeA9","lastDraw":1695598669,"stakingHelper":"0xc63A79E774Bea523d90Bd6b5432a8B24D98af036","acc2UnstakedAtEpoch":2084}

before(async function () {
  //load the data from the file

  [owner, acc1, acc2, acc3] = await ethers.getSigners();
});

describe("deploy contracts", function () {
  it("deploy SweepStakesNFTs", async function () {
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

// describe("draw period to 24 hours", function () {
//   it("set draw period to 24", async function () {
//     await sweepstakes.setDrawPeriod(24*60*60);
//     expect(await sweepstakes.drawPeriod()).to.equal(24*60*60);
//   });
// });

describe("juice the Prize Pool", function () {
  it("stakingHelper accepts 206 ONE", async function () {
    expect(await stakingHelper.extraFunds()).to.equal(
      ethers.utils.parseEther("0")
    );
    await stakingHelper.juicePrizePool({
      value: ethers.utils.parseEther("206"),
    });
    expect(await stakingHelper.extraFunds()).to.equal(
      ethers.utils.parseEther("206")
    );
  });
});


// npx hardhat test test/juice.js --network mainnet