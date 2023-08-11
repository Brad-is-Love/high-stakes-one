/**
 * {"sweepstakes":"0x6945d5f317f088f7e1504F79D1d1FF4b33893DF4","lastDraw":1691709191,"stakingHelper":"0x0A46B5Ee21f9a5C25f2896E4fe93B76fB6f2FaF3","extraFunds":null}
 */


//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  StakingAPI,
  IValidatorFull,
  NETWORK_TYPE,
} = require("harmony-staking-sdk");

const stakingHelperOneAddress = "one1pfrttm3plxjuyhegjmj0ayahd7m097hnshxn4n";
const validatorAddress = "one198pwc4uq879kjhczvyl9lgt5nst9c5zhwhfrvz";
const val0xAddress = "0x29c2eC57803f8b695f02613E5FA1749c165c5057";
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

describe("deploy contracts", function () {
  it("deploy SweepStakesNFTs", async function () {
    sweepstakes = await ethers.getContractAt(
      "SweepStakesNFTs",
      "0x6945d5f317f088f7e1504F79D1d1FF4b33893DF4"
    );
    console.log("SweepStakesNFTs already at:", sweepstakes.address);
  });
  it("get StakingHelper: ", async function () {
    stakingHelperAddress = await sweepstakes.stakingHelper();
    console.log("stakingHelperAddress: ", stakingHelperAddress);
    stakingHelper = await ethers.getContractAt(
      "StakingHelper",
      stakingHelperAddress
    );
  });
});

describe("withdraw all at epoch 1855 or later", function () {
    it("get balance of owner, acc1 and acc2", async function () {
        ownerBalance = await sweepstakes.balanceOf(owner.address);
        acc1Balance = await sweepstakes.balanceOf(acc1.address);
        acc2Balance = await sweepstakes.balanceOf(acc2.address);
        console.log("ownerBalance: ", ownerBalance.toString());
        console.log("acc1Balance: ", acc1Balance.toString());
        console.log("acc2Balance: ", acc2Balance.toString());
    });
    it("all withdraw", async function () {
        await sweepstakes.withdraw();
        await sweepstakes.connect(acc1).withdraw();
        await sweepstakes.connect(acc2).withdraw();
    });
    it("get balance of owner, acc1 and acc2", async function () {
        ownerBalance = await sweepstakes.balanceOf(owner.address);
        acc1Balance = await sweepstakes.balanceOf(acc1.address);
        acc2Balance = await sweepstakes.balanceOf(acc2.address);
        console.log("ownerBalance: ", ownerBalance.toString());
        console.log("acc1Balance: ", acc1Balance.toString());
        console.log("acc2Balance: ", acc2Balance.toString());
    });
});

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
