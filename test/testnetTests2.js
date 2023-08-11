//Testnet 2: Some other tests but don't need to be delayed
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

describe("get contracts", function () {
  it("get SweepStakesNFTs", async function () {
    sweepstakes = await ethers.getContractAt(
      "SweepStakesNFTs",
      jsonData.sweepstakes
    );
  });

  it("get StakingHelper: ", async function () {
    stakingHelperAddress = await sweepstakes.stakingHelper();
    stakingHelper = await ethers.getContractAt(
      "StakingHelper",
      stakingHelperAddress
    );
  });
});

describe("set bad Validators", function () {
  it("add validators array", async function () {
    await stakingHelper.setValidators([owner.address, acc1.address]);
    expect(await stakingHelper.isValidator(owner.address)).to.equal(true);
    expect(await stakingHelper.validators(0)).to.equal(owner.address);
  });
  it("stake now fails", async function () {
    expect(
      await expectFail(() =>
        stakingHelper.stake(ethers.utils.parseEther("100"), {
          value: ethers.utils.parseEther("100"),
        })
      )
    ).to.equal("failed");
  });
  it("unstake now fails", async function () {
    expect(
      await expectFail(() =>
        stakingHelper.unstake(ethers.utils.parseEther("100"))
      )
    ).to.equal("failed");
  });
  it("reset Validators", async function () {
    await stakingHelper.setValidators([val0xAddress]);
    expect(await stakingHelper.isValidator(owner.address)).to.equal(false);
    expect(await stakingHelper.isValidator(val0xAddress)).to.equal(true);
  });
});

describe("unstake too much", function () {
  it("unstake 401 fails", async function () {
    expect(
      await expectFail(() =>
        stakingHelper.unstake(ethers.utils.parseEther("401"))
      )
    ).to.equal("failed");
  });
});

// Draw fails if not enough time has passed
describe("do a draw", function () {
  it("draw fails if not enough time has passed", async function () {
    expect(await expectFail(() => sweepstakes.drawWinner())).to.equal("failed");
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

async function expectFail(functionToCall){
  try {
    await functionToCall();
    return "succeeded";
  } catch (err) {
    return "failed";
  }
}