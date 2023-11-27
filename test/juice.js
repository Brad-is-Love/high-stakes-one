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

describe("draw time to 30s", function () {
  it("set draw period to 30s", async function () {
    await sweepstakes.setDrawPeriod(30);
    expect(await sweepstakes.drawPeriod()).to.equal(30);
  });
});

describe("juice the Prize Pool", function () {
  it("stakingHelper accepts 15463 ONE", async function () {
    expect(await stakingHelper.extraFunds()).to.equal(
      ethers.utils.parseEther("0")
    );
    await stakingHelper.juicePrizePool({
      value: ethers.utils.parseEther("15463"),
    });
    expect(await stakingHelper.extraFunds()).to.equal(
      ethers.utils.parseEther("15463")
    );
  });
});

describe("run draw", function () {
  it("draws", async function () {
    await sweepstakes.drawWinner();
    //wait 5s
    await new Promise((r) => setTimeout(r, 5000));
  });
  it("assigns", async function () {
    const tx = await sweepstakes.assignPrize();
    const receipt = await tx.wait();

    //log gas used
    console.log("gas used", receipt.gasUsed.toString());

    for (const event of receipt.events) {
      if (event.event === "WinnerAssigned") {
        console.log("WinnerDrawn", event.args);
        const winnerAddress = await sweepstakes.ownerOf(event.args._winner);
        console.log("winnerAddress", winnerAddress);
      }
    }
  });
});

describe("owner collects fees", function () {
  it("owner collects fees", async function () {
    await sweepstakes.withdrawFees();
    expect(await sweepstakes.feesToCollect()).to.equal(
      ethers.utils.parseEther("0")
    );
  });
});

describe("draw time to 6d+23h+30m", function () {
  it("set draw period to 6d+23h+30m", async function () {
    await sweepstakes.setDrawPeriod(6*24*60*60+23*60*60+30*60);
    expect(await sweepstakes.drawPeriod()).to.equal(603000);
  });
});

describe("set minstake to 20 ONE", function () {
  it("set minstake to 20 ONE", async function () {
    await sweepstakes.setMinStake(20);
    expect(await sweepstakes.minStake()).to.equal(20);
  });
});


// npx hardhat test test/juice.js --network mainnet
