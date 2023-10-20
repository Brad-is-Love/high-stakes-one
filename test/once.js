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
stakingApi = new StakingAPI({ apiUrl: "https://api.stake.hmny.io" });
let jsonData = {};
const fs = require("fs");
const exp = require("constants");

before(async function () {
  //load the data from the file

  [owner, acc1, acc2, acc3] = await ethers.getSigners();
});

// //Unstaked Tues afternoon
// jsonData =  {"sweepstakes":"0x632EaC5fF15cC8bb964618a091765bE42131E58f","lastDraw":1694320586,"stakingHelper":"0xC2f931cE2e81441d5A22F4Ed7a380c00efD57Aab","acc2UnstakedAtEpoch":2007}

//Unstaked Mon afternoon - ACC2 failed
// jsonData =  {"sweepstakes":"0xb3B0dbdA31deE7d6E824C15cD66dBbE091DFAd5C","lastDraw":1694386946,"stakingHelper":"0xe0E46CF562626530244f10f6D1991e4C1d33d6A7","acc2UnstakedAtEpoch":2011}

//Unstaked Tues Morn
jsonData =  {"sweepstakes":"0x3eCd6879485B1383bA9F45177f12276325DCdeA9","lastDraw":1694417728,"stakingHelper":"0xc63A79E774Bea523d90Bd6b5432a8B24D98af036","acc2UnstakedAtEpoch":2012}

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

describe("change vars", function () {
  it("set draw period to 47 hours", async function () {
    await sweepstakes.setDrawPeriod(47 * 60 * 60);
  });
  it("reduce fee to 1.2%", async function () {
    await sweepstakes.setPrizeFee(120);
    expect(await sweepstakes.prizeFee()).to.equal(120);
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
