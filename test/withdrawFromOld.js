
const { expect } = require("chai");
const { ethers } = require("hardhat");

// mainnent
let jsonData = {
  stakingHelper: "0xc63A79E774Bea523d90Bd6b5432a8B24D98af036",
  acc2UnstakedAtEpoch: 2259,
};

before(async function () {
  [owner, acc1] = await ethers.getSigners();
});

// constructor(address _stakingHelper) {
  // deploy WithDrawAll.sol
describe("deploy withdrawAll", function () {
  it("should deploy withdrawAll", async function () {
    const WithdrawAll = await ethers.getContractFactory("WithdrawAll");
    withdrawAll = await WithdrawAll.deploy(jsonData.stakingHelper);
    await withdrawAll.deployed();
    console.log("withdrawAll deployed to:", withdrawAll.address);
  });
});

// get SH contract
describe("get SH contract", function () {
  it("get StakingHelper: ", async function () {
    stakingHelper = await ethers.getContractAt(
      "StakingHelper",
      jsonData.stakingHelper
    );
  });
});

// function setSweepstakes(address _sweepstakes) external onlyOwner {
// Set Sweepstakes in stakinghelper to withdrawAll contract
describe("set sweepstakes", function () {
  it("set sweepstakes", async function () {
    await stakingHelper.setSweepstakes(withdrawAll.address);
    expect(await stakingHelper.sweepstakes()).to.equal(withdrawAll.address);
  });
});

// function unstake(uint256 _amount, uint256 _tokenId) external ->
// Call unstake on SH with tokenId=0 and _amount = SH balance, this will call unstake on WA, which collect rewards on SH then it unstakes everything
describe("unstake", function () {
  it("unstake", async function () {
    const staked = ethers.utils.parseEther("1958.9173");
    await stakingHelper.unstake(
      staked,
      0
    );
  });
});

// call withdraw on withdrawAll - will run once now and once once unstaked
// function withdraw(uint256 _tokenId) onlyOwner external {
describe("withdraw", function () {
  it("withdraw", async function () {
    await withdrawAll.withdraw(0);
  });
});

// npx hardhat test test/withdrawFromOld.js --network mainnet
