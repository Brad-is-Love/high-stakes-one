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

const stakingHelperOneAddress = "one1jy4jej8t9u89px5tm9uty2kt46qcct2eg9773e";
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
  it("deploy SweepStakesOld", async function () {
    sweepstakes = await ethers.getContractAt(
      "SweepStakesOld", "0x5cc8fa285caD5584a876B1c265BbA179d6020ee6"
    );
    console.log("SweepStakesOld already at:", sweepstakes.address);
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

describe("withdraw", function () {
  it("get token balances", async function () {
    const token0 = await stakingHelper.tokenIdToInfo(0);
    const token1 = await stakingHelper.tokenIdToInfo(1);
    const token2 = await stakingHelper.tokenIdToInfo(2);
    token0Unstaked = token0.unstaked;
    token0Prizes = token0.prizes;
    token1Unstaked = token1.unstaked;
    token2Unstaked = token2.unstaked;
  });
  it("get balances before", async function () {
    balance0 = await ethers.provider.getBalance(owner.address);
    balance1 = await ethers.provider.getBalance(acc1.address);
    balance2 = await ethers.provider.getBalance(acc2.address);
  });
  it("withdraw", async function () {
    await stakingHelper.connect(owner).withdraw();
    await stakingHelper.connect(acc1).withdraw();
    await stakingHelper.connect(acc2).withdraw();
  });
  it("get balances after", async function () {
    balance0After = await ethers.provider.getBalance(owner.address);
    balance1After = await ethers.provider.getBalance(acc1.address);
    balance2After = await ethers.provider.getBalance(acc2.address);
  });
  it("compare", async function () {
    console.log("owner expected: ", balance0.add(token0Unstaked).add(token0Prizes).toString(), " actual: ", balance0After.toString());
    console.log("acc1 expected: ", balance1.add(token1Unstaked).toString(), " actual: ", balance1After.toString());
    console.log("acc2 expected: ", balance2.add(token2Unstaked).toString(), " actual: ", balance2After.toString());
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
