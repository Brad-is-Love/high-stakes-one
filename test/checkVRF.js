//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");

const ssAbi = require("../frontend/src/contracts/SweepStakesNFTs.json").abi;
const shAbi = require("../frontend/src/contracts/StakingHelper.json").abi;

// mainnent
// let jsonData = {"sweepstakes":"0x3eCd6879485B1383bA9F45177f12276325DCdeA9","lastDraw":1695598669,"stakingHelper":"0xc63A79E774Bea523d90Bd6b5432a8B24D98af036","acc2UnstakedAtEpoch":2084}
// testnet
let jsonData = {
  sweepstakes: "0x058DCD4FcB02d0cD2df9E8Be992bfB89998A6Bbd",
  lastDraw: 1698460661,
  stakingHelper: "0x6eB221b1654BA536784029ce2fd34BA813Cf3261",
  acc2UnstakedAtEpoch: 2259,
};

before(async function () {
  [owner, acc1, acc2, acc3] = await ethers.getSigners();
});

describe("get contracts", function () {
  it("get SweepStakesNFTs", async function () {
    sweepstakes = await ethers.getContractAt(
      "SweepStakesNFTs",
      jsonData.sweepstakes
    );
  });
  it("get StakingHelper: ", async function () {
    stakingHelper = await ethers.getContractAt(
      "StakingHelper",
      jsonData.stakingHelper
    );
  });
});

// describe("draw period to 20s", function () {
//   it("set draw period to 20s", async function () {
//     await sweepstakes.setDrawPeriod(20);
//     expect(await sweepstakes.drawPeriod()).to.equal(20);
//   });
// });

describe("run many draws to see if we get a relatively even spread", function () {
  let count = 0;
  winners = [];
  for (let i = 0; i < 10; i++) {
    it("draws", async function () {
      await sweepstakes.drawWinner();
    });
    it("assigns", async function () {
      await new Promise((r) => setTimeout(r, 90000));
      const tx = await sweepstakes.assignPrize();
      const receipt = await tx.wait();

      //log gas used
      console.log("gas used", receipt.gasUsed.toString());

      for (const event of receipt.events) {
        if (event.event === "WinnerAssigned") {
          console.log("WinnerDrawn", event.args);
          winners.push(event.args);
        }
      }
      count++;
      console.log("count", count);
    });
  }
});

describe("log winners", function () {
  it("log winners", async function () {
    console.log("winners", winners);
  });
});

// npx hardhat test test/checkVRF.js --network testnet
