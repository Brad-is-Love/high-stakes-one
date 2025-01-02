// npx hardhat test test/ERCDraws.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

before(async function () {
  [owner, acc1, acc2, acc3] = await ethers.getSigners();
});

// Local tests:
// Deploy Sweepstakes
// Mint a bunch of sweepstakes nfts
describe("deploy contracts", function () {
  it("deploy SweepStakesNFTs", async function () {
    const SweepStakesNFTs = await ethers.getContractFactory("SweepStakesNFTs");
    sweepstakes = await SweepStakesNFTs.deploy(
      [acc1.address, acc2.address, acc3.address],
      [100, 100, 100],
      [0, 0, 0],
      [0, 0, 0]
    );
    await sweepstakes.deployed();
    console.log("SweepStakesNFTs deployed to:", sweepstakes.address);
  });
});
// Create a local token to be GTC
describe("deploy ercToken", function () {
  it("deploy GTC", async function () {
    const GTC = await ethers.getContractFactory("GTC");
    gtc = await GTC.deploy();
    await gtc.deployed();
    console.log("GTC deployed to:", gtc.address);
  });
});
// Deploy ERCDraws
describe("deploy ERCDraw", function () {
  it("deploy ERCDraw", async function () {
    const ERCDraw = await ethers.getContractFactory("ERCDraw");
    draw = await ERCDraw.deploy(sweepstakes.address, gtc.address);
    await draw.deployed();
    console.log("ERCDraw deployed to:", draw.address);
  });
});
// Check constructor values
describe("check constructor values", function () {
  it("check constructor values", async function () {
    expect(await draw.owner()).to.equal(owner.address);
    expect(await draw.sweepstakesNFTsAddress()).to.equal(sweepstakes.address);
    expect(await draw.prizeTokenAddress()).to.equal(gtc.address);
    expect(await draw.prizeSchedule(0)).to.equal(3);
    expect(await draw.weeklyPrizePool()).to.equal(BigInt(68e18));
  });
});
// Check only owner functions
describe("check only owner functions", function () {
  it("check only owner functions", async function () {
    await expect(draw.connect(acc1).setWeeklyPrizePool(100)).to.be.revertedWith(
      "Only owner"
    );
    await draw.setWeeklyPrizePool(BigInt(68e18));
    expect(await draw.weeklyPrizePool()).to.equal(BigInt(68e18));

    await expect(draw.connect(acc1).setDrawPeriod(10)).to.be.revertedWith(
      "Only owner"
    );
    await draw.setDrawPeriod(1);
    expect(await draw.drawPeriod()).to.equal(1);
    await expect(
      draw.connect(acc1).setPrizeToken(sweepstakes.address)
    ).to.be.revertedWith("Only owner");
    await expect(
      draw.connect(acc1).setSweepstakesNFTs(sweepstakes.address)
    ).to.be.revertedWith("Only owner");
  });
});
// Transfer GTC to the ERCDraws contract
describe("transfer GTC to ERCDraws", function () {
  it("transfer GTC to ERCDraws", async function () {
    await gtc.transfer(draw.address, BigInt(1000e18));
    expect(await gtc.balanceOf(draw.address)).to.equal(BigInt(1000e18));
  });
});
// Check I can withdraw the GTC
describe("withdraw GTC", function () {
  it("withdraw GTC", async function () {
    //fails for non owner
    await expect(
      draw.connect(acc1).withdrawPrizeToken(1000)
    ).to.be.revertedWith("Only owner");
    await draw.withdrawPrizeToken(BigInt(100e18));
    expect(await gtc.balanceOf(draw.address)).to.equal(BigInt(900e18));
  });
});
// Run draw
describe("run draw", function () {
  it("drawWinner", async function () {
    const prizeSchedule = [3, 5, 8, 10, 14, 20, 40];
    let bal = BigInt(900e18);
    let winners = {};
    for (let i = 0; i < prizeSchedule.length; i++) {
      // wait 2s
      await new Promise((r) => setTimeout(r, 2000));
      const percent = prizeSchedule[i];
      const prizeScheduleIndex = await draw.prizeScheduleIndex();
      console.log("prizeScheduleIndex: ", prizeScheduleIndex);
      const currentPrize = await draw.prizeSchedule(prizeScheduleIndex);
      console.log("currentPrize: ", currentPrize.toString());
      expect(await draw.prizeSent()).to.equal(true);
      await draw.drawWinner();
      expect(await draw.prizeSent()).to.equal(false);
      // send prize
      await draw.sendPrize();
      const logs = await draw.queryFilter("PrizeSent");
      const winner = logs[i].args.winner;
      const prize = logs[i].args.prize;
      console.log(
        "Winner: ",
        winner,
        "Prize: ",
        prize.toString(),
      );
      expect(prize).to.equal(BigInt((68e18 * percent) / 100));
      expect(await draw.prizeSent()).to.equal(true);
      expect(await gtc.balanceOf(draw.address)).to.equal(bal - BigInt(prize));
      bal = bal - BigInt(prize);
      if (winners[winner] == undefined) {
        winners[winner] = BigInt(0);
      }
      console.log("winnerbal: ", winners[winner]);
      winners[winner] += BigInt(prize);
      expect(await gtc.balanceOf(winner)).to.equal(winners[winner]);
    }
  });
});
// reverts if too soon
describe("reverts if too soon", function () {
  it("drawWinner", async function () {
    await draw.setDrawPeriod(1000);
    await expect(draw.drawWinner()).to.be.revertedWith("Too soon");
  });
});