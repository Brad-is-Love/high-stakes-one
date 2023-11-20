//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");

const ssAbi = require("../frontend/src/contracts/SweepStakesNFTs.json").abi;
const shAbi = require("../frontend/src/contracts/StakingHelper.json").abi;

//Mainnet
// let jsonData = {"sweepstakes":"0x3eCd6879485B1383bA9F45177f12276325DCdeA9","lastDraw":1695598669,"stakingHelper":"0xc63A79E774Bea523d90Bd6b5432a8B24D98af036","acc2UnstakedAtEpoch":2084}

//Testnet
let jsonData = {"sweepstakes":"0xf266cEAd75739dc9f2A1F79d467DeAEC3976F2AF","lastDraw":1695598669,"stakingHelper":"0x4Dd8518F40d949D6D2EEcC859364Ff836DC456fb","acc2UnstakedAtEpoch":2084}

before(async function () {
  //load the data from the file

  [owner, acc1, acc2, acc3] = await ethers.getSigners();
});

// DrawWinner
// WinnerAssigned
describe("get all WinnerAssigned events", function () {
  it("should get all WinnerAssigned events", async function () {
    console.log("owner", owner.address)
    const sweepstakes = new ethers.Contract(
      jsonData.sweepstakes,
      ssAbi,
      owner
    );
    const events = await sweepstakes.queryFilter(
      sweepstakes.filters.WinnerAssigned()
    );
    console.log(events);
  });
});


// npx hardhat test test/events.js --network mainnet