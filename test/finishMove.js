//Testnet 2: need to wait until the tests1 epoch has finished then can run this.
//A lot of it is just checked in the console, to be updated
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { StakingAPI, NETWORK_TYPE } = require("harmony-staking-sdk");

const validatorAddress = "one198pwc4uq879kjhczvyl9lgt5nst9c5zhwhfrvz";
const val0xAddress = "0x29c2eC57803f8b695f02613E5FA1749c165c5057";
const val2one = "one1yp8mw25h0lmm4smjcpdxjj8dw9aydtxg4ywxnr";
const val20x = "0x204fb72a977FF7BAC372C05A6948Ed717a46ACc8";
stakingApi = new StakingAPI({ apiUrl: "https://api.stake.hmny.io" });
let jsonData = {};
const fs = require("fs");
const exp = require("constants");

before(async function () {
  //load the data from the file
  try {
    data = fs.readFileSync("./ssData.json");
    jsonData = JSON.parse(data);
  } catch (err) {
    console.log("no file yet");
  }

  [owner, acc1, acc2, acc3] = await ethers.getSigners();
});

describe("get contracts", function () {
  it("get SweepStakesNFTs", async function () {
    sweepstakes = await ethers.getContractAt(
      "SweepStakesNFTs",
      jsonData.sweepstakes
    );
    console.log("SweepStakesNFTs already at:", sweepstakes.address);
  });

  it("get StakingHelper: ", async function () {
    stakingHelperAddress = await sweepstakes.stakingHelper();
    stakingHelper = await ethers.getContractAt(
      "StakingHelper",
      stakingHelperAddress
    );
  });
});

describe("get validators, moving", function () {
  it("get validators", async function () {
    const validator0 = await stakingHelper.validators(0);
    console.log(validator0);
    const validator1 = await stakingHelper.validators(1);
    console.log(validator1);
  });
  it("get moving", async function () {
    const moving = await stakingHelper.moving();
    console.log(moving.toString());
  });
});


// describe("finish move", function () {
//   it("Set validators", async function () {
//     await stakingHelper.setValidators([val0xAddress, val20x]);
//     expect(await stakingHelper.validators(0)).to.equal(val0xAddress);
//     expect(await stakingHelper.validators(1)).to.equal(val20x);
//   });
//   it("move to current validators", async function () {
//     const moving = await stakingHelper.moving();
//     await stakingHelper.rebalanceEnd();
//     const val1 = await stakingHelper.delegatedToValidator(val0xAddress)
//     const val2 = await stakingHelper.delegatedToValidator(val20x)

//     console.log("val1:", val1.toString(), "val2:", val2.toString());
//     expect(await stakingHelper.moving()).to.equal(0);
//   });
// });

function saveData(key, value) {
  jsonData[key] = value;
}

async function getValidator() {
  try {
    const validator = await stakingApi.fetchValidatorByAddress(
      NETWORK_TYPE.TESTNET,
      validatorAddress
    );
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
      (delegator) => delegator["delegator-address"] === validatorAddress
    );
    staked = validator.delegations[index].amount.toString();
  } catch (err) {
    console.error(
      `Error fetching validator information for address ${validatorAddress}:`,
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
