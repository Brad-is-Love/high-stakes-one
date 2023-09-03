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
    if (!jsonData.sweepstakes) {
      const SweepStakesNFTs = await ethers.getContractFactory(
        "SweepStakesNFTs"
      );
      sweepstakes = await SweepStakesNFTs.deploy();
      await sweepstakes.deployed();
      console.log("SweepStakesNFTs deployed to:", sweepstakes.address);
      //log contract size and gas used
      const contractSize = await ethers.provider.getCode(sweepstakes.address);
      console.log("Contract size: ", contractSize.length);
      const tx = await sweepstakes.deployTransaction.wait();
      console.log("Gas used to deploy contract: ", tx.gasUsed.toString());
      saveData("sweepstakes", sweepstakes.address);
      //get block timestamp
      const block = await ethers.provider.getBlock(tx.blockNumber);
      saveData("lastDraw", block.timestamp);
    } else {
      sweepstakes = await ethers.getContractAt(
        "SweepStakesNFTs",
        jsonData.sweepstakes
      );
      console.log("SweepStakesNFTs already at:", sweepstakes.address);
    }
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

describe("is prize assigned", function () {
  it("is prize assigned", async function () {
    expect(await sweepstakes.prizeAssigned()).to.equal(true);
  });
});

describe("check draw and compound", function () {
  it("assignPrize", async function () {
    const ownerToken = (await sweepstakes.tokenIdToInfo(0)).staked;
    const acc1Token = (await sweepstakes.tokenIdToInfo(1)).staked;
    const acc2Token = (await sweepstakes.tokenIdToInfo(2)).staked;
    console.log("ownerToken", ownerToken.toString());
    await sweepstakes.assignPrize({gasLimit: 1000000});
    //check who won
    const winner = await sweepstakes.lastWinner();
    console.log("winner", winner);
    const prize = await sweepstakes.lastPrize();
    expect(prize).to.equal(ethers.utils.parseEther("9.5"));
    expect(await sweepstakes.feesToCollect()).to.equal(ethers.utils.parseEther("0.5"));
    //check autoCompound
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("709.5")
    );
    const winningToken = await sweepstakes.tokenOfOwnerByIndex(winner, 0);
    const winningTokenStaked = (await sweepstakes.tokenIdToInfo(winningToken)).staked;
    expectedStaked = winner === owner.address ? ownerToken : winner === acc1.address ? acc1Token : winner === acc2.address ? acc2Token : "error";
    expect(winningTokenStaked).to.equal(expectedStaked);
  });
});

/*describe("unstake", function () {
  let epoch = 0;
  it("acc2 unstake 100 (200 remains)", async function () {
    await stakingHelper.connect(acc2).unstake(ethers.utils.parseEther("100"));
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("600")
    );
    expect(await sweepstakes.checkpoints(1)).to.equal(
      ethers.utils.parseEther("200")
    );
    epoch = parseInt(await stakingHelper.epoch());
    console.log("acc 2 unstake 100 at epoch", epoch);
  });
  it("check nft details", async function () {
    const token2 = await sweepstakes.tokenIdToInfo(2);
    expect(token2.staked).to.equal(ethers.utils.parseEther("200"));
    expect(token2.unstaked).to.equal(ethers.utils.parseEther("100"));
    expect(token2.withdrawEpoch).to.equal(epoch + 7);
    saveData("acc2UnstakedAtEpoch", epoch);
  });
  it("withdraw fails", async function () {
    expect(await expectFail(() => sweepstakes.connect(acc2).withdraw())).to.equal("failed");
  });
  it("unstake too much fails", async function () {
    expect(await expectFail(() => stakingHelper.connect(acc2).unstake(ethers.utils.parseEther("500")))).to.equal("failed");
  });
});*/

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
      (delegator) =>
        delegator["delegator-address"] ===
        contractAddress
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

async function expectFail(functionToCall){
  try {
    await functionToCall();
    return "succeeded";
  } catch (err) {
    return "failed";
  }
}