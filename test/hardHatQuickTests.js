//These tests are run in hardhat to quickly check everything, the actual staking, unstaking, and draws will need to be tested on a real testnet

const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  StakingAPI,
  IValidatorFull,
  NETWORK_TYPE,
} = require("harmony-staking-sdk");

// const testStakerOneAddress = "";
const validatorAddress = "one198pwc4uq879kjhczvyl9lgt5nst9c5zhwhfrvz";
const val0xAddress = "0x29c2eC57803f8b695f02613E5FA1749c165c5057";
stakingApi = new StakingAPI({ apiUrl: "https://api.stake.hmny.io" });
let jsonData = {};
const fs = require("fs");

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
    // if (!jsonData.sweepstakes) {
    //redeploy every time on hardhat
    if (true) {
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

describe("sweepstakesNFTs constructor", function () {
  it("should set the owner", async function () {
    expect(await sweepstakes.owner()).to.equal(owner.address);
  });
  it("stakingHelper not zero address", async function () {
    expect(await sweepstakes.stakingHelper()).to.not.equal(
      ethers.constants.AddressZero
    );
  });
  it("vars set correctly", async function () {
    expect(await sweepstakes.tokenCounter()).to.equal(0);
    expect(await sweepstakes.drawPeriod()).to.equal(7 * 24 * 60 * 60);
    expect(await sweepstakes.lastDrawTime()).to.equal(jsonData.lastDraw);
    expect(await sweepstakes.prizeFee()).to.equal(500);
    expect(await sweepstakes.checkpointSize()).to.equal(2);
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
  //check constructor vars
  it("vars set correctly", async function () {
    expect(await stakingHelper.owner()).to.equal(owner.address);
    expect(await stakingHelper.sweepstakes()).to.equal(sweepstakes.address);
  });
});

//let's start with the basic functions that set the variables
describe("variable setters", function () {
  it("set drawPeriod", async function () {
    await sweepstakes.setDrawPeriod(2 * 24 * 60 * 60);
    expect(await sweepstakes.drawPeriod()).to.equal(2 * 24 * 60 * 60);
  });
  it("set prizeFee", async function () {
    await sweepstakes.setPrizeFee(1000);
    expect(await sweepstakes.prizeFee()).to.equal(1000);
  });
  it("setUndelegationPeriod", async function () {
    await sweepstakes.setUndelegationPeriod(2 * 24 * 60 * 60);
    expect(await sweepstakes.undelegationPeriod()).to.equal(2 * 24 * 60 * 60);
  });
  it("set minStake", async function () {
    await sweepstakes.setMinStake(1000);
    expect(await sweepstakes.minStake()).to.equal(1000);
  });
  //all fail if not owner
  it("non owner fails", async function () {
    await expect(
      sweepstakes.connect(acc1).setDrawPeriod(2 * 24 * 60 * 60)
    ).to.be.revertedWith("Only owner");
    await expect(
      sweepstakes.connect(acc1).setPrizeFee(1000)
    ).to.be.revertedWith("Only owner");
    await expect(
      sweepstakes.connect(acc1).setUndelegationPeriod(2 * 24 * 60 * 60)
    ).to.be.revertedWith("Only owner");
    await expect(
      sweepstakes.connect(acc1).setMinStake(1000)
    ).to.be.revertedWith("Only owner");
  });

  it("reset all back to desired state", async function () {
    await sweepstakes.setDrawPeriod(7 * 24 * 60 * 60);
    await sweepstakes.setPrizeFee(500);
    await sweepstakes.setUndelegationPeriod(7 * 24 * 60 * 60);
    await sweepstakes.setMinStake(100);
  });
});

describe("add validators array", function () {
  it("add validators array", async function () {
    stakingHelper.setValidators([val0xAddress]);
    expect(await stakingHelper.validators(0)).to.equal(val0xAddress);
  });
  it("non owner fails", async function () {
    await expect(
      stakingHelper.connect(acc1).setValidators([val0xAddress])
    ).to.be.revertedWith("Only owner");
  });
});

describe("enter", function () {
  it("onwer enters with 200 ONE", async function () {
    await stakingHelper.enter(ethers.utils.parseEther("200"), {
      value: ethers.utils.parseEther("200"),
    });
    expect(await ethers.provider.getBalance(stakingHelper.address)).to.equal(
      ethers.utils.parseEther("200")
    );
  });
  it("acc1 enters with 100 ONE", async function () {
    await stakingHelper
      .connect(acc1)
      .enter(ethers.utils.parseEther("100"), {
        value: ethers.utils.parseEther("100"),
      });
    expect(await ethers.provider.getBalance(stakingHelper.address)).to.equal(
      ethers.utils.parseEther("300")
    );
  });
  it("acc2 enters with 500 ONE", async function () {
    await stakingHelper
      .connect(acc2)
      .enter(ethers.utils.parseEther("500"), {
        value: ethers.utils.parseEther("500"),
      });
    expect(await ethers.provider.getBalance(stakingHelper.address)).to.equal(
      ethers.utils.parseEther("800")
    );
  });
});

describe("check amounts in sweepstakes", function () {
  it("check totalStaked", async function () {
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("800")
    );
  });
  it("3 tokens issued", async function () {
    expect(await sweepstakes.tokenCounter()).to.equal(3);
  });
  it("check checkpoints", async function () {
    expect(await sweepstakes.checkpoints(0)).to.equal(
      ethers.utils.parseEther("300")
    );
    expect(await sweepstakes.checkpoints(1)).to.equal(
      ethers.utils.parseEther("500")
    );
  });
  it("check NFT balances", async function () {
    expect(await sweepstakes.balanceOf(owner.address)).to.equal(1);
    expect(await sweepstakes.balanceOf(acc1.address)).to.equal(1);
    expect(await sweepstakes.balanceOf(acc2.address)).to.equal(1);
  });
  it("check NFT owners", async function () {
    expect(await sweepstakes.tokenOfOwnerByIndex(owner.address, 0)).to.equal(0);
    expect(await sweepstakes.ownerOf(0)).to.equal(owner.address);
    expect(await sweepstakes.ownerOf(1)).to.equal(acc1.address);
    expect(await sweepstakes.ownerOf(2)).to.equal(acc2.address);
  });
  it("check token info", async function () {
    const token0 = await sweepstakes.tokenIdToInfo(0);
    expect(token0.staked).to.equal(ethers.utils.parseEther("200"));
  });
});

describe("address at index", function () {
  it("get address at index 100 is owner", async function () {
    expect(
      await sweepstakes.addressAtIndex(ethers.utils.parseEther("100"))
    ).to.equal(owner.address);
  });
  it("get address at index 299.999999999999999999 is acc1", async function () {
    expect(
      await sweepstakes.addressAtIndex(
        ethers.utils.parseEther("299.999999999999999999")
      )
    ).to.equal(acc1.address);
  });
  it("get address at index 300 is acc2", async function () {
    expect(
      await sweepstakes.addressAtIndex(ethers.utils.parseEther("300"))
    ).to.equal(acc2.address);
  });
  it("get address at index 635.123456 is acc2", async function () {
    expect(
      await sweepstakes.addressAtIndex(ethers.utils.parseEther("635.123546"))
    ).to.equal(acc2.address);
  });
  it("address at index 800 fails", async function () {
    await expect(
      sweepstakes.addressAtIndex(ethers.utils.parseEther("800"))
    ).to.be.revertedWith("Index out of range");
  });
});

describe("acc 2 unstakes and withdraws", function () {
  let epoch = 0;
  it("acc2 unstake 100 (400 remains)", async function () {
    await stakingHelper.connect(acc2).unstake(ethers.utils.parseEther("100"));
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("700")
    );
    expect(await sweepstakes.checkpoints(1)).to.equal(
      ethers.utils.parseEther("400")
    );
    epoch = await stakingHelper.epoch();
  });
  it("check nft details", async function () {
    const token2 = await sweepstakes.tokenIdToInfo(2);
    expect(token2.staked).to.equal(ethers.utils.parseEther("400"));
    expect(token2.unstaked).to.equal(ethers.utils.parseEther("100"));
    expect(token2.withdrawEpoch).to.equal(epoch + 7 * 24 * 60 * 60);
  });

  //REQUIREMENT FOR EPOCH TO ADVANCE REMOVED FOR TESTING
  // it("withdraw fails", async function () {
  //   await expect(sweepstakes.connect(acc2).withdraw()).to.be.revertedWith("Must wait until undelegation complete");
  // });
  //ADVANCE EPOCH

  it("acc2 withdraws", async function () {
    await sweepstakes.connect(acc2).withdraw();
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
    await stakingHelper
      .connect(acc3)
      .enter(ethers.utils.parseEther("200"), {
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
    await ethers.provider.send("evm_increaseTime", [7*24*60*60]);
    await ethers.provider.send("evm_mine");
  });

  it("do a draw", async function () {
    await sweepstakes.drawWinner();
    await sweepstakes.assignPrize();
    //see who won
    // get new token balances
    const token0 = await sweepstakes.tokenIdToInfo(0);
    const token1 = await sweepstakes.tokenIdToInfo(1);
    const token2 = await sweepstakes.tokenIdToInfo(2);

    //see prizes
    token0.prizes > 0 ? console.log("token 0 won: ", token0.prizes) : token1.prizes > 0 ? console.log("token 1 won: ", token1.prizes) : token2.prizes > 0 ? console.log("token 2 won: ", token2.prizes) : console.log("no winner");
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
    await expect(hackDraw.hackDraw(0)).to.be.revertedWith("can't execute with draw");
  });
});

// owner withdraws fees
describe("owner withdraws fees", function () {
//try tansfering NFTs - how to deal with owning multiple?

//check onlyStaking functions and onlySweepstakes functions can't be called by others

// check I can't game the prize draw system

// Can upload the validator list - only owner

// Users can stake
// users get NFT with correct balance
// totalstaked updated correctly
// delegated among validators correctly - check validators received
// do 3 users so later can check indexes

// Users can unstake
// partial unstake updates correctly
// totalstaked updated correctly
// Undelegated among validators correctly - check validators balances reduced
// Zeros an NFT and resets owner if withdrawn

// Reallocates zeroed NFTs
// Every 100th token is a checkpoint
// Owner gets 5% fee on prizes
// Owner can rebalance
// Pays out winner if called by lottery
// Returns address from index so external lotteries can call it
// Can't call lottery if not enough time has passed

describe("save contract address and balances to a file", function () {
  //commented out for hardhat tests
  // it("save contract address and balances to a file", async function () {
  //   const jd = JSON.stringify(jsonData);
  //   fs.writeFileSync("./ssData.json", jd, "utf-8");
  // });
});

function saveData(key, value) {
  jsonData[key] = value;
}

async function getAmountDelegatedBy(contractAddress) {
  let staked = 0;
  try {
    const validator = await stakingApi.fetchValidatorByAddress(
      NETWORK_TYPE.TESTNET,
      validatorAddress
    );
    const index = validator.delegations.findIndex(
      (delegator) =>
        delegator["delegator-address"] ===
        "one1tvf9tgnauj6krqml3tc4ap2zl8zvklp9p9hzej"
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
