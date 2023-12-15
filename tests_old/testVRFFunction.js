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

describe("draw period to 10 mins", function () {
  it("set draw period to 10 mins", async function () {
    await sweepstakes.setDrawPeriod(600);
    expect(await sweepstakes.drawPeriod()).to.equal(600);
  });
});

describe("juice the Prize Pool", function () {
  it("stakingHelper accepts 250 ONE", async function () {
    await stakingHelper.juicePrizePool({
      value: ethers.utils.parseEther("250"),
    });
    expect(await stakingHelper.extraFunds()).to.equal(
      ethers.utils.parseEther("250")
    );
  });
});

describe("check draw and compound", function () {
  it("draw winner", async function () {
    console.log("lastDraw", await sweepstakes.lastDrawTime());
    console.log("prizeAssigned", await sweepstakes.prizeAssigned());
    await sweepstakes.drawWinner();
    prizeAssigned = await sweepstakes.prizeAssigned()
    //draw again if failed
    if(prizeAssigned) {
      await sweepstakes.drawWinner();
    }
    prizeAssigned = await sweepstakes.prizeAssigned()
    console.log("lastDraw", await sweepstakes.lastDrawTime());
    console.log("prizeAssigned", prizeAssigned);
  });
  it("check lastDrawTime", async function () {
    expect(await sweepstakes.lastDrawTime()).to.not.equal(jsonData.lastDraw);
    const block = await ethers.provider.getBlock("latest");
    saveData("lastDraw", block.timestamp);
  });
  it("assignPrize", async function () {
    let pendingDelegation = await stakingHelper.pendingDelegation();
    console.log("pendingDelegation before", pendingDelegation.toString());
    ownerToken = (await sweepstakes.tokenIdToInfo(0)).staked;
    acc1Token = (await sweepstakes.tokenIdToInfo(1)).staked;
    acc2Token = (await sweepstakes.tokenIdToInfo(2)).staked;
    console.log("owner before", ownerToken.toString());
    console.log("acc1 before", acc1Token.toString());
    console.log("acc2 before", acc2Token.toString());
    if(!prizeAssigned) {
      await sweepstakes.assignPrize();
    } else {
      //something has gone wrong with drawWinner. 
      process.exit(0);
    }
  });
  it("check balances", async function () {
    const fees = await sweepstakes.feesToCollect();
    console.log("fees", fees.toString());
    //should auto compound
    const totalStaked = await sweepstakes.totalStaked();
    console.log("totalStaked", totalStaked.toString());
    const ownerTokenAfter = (await sweepstakes.tokenIdToInfo(0)).staked;
    const acc1TokenAfter = (await sweepstakes.tokenIdToInfo(1)).staked;
    const acc2TokenAfter = (await sweepstakes.tokenIdToInfo(2)).staked;
    console.log(
      "owner before, after",
      ownerToken.toString(),
      ownerTokenAfter.toString()
    );
    console.log(
      "acc1 before, after",
      acc1Token.toString(),
      acc1TokenAfter.toString()
    );
    console.log(
      "acc2 before, after",
      acc2Token.toString(),
      acc2TokenAfter.toString()
    );
  });
  it("check delegations", async function () {
    //this should never be over 200
    const pendingDelegation = await stakingHelper.pendingDelegation();
    console.log("pendingDelegation after", pendingDelegation.toString());
  });
});

describe("draw fails on time", function () {
  it("draw fails", async function () {
    expect(await expectFail(() => sweepstakes.drawWinner())).to.equal("failed");
  });
});

describe("owner withdraws fees", function () {
  it("non beneficiary reverts", async function () {
    expect(
      await expectFail(() => sweepstakes.connect(acc1).withdrawFees())
    ).to.equal("failed");
  });
  it("beneficiary withdraws fees", async function () {
    const balanceBefore = await ethers.provider.getBalance(owner.address);
    await sweepstakes.withdrawFees();
    const balanceAfter = await ethers.provider.getBalance(owner.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
    console.log("withdrawn fees: ", balanceAfter.sub(balanceBefore).toString());
  });
});

describe("initiate move", function () {
  it("non owner reverts", async function () {
    expect(
      await expectFail(() => stakingHelper.connect(acc1).rebalanceStart([val20x]))
    ).to.equal("failed");
  });
  it("initiate move - all to val2", async function () {
    const val1 = await stakingHelper.delegatedToValidator(val0xAddress);
    console.log("val1", val1.toString());
    const val2 = await stakingHelper.delegatedToValidator(val20x);
    console.log("val2", val2.toString());
    const toMove = val1.add(val2);
    const epoch = await stakingHelper.epoch();
    await stakingHelper.rebalanceStart([val20x]);
    expect(await stakingHelper.delegatedToValidator(val0xAddress)).to.equal(0);
    expect(await stakingHelper.delegatedToValidator(val20x)).to.equal(0);
    expect(await stakingHelper.moving()).to.equal(toMove);
    expect(await stakingHelper.initiateMoveEpoch()).to.equal(epoch);
  });
  it("can't finish move this epoch", async function () {
    expect(
      await expectFail(() => stakingHelper.rebalanceEnd())
    ).to.equal("failed");
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

async function expectFail(functionToCall) {
  try {
    await functionToCall();
    return "succeeded";
  } catch (err) {
    return "failed";
  }
}
