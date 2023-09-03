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

describe("add a non-validator to Validators", function () {
  it("add validators array", async function () {
    await stakingHelper.setValidators([val0xAddress, owner.address]);
    expect(await stakingHelper.isValidator(owner.address)).to.equal(true);
    expect(await stakingHelper.validators(1)).to.equal(owner.address);
  });
  it("stake now fails", async function () {
    expect(
      await expectFail(() =>
        stakingHelper.stake(ethers.utils.parseEther("200"), {
          value: ethers.utils.parseEther("200"), gasLimit: 1000000
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
        stakingHelper.unstake(ethers.utils.parseEther("801"))
      )
    ).to.equal("failed");
  });
});

// describe("check draw and compound", function () {
//   it("draw winner", async function () {
//     await sweepstakes.drawWinner();
//   });
//   it("check lastDrawTime", async function () {
//     expect(await sweepstakes.lastDrawTime()).to.not.equal(jsonData.lastDraw);
//     const block = await ethers.provider.getBlock("latest");
//     saveData("lastDraw", block.timestamp);
//   });
//   it("assignPrize", async function () {
//     const ownerToken = (await sweepstakes.tokenIdToInfo(0)).staked;
//     const acc1Token = (await sweepstakes.tokenIdToInfo(1)).staked;
//     const acc2Token = (await sweepstakes.tokenIdToInfo(2)).staked;
//     await sweepstakes.assignPrize();
//     //check who won
//     const winner = await sweepstakes.lastWinner();
//     console.log("winner", winner);
//     const prize = await sweepstakes.lastPrize();
//     expect(prize).to.equal(ethers.utils.parseEther("9.5"));
//     expect(await sweepstakes.feesToCollect()).to.equal(ethers.utils.parseEther("0.5"));
//     //check autoCompound
//     expect(await sweepstakes.totalStaked()).to.equal(
//       ethers.utils.parseEther("709.5")
//     );
//     const winningToken = await sweepstakes.tokenOfOwnerByIndex(winner, 0);
//     const winningTokenStaked = (await sweepstakes.tokenIdToInfo(winningToken)).staked;
//     expectedStaked = winner === owner.address ? ownerToken : winner === acc1.address ? acc1Token : winner === acc2.address ? acc2Token : "error";
//     expect(winningTokenStaked).to.equal(expectedStaked);
//   });
// });

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