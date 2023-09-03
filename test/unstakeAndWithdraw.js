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
//BOTH UNSTAKED ON SUNDAY
/*jsonData = {
  sweepstakes: "0x2b71213C928676DC040823f32fe7AEa4e9aAA7bc",
  lastDraw: 1693710308,
  stakingHelper: "0x4d01d4181eFE8C81Ec3849f2bDc8a166914392B5",
  extraFunds: null,
  acc2UnstakedAtEpoch: 1969,
};*/
jsonData = {"sweepstakes":"0x4A4B3B838C9361458bB241123FcF20c8Fb9548b7","lastDraw":1693712459,"stakingHelper":"0xC3C67514F55652bc0dbe378b949DBa660192e0f9","extraFunds":null,"acc2UnstakedAtEpoch":1969};

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
    if (!jsonData.stakingHelper) {
      saveData("stakingHelper", stakingHelperAddress);
    }
  });
});

describe("unstake all", function () {
  it("unstake owner", async function () {
    await stakingHelper.unstake(ethers.utils.parseEther("100"));
  });
  it("unstake acc1", async function () {
    await stakingHelper.connect(acc1).unstake(ethers.utils.parseEther("300"));
  });
  it("unstake acc2", async function () {
    await stakingHelper.connect(acc2).unstake(ethers.utils.parseEther("200"));
  });
});

describe("save contract address and balances to a file", function () {
  it("save contract address and balances to a file", async function () {
    const jd = JSON.stringify(jsonData);
    fs.writeFileSync("./ssData.json", jd, "utf-8");
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
