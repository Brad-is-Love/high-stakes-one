//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");

let jsonData = {
  sweepstakes: "0xc71D7C069Ae96794c5d6d54ff04754D2832601c3",
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

// describe("juice the Prize Pool", function () {
//   it("stakingHelper accepts 2000 ONE", async function () {
//     expect(await stakingHelper.extraFunds()).to.equal(
//       ethers.utils.parseEther("0")
//     );
//     await stakingHelper.juicePrizePool({
//       value: ethers.utils.parseEther("2000"),
//     });
//     expect(await stakingHelper.extraFunds()).to.equal(
//       ethers.utils.parseEther("2000")
//     );
//   });
// });

describe("owner collects fees", function () {
  it("owner collects fees", async function () {
    await sweepstakes.withdrawFees();
    expect(await sweepstakes.feesToCollect()).to.equal(
      ethers.utils.parseEther("0")
    );
  });
});

// deploy with npx hardhat test scripts/juice.js --network mainnet