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

const reppeggingNode = "0x374489D7c10329975cfd06478fC42bfF97525d01"
const peaceLoveHarmony = "0xdFEc4fba70443BB3E1a614Df4BF7F122e5344393"
const fortuneValidator = "0x63e7E9BB58aA72739a7CEc06f6EA9Fe73eb7A598"

// describe("start a rebalance", function () {
//   it("rebalance start", async function () {
//     await stakingHelper.rebalanceStart([reppeggingNode, peaceLoveHarmony, fortuneValidator]);
//   });
//   it("check moving amounts", async function () {
//     let moving = await stakingHelper.moving();
//     console.log("moving", moving);
//   });
// });

describe("finish rebalance", function () {
  it("rebalance end", async function () {
    await stakingHelper.rebalanceEnd();
  });
  it("check moving amounts", async function () {
    let moving = await stakingHelper.moving();
    console.log("moving", moving);
  });
});



// npx hardhat run scripts/rebalance.js --network mainnet
