//Testnet 5: don't need to wait just wanted to separate this out
//This is the ERC721 logic tests and also dealing with owning multiple NFTs
//Contract was written as if most people will only own 1.

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

//try tansfering NFTs - how to deal with owning multiple?
describe("transfer NFTs", function () {
  it("acc1 transfers token 1 to acc3", async function () {
    await sweepstakes.connect(acc1).transferFrom(acc1.address, acc3.address, 1);
    expect(await sweepstakes.balanceOf(acc1.address)).to.equal(0);
    expect(await sweepstakes.balanceOf(acc3.address)).to.equal(2);
    expect(await sweepstakes.tokenOfOwnerByIndex(acc3.address, 0)).to.equal(2);
    expect(await sweepstakes.tokenOfOwnerByIndex(acc3.address, 1)).to.equal(1);
    expect(await sweepstakes.ownerOf(1)).to.equal(acc3.address);
    expect(await sweepstakes.ownerOf(2)).to.equal(acc3.address);
  });
  it("acc1 unstake fails", async function () {
    await expect(
      stakingHelper.connect(acc1).unstake(ethers.utils.parseEther("100"))
    ).to.be.revertedWith("ERC721Enumerable: owner index out of bounds");
  });
});

describe("holder of 2 NFTs unstakes and withdraws as expected", function () {
  //note,
  it("get acc3 nft details", async function () {
    const acc3FirstToken = await sweepstakes.tokenIdToInfo(2);
    const acc3SecondToken = await sweepstakes.tokenIdToInfo(1);
    expect(acc3FirstToken.staked).to.equal(ethers.utils.parseEther("200"));
    expect(acc3SecondToken.staked).to.equal(ethers.utils.parseEther("100"));
    expect(acc3FirstToken.unstaked).to.equal(0);
    expect(acc3SecondToken.unstaked).to.equal(0);
  });
  it("acc3 unstakes 200 (from token 2)", async function () {
    await stakingHelper.connect(acc3).unstake(ethers.utils.parseEther("200"));
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("300")
    );
    expect(await sweepstakes.checkpoints(1)).to.equal(
      ethers.utils.parseEther("0")
    );
    const token2 = await sweepstakes.tokenIdToInfo(2);
    expect(token2.staked).to.equal(ethers.utils.parseEther("0"));
    expect(token2.unstaked).to.equal(ethers.utils.parseEther("200"));
    expect(token2.withdrawEpoch).to.equal(7 * 24 * 60 * 60);
  });
  it("acc3 unstake fails", async function () {
    await expect(
      stakingHelper.connect(acc3).unstake(ethers.utils.parseEther("100"))
    ).to.be.revertedWith("Can't unstake more than you've staked");
  });
  it("acc3 withdraws", async function () {
    const balanceBefore = await ethers.provider.getBalance(acc3.address);
    await sweepstakes.connect(acc3).withdraw();
    const balanceAfter = await ethers.provider.getBalance(acc3.address);
    console.log("acc3 withdrawn: ", balanceAfter.sub(balanceBefore).toString());
    expect(await ethers.provider.getBalance(stakingHelper.address)).to.equal(
      ethers.utils.parseEther("300")
    );
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("300")
    );
    expect(await sweepstakes.checkpoints(1)).to.equal(
      ethers.utils.parseEther("0")
    );
    // expect token to be burned
    expect(await sweepstakes.tokenOfOwnerByIndex(acc3.address, 0)).to.equal(1); //because 2 was burned
    expect(await sweepstakes.availableTokenIds(0)).to.equal(2);
  });
  it("acc3 unstakes 100 (from token 1)", async function () {
    await stakingHelper.connect(acc3).unstake(ethers.utils.parseEther("100"));
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("200")
    );
    expect(await sweepstakes.checkpoints(0)).to.equal(
      ethers.utils.parseEther("200")
    );
    const token1 = await sweepstakes.tokenIdToInfo(1);
    expect(token1.staked).to.equal(ethers.utils.parseEther("0"));
    expect(token1.unstaked).to.equal(ethers.utils.parseEther("100"));
    expect(token1.withdrawEpoch).to.equal(7 * 24 * 60 * 60);
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