// npx hardhat test test/ERCDrawsTestnet.js --network testnet

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
      [ethers.utils.parseEther("100"), ethers.utils.parseEther("100"), ethers.utils.parseEther("100")],
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
    await expectFail(draw.connect(acc1).setWeeklyPrizePool(100));
    await draw.setWeeklyPrizePool(BigInt(68e18));
    expect(await draw.weeklyPrizePool()).to.equal(BigInt(68e18));

    await expectFail(draw.connect(acc1).setDrawPeriod(10));
    await draw.setDrawPeriod(1);
    expect(await draw.drawPeriod()).to.equal(1);
    await expectFail(
      draw.connect(acc1).setPrizeToken(sweepstakes.address)
    )
    await expectFail(
      draw.connect(acc1).setSweepstakesNFTs(sweepstakes.address)
    )
  });
  it("can transfer ownership", async function () {
    await draw.setOwner(acc1.address);
    expect(await draw.owner()).to.equal(acc1.address);
    await expectFail(draw.connect(owner).setOwner(owner.address))
    await draw.connect(acc1).setOwner(owner.address);
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
    await expectFail(
      draw.connect(acc1).withdrawPrizeToken(1000)
    )
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
      const percent = prizeSchedule[i];
      const prizeScheduleIndex = await draw.prizeScheduleIndex();
      console.log("prizeScheduleIndex: ", prizeScheduleIndex);
      const currentPrize = await draw.prizeSchedule(prizeScheduleIndex);
      console.log("currentPrize: ", currentPrize.toString());
      expect(await draw.prizeSent()).to.equal(true);
      //run with higher gas limit
      const txdraw = await draw.drawWinner({ gasLimit: 10000000 });
      const receiptdraw = await txdraw.wait();
      const eventdraw = receiptdraw.events.find(event => event.event === "WinnerDrawn");
      // expect the event to be emitted
      expect(eventdraw).to.not.equal(undefined);
      console.log("yes");
      expect(await draw.prizeSent()).to.equal(false);
      // send prize and get the event
      const tx = await draw.sendPrize();
      const receipt = await tx.wait();
      const event = receipt.events.find(event => event.event === "PrizeSent");

      const winner = event.args.winner;
      const prize = event.args.prize;

      console.log(
        "Winner: ",
        winner,
        "Prize: ",
        prize.toString(),
      );
      expect(prize).to.equal(BigInt((68e18 * percent) / 100));
      //wait 5s
      await new Promise((r) => setTimeout(r, 5000));
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
    await expectFail(draw.drawWinner())
  });
});

async function expectFail(functionToCall){
  try {
    await functionToCall();
    throw null;
  } catch (err) {
    return "task failed successfully";
  }
}