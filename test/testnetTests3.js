//Testnet 3: 3 days later, do a draw, wihtdrawing, transfers etc.
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

//need to wait 3 days to do a draw and some withdrawing


describe("acc 2 withdraws", function () {
  it("acc2 withdraws", async function () {
    // get acc2 bal
    const balanceBefore = await ethers.provider.getBalance(acc2.address);
    await sweepstakes.connect(acc2).withdraw();
    const balanceAfter = await ethers.provider.getBalance(acc2.address);
    console.log("acc2 withdrawn: ", balanceAfter.sub(balanceBefore).toString());
    expect(await ethers.provider.getBalance(stakingHelper.address)).to.equal(
      ethers.utils.parseEther("700")
    );
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("700")
    );
    expect(await sweepstakes.checkpoints(1)).to.equal(
      ethers.utils.parseEther("400")
    );
    const token2 = await sweepstakes.tokenIdToInfo(2);
    expect(token2.staked).to.equal(ethers.utils.parseEther("400"));
    expect(token2.unstaked).to.equal(0);
    expect(token2.withdrawEpoch).to.equal(0);
  });

  it("unstake 401 fails", async function () {
    await expect(
      stakingHelper.connect(acc2).unstake(ethers.utils.parseEther("401"))
    ).to.be.revertedWith("Can't unstake more than you've staked");
  });
  it("unstake 400 and check nft balances", async function () {
    await stakingHelper.connect(acc2).unstake(ethers.utils.parseEther("400"));
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("300")
    );
    expect(await sweepstakes.checkpoints(1)).to.equal(
      ethers.utils.parseEther("0")
    );
    const token2 = await sweepstakes.tokenIdToInfo(2);
    expect(token2.staked).to.equal(0);
    expect(token2.unstaked).to.equal(ethers.utils.parseEther("400"));
    expect(token2.withdrawEpoch).to.equal(epoch + 7 * 24 * 60 * 60);
  });
  it("acc2 withdraws the rest", async function () {
    await sweepstakes.connect(acc2).withdraw();
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
    await expect(
      sweepstakes.tokenOfOwnerByIndex(acc2.address, 0)
    ).to.be.revertedWith("ERC721Enumerable: owner index out of bounds");
    expect(await sweepstakes.availableTokenIds(0)).to.equal(2);
  });
});
// acc3 stakes 200 and gets acc2s NFT
describe("acc3 stakes 200 and gets token 2", function () {
  it("acc3 stakes 200", async function () {
    await stakingHelper.connect(acc3).enter(ethers.utils.parseEther("200"), {
      value: ethers.utils.parseEther("200"),
    });
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("500")
    );
    expect(await sweepstakes.checkpoints(1)).to.equal(
      ethers.utils.parseEther("200")
    );
  });
  it("acc3 gets token 2", async function () {
    expect(await sweepstakes.balanceOf(acc3.address)).to.equal(1);
    expect(await sweepstakes.tokenOfOwnerByIndex(acc3.address, 0)).to.equal(2);
    expect(await sweepstakes.ownerOf(2)).to.equal(acc3.address);
  });
  it("check nft details", async function () {
    const token2 = await sweepstakes.tokenIdToInfo(2);
    expect(token2.staked).to.equal(ethers.utils.parseEther("200"));
    expect(token2.unstaked).to.equal(0);
    expect(token2.withdrawEpoch).to.equal(0);
  });
  it("check address at index", async function () {
    expect(
      await sweepstakes.addressAtIndex(ethers.utils.parseEther("300"))
    ).to.equal(acc3.address);
  });
});

// Do a draw
describe("do a draw", function () {
  //advance time to draw period
  it("advance time to draw period", async function () {
    await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
  });

  it("do a draw", async function () {
    //send 1 eth to staking helper just for hardhat tests
    await stakingHelper.acceptMoney({ value: ethers.utils.parseEther("1") });
    await sweepstakes.drawWinner();
    await sweepstakes.assignPrize();
    //see who won
    // get new token balances
    const token0 = await sweepstakes.tokenIdToInfo(0);
    const token1 = await sweepstakes.tokenIdToInfo(1);
    const token2 = await sweepstakes.tokenIdToInfo(2);

    //see prizes
    const winner =
      token0.prizes > 0
        ? owner
        : token1.prizes > 0
        ? acc1
        : token2.prizes > 0
        ? acc3
        : null;

    // winner withdraws prizes
    const balanceBefore = await ethers.provider.getBalance(winner.address);
    await sweepstakes.connect(winner).withdraw();
    const balanceAfter = await ethers.provider.getBalance(winner.address);
    console.log(
      "winner withdrew: ",
      balanceAfter.sub(balanceBefore).toString()
    );
  });

  it("draw fails if not enough time has passed", async function () {
    await expect(sweepstakes.drawWinner()).to.be.revertedWith("Too soon");
  });
});

describe("malicious draw call", function () {
  it("deploy HackDraw.sol", async function () {
    const HackDraw = await ethers.getContractFactory("HackDraw");
    hackDraw = await HackDraw.deploy(sweepstakes.address);
    await hackDraw.deployed();
  });
  it("advance time to draw period", async function () {
    await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine");
  });
  it("hackDraw reverts", async function () {
    await expect(hackDraw.hackDraw(0)).to.be.revertedWith(
      "can't execute with draw"
    );
  });
});

// owner withdraws fees
describe("owner withdraws fees", function () {
  it("non owner reverts", async function () {
    await expect(sweepstakes.connect(acc1).withdrawFees()).to.be.revertedWith(
      "Only owner"
    );
  });
  it("log amounts", async function () {
    console.log(
      "stakingHelper balance: ",
      ethers.utils.formatEther(
        await ethers.provider.getBalance(stakingHelper.address)
      )
    );
  });
  it("owner withdraws fees", async function () {
    const balanceBefore = await ethers.provider.getBalance(owner.address);
    await sweepstakes.withdrawFees();
    const balanceAfter = await ethers.provider.getBalance(owner.address);
    expect(balanceAfter).to.be.gt(balanceBefore);
    console.log("withdrawn fees: ", balanceAfter.sub(balanceBefore).toString());
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

//check onlyStaking functions and onlySweepstakes functions can't be called by others

// Can upload the validator list - only owner
// delegated among validators correctly - check validators received correct amount
// Undelegated among validators correctly - check validators balances reduced

// Owner can rebalance

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