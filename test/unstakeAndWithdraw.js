//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  StakingAPI,
  IValidatorFull,
  NETWORK_TYPE,
} = require("harmony-staking-sdk");

const validatorAddress = "one198pwc4uq879kjhczvyl9lgt5nst9c5zhwhfrvz";
const val0xAddress = "0x29c2eC57803f8b695f02613E5FA1749c165c5057";
const val20x = "0x204fb72a977FF7BAC372C05A6948Ed717a46ACc8"
stakingApi = new StakingAPI({ apiUrl: "https://api.stake.hmny.io" });
let jsonData = {};
const fs = require("fs");
const exp = require("constants");

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
    stakingHelperAddress = await sweepstakes.stakingHelper();
    console.log("stakingHelperAddress: ", stakingHelperAddress);
    stakingHelper = await ethers.getContractAt(
      "StakingHelper",
      stakingHelperAddress
    );
  });
});

// describe("unstake all", function () {
//   it("get balances", async function () {
//     ownerBal = (await sweepstakes.tokenIdToInfo(0)).staked;
//     console.log("ownerBal", ownerBal.toString());
//     acc1Bal = (await sweepstakes.tokenIdToInfo(1)).staked;
//     console.log("acc1Bal", acc1Bal.toString());
//     acc2Bal = (await sweepstakes.tokenIdToInfo(2)).staked;
//     console.log("acc2Bal", acc2Bal.toString());
//     const pending = await stakingHelper.pendingDelegation();
//     console.log("pending", pending.toString());
//     const totalStaked = await sweepstakes.totalStaked();
//     console.log("totalStaked", totalStaked.toString());
//   });
//   it("unstake owner", async function () {
//     await stakingHelper.unstake(ownerBal.toString(),0);
//   });
//   it("unstake acc1", async function () {
//     await stakingHelper.connect(acc1).unstake(acc1Bal.toString(),1);
//   });
//   it("unstake acc2", async function () {
//     await stakingHelper.connect(acc2).unstake(acc2Bal.toString(),2);
//   });
// });

describe("withdraw all", function () {
  it("withdraw owner", async function () {
    await sweepstakes.withdraw(0);
  });
  it("withdraw acc1", async function () {
    await sweepstakes.connect(acc1).withdraw(1);
  });
  it("withdraw acc2", async function () {
    await sweepstakes.connect(acc2).withdraw(2);
  });
  it("withdtaw fees", async function () {
    await sweepstakes.withdrawFees()
  });
});

async function getValidator() {
  try {
    const validator = await stakingApi.fetchValidatorByAddress(
      NETWORK_TYPE.TESTNET,
      validatorAddress
    );
    // console.log("validator", validator);
    return validator;
  } catch (err) {
    console.error(
      `Error fetching validator information for address ${validatorAddress}:`,
      err
    );
    return null;
  }
}

async function getAmountDelegatedBy(contractAddress) {
  let staked = 0;
  try {
    const validator = await getValidator();
    const index = validator.delegations.findIndex(
      (delegator) => delegator["delegator-address"] === contractAddress
    );
    staked = validator.delegations[index].amount.toString();
  } catch (err) {
    console.error(
      `Error fetching validator information for address ${contractAddress}:`,
      err
    );
  }

  return staked;
}

async function expectFail(functionToCall) {
  try {
    await functionToCall();
    return "succeeded";
  } catch (err) {
    return "failed";
  }
}
