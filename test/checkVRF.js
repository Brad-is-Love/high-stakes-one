//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");

const ssAbi = require("../frontend/src/contracts/SweepStakesNFTs.json").abi;
const shAbi = require("../frontend/src/contracts/StakingHelper.json").abi;
// mainnent
// let jsonData = {"sweepstakes":"0x3eCd6879485B1383bA9F45177f12276325DCdeA9","lastDraw":1695598669,"stakingHelper":"0xc63A79E774Bea523d90Bd6b5432a8B24D98af036","acc2UnstakedAtEpoch":2084}
// testnet
let jsonData = {"sweepstakes":"0xf266cEAd75739dc9f2A1F79d467DeAEC3976F2AF","lastDraw":1695598669,"stakingHelper":"0x4Dd8518F40d949D6D2EEcC859364Ff836DC456fb","acc2UnstakedAtEpoch":2084}

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
  });
  it("get StakingHelper: ", async function () {
    stakingHelper = await ethers.getContractAt(
      "StakingHelper",
      jsonData.stakingHelper
    );
  });
});

// describe("draw period to 20 sec", function () {
//   it("set draw period to 20 sec", async function () {
//     await sweepstakes.setDrawPeriod(20);
//     expect(await sweepstakes.drawPeriod()).to.equal(20);
//   });
// });

describe("run many draws to see if we get a relatively even spread", function () {
  for(let i=0;i<50;i++) {
    it("draws", async function () {
      await new Promise(r => setTimeout(r, 40000));
      await sweepstakes.drawWinner();
      await stakingHelper.juicePrizePool({
        value: ethers.utils.parseEther("1"),
      });
    });
  }
});


// npx hardhat test test/checkVRF.js --network testnet