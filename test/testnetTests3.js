//we need to wait until tests2 epoch has finished before running this
//finishes the move and then unstakes acc2 for next tests
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  StakingAPI,
  NETWORK_TYPE,
} = require("harmony-staking-sdk");
const { toBech32 } = require('@harmony-js/crypto');

const validatorAddress = "one198pwc4uq879kjhczvyl9lgt5nst9c5zhwhfrvz";
const val0xAddress = "0x29c2eC57803f8b695f02613E5FA1749c165c5057";
const val2one = "one1yp8mw25h0lmm4smjcpdxjj8dw9aydtxg4ywxnr"
const val20x = "0x204fb72a977FF7BAC372C05A6948Ed717a46ACc8"
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
    stakingHelperOneAddress = toBech32(stakingHelperAddress);
  });
});

describe("move to current validators", function () {
  it("Set validators", async function () {
    await stakingHelper.setValidators([val0xAddress, val20x]);
    expect(await stakingHelper.validators(0)).to.equal(val0xAddress);
    expect(await stakingHelper.validators(1)).to.equal(val20x);
  });
  it("move to current validators", async function () {
    const moving = await stakingHelper.moving();
    await stakingHelper.rebalanceEnd();
    const val1 = await stakingHelper.delegatedToValidator(val0xAddress)
    const val2 = await stakingHelper.delegatedToValidator(val20x)

    console.log("val1+val2", val1.add(val2).toString());
    expect(val1.add(val2)).to.equal(moving);
    expect(await stakingHelper.moving()).to.equal(0);
  });
});

describe("acc 2 unstakes", function () {
  it("get acc2 balances", async function () {
    const acc2Token = await sweepstakes.tokenOfOwnerByIndex(acc2.address, 0);
    const token2 = await sweepstakes.tokenIdToInfo(acc2Token);
    token2Staked = token2.staked;
    token2Unstaked = token2.unstaked;
    token2Total = token2Staked.add(token2Unstaked);
  });

  it("unstake too much fails", async function () {
    expect(await expectFail(() => stakingHelper.unstake(ethers.utils.parseEther("1400"),2))).to.equal("failed");
  });
  it("unstake all and check nft balances", async function () {
    await stakingHelper.connect(acc2).unstake(token2Staked.toString(),2);
    expect(await sweepstakes.pages(1)).to.equal(
      ethers.utils.parseEther("0")
    );
    const epoch = (await stakingHelper.epoch()).toNumber();
    const token2 = await sweepstakes.tokenIdToInfo(2);
    expect(token2.staked).to.equal(0);
    expect(token2.unstaked).to.equal(token2Total.toString());
    expect(token2.withdrawEpoch).to.equal(epoch + 7);
  });
  it("withdraw fails", async function () {
    expect(await expectFail(() => sweepstakes.connect(acc2).withdraw())).to.equal("failed");
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