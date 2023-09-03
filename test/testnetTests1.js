//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  StakingAPI,
  IValidatorFull,
  NETWORK_TYPE,
} = require("harmony-staking-sdk");
const { toBech32 } = require('@harmony-js/crypto');

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
    expect(await sweepstakes.drawPeriod()).to.equal(4 * 60 * 60);
    expect(await sweepstakes.lastDrawTime()).to.equal(jsonData.lastDraw);
    expect(await sweepstakes.prizeFee()).to.equal(500);
    expect(await sweepstakes.beneficiary()).to.equal(owner.address);
    //make page size 2 for testing
    expect(await sweepstakes.pageSize()).to.equal(2);
    expect(await sweepstakes.undelegationPeriod()).to.equal(7);
    expect(await sweepstakes.minStake()).to.equal(ethers.utils.parseEther("100"));
  });
});

describe("deploy staking helper", function () {
  it("get StakingHelper: ", async function () {
    stakingHelperAddress = await sweepstakes.stakingHelper();
    stakingHelperOneAddress = toBech32(stakingHelperAddress);
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
    //non-owner fails
    expect(await expectFail(() => sweepstakes.connect(acc1).setDrawPeriod(2 * 24 * 60 * 60))).to.equal("failed")
  });
  it("set prizeFee", async function () {
    await sweepstakes.setPrizeFee(1000);
    expect(await sweepstakes.prizeFee()).to.equal(1000);
     //non-owner fails
    expect(await expectFail(() => sweepstakes.connect(acc1).setPrizeFee(1000))).to.equal("failed")
  });
  it("setUndelegationPeriod", async function () {
    await sweepstakes.setUndelegationPeriod(2);
    expect(await sweepstakes.undelegationPeriod()).to.equal(2);
    //non-owner fails
    expect(await expectFail(() => sweepstakes.connect(acc1).setUndelegationPeriod(4))).to.equal("failed")
  });
  it("set minStake", async function () {
    await sweepstakes.setMinStake(1000);
    expect(await sweepstakes.minStake()).to.equal(1000);
    //non-owner fails
    expect(await expectFail(() => sweepstakes.connect(acc1).setMinStake(1000))).to.equal("failed")
  });
  it("set beneficiary", async function () {
    await sweepstakes.setBeneficiary(acc1.address);
    expect(await sweepstakes.beneficiary()).to.equal(acc1.address);
    //non-owner fails
    expect(await expectFail(() => sweepstakes.connect(acc1).setBeneficiary(acc1.address))).to.equal("failed")
  });

  it("reset back to desired state 1", async function () {
    //3 days for testing
    await sweepstakes.setDrawPeriod(4 * 60); //setting to 4 mins for testing
    await sweepstakes.setPrizeFee(500);
  });
  it("reset back to desired state 2", async function () {
    await sweepstakes.setUndelegationPeriod(7);
    await sweepstakes.setMinStake(100);
  });
  it("reset back to desired state 3", async function () {
    await sweepstakes.setBeneficiary(owner.address);
  });
});

describe("setValidators", function () {
  it("add validators array", async function () {
    await stakingHelper.setValidators([val0xAddress]);
    console.log("vals set")
    expect(await stakingHelper.isValidator(val0xAddress)).to.equal(true);
    console.log("isvalidator = true")
    expect(await stakingHelper.validators(0)).to.equal(val0xAddress);
    console.log("validators(0) = val0xAddress")
  });
  it("non owner fails", async function () {
    expect(await expectFail(() => stakingHelper.connect(acc1).setValidators([val0xAddress]))).to.equal("failed")
  });
});

describe("onlyStaking, onlySweepstakes", function () {
  it("enter reverts", async function () {
    expect(await expectFail(() => sweepstakes.enter(owner.address, ethers.utils.parseEther("100")))).to.equal("failed")
  });
  it("collect reverts", async function () {
    expect(await expectFail(() => stakingHelper.collect())).to.equal("failed")
  });
});

describe("juice the Prize Pool", function () {
  it("stakingHelper accepts 10 ONE", async function () {
    await stakingHelper.juicePrizePool({value: ethers.utils.parseEther("10")});
    expect(await ethers.provider.getBalance(stakingHelper.address)).to.equal(ethers.utils.parseEther("10"));
    expect(await stakingHelper.extraFunds()).to.equal(ethers.utils.parseEther("10"));
    jsonData["extraFunds"] += 10;
  });
});

describe("enter", function () {
  it("wrong amount fails", async function () {
    expect(await expectFail(() => stakingHelper.enter(ethers.utils.parseEther("100"), {value: ethers.utils.parseEther("99")}))).to.equal("failed")
  });
  it("too small fails", async function () {
    expect(await expectFail(() => stakingHelper.enter(ethers.utils.parseEther("99"), {value: ethers.utils.parseEther("99")}))).to.equal("failed")
  });
  it("onwer enters with 100 ONE", async function () {
    await stakingHelper.enter(ethers.utils.parseEther("100"), {
      value: ethers.utils.parseEther("100"),
    });
    expect(await stakingHelper.delegatedToValidator(val0xAddress)).to.equal(
      ethers.utils.parseEther("100")
    );
    expect(await ethers.provider.getBalance(stakingHelper.address)).to.equal(
      ethers.utils.parseEther("10")
    );
  });
  it("acc1 enters with 200 ONE", async function () {
    await stakingHelper.connect(acc1).enter(ethers.utils.parseEther("200"), {
      value: ethers.utils.parseEther("200"),
    });
    //expect balance to still be 10 cos rest is staked
    expect(await ethers.provider.getBalance(stakingHelper.address)).to.equal(
      ethers.utils.parseEther("10")
    );
  });
  it("acc2 enters with 300 ONE", async function () {
    await stakingHelper.connect(acc2).enter(ethers.utils.parseEther("300"), {
      value: ethers.utils.parseEther("300"),
    });
    expect(await ethers.provider.getBalance(stakingHelper.address)).to.equal(
      ethers.utils.parseEther("10")
    );
  });
});

describe("check amounts in sweepstakes", function () {
  it("check totalStaked", async function () {
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("600")
    );
  });
  it("3 tokens issued", async function () {
    expect(await sweepstakes.tokenCounter()).to.equal(3);
  });
  it("check pages", async function () {
    expect(await sweepstakes.pages(0)).to.equal(
      ethers.utils.parseEther("300")
    );
    expect(await sweepstakes.pages(1)).to.equal(
      ethers.utils.parseEther("300")
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
    expect(token0.staked).to.equal(ethers.utils.parseEther("100"));
    expect(token0.unstaked).to.equal(0);
    expect(token0.withdrawEpoch).to.equal(0);
  });
  it("check NFT value", async function () {
    expect(await sweepstakes.getNFTValue(0)).to.equal(ethers.utils.parseEther("100"));
  });
});

describe("confirm validator received tokens", function () {
  it("check validator balance", async function () {
    expect(await stakingHelper.delegatedToValidator(val0xAddress)).to.equal(
      ethers.utils.parseEther("600")
    );
    expect(await getAmountDelegatedBy(stakingHelperOneAddress)).to.equal("600000000000000000000");
  });
});

describe("address at index", function () {
  it("get address at index 50 is owner", async function () {
    expect(
      await sweepstakes.addressAtIndex(ethers.utils.parseEther("50"))
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
  it("get address at index 535.123456 is acc2", async function () {
    expect(
      await sweepstakes.addressAtIndex(ethers.utils.parseEther("535.123546"))
    ).to.equal(acc2.address);
  });
  it("address at index 800 fails", async function () {
    expect(await expectFail(() => sweepstakes.addressAtIndex(ethers.utils.parseEther("800")))).to.equal("failed")
  });
});

describe("acc 1 stakes 100 more", function () {
  it("acc1 stakes 100 now has 200", async function () {
    await stakingHelper.connect(acc1).enter(ethers.utils.parseEther("100"), {
      value: ethers.utils.parseEther("100"),
    });
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("700")
    );
    expect(await sweepstakes.pages(0)).to.equal(
      ethers.utils.parseEther("400")
    );
    expect(await stakingHelper.delegatedToValidator(val0xAddress)).to.equal(ethers.utils.parseEther("700"));
    expect(await getAmountDelegatedBy(stakingHelperOneAddress)).to.equal("700000000000000000000");
  });
  it("check nft details", async function () {
    const token1 = await sweepstakes.tokenIdToInfo(1);
    expect(token1.staked).to.equal(ethers.utils.parseEther("300"));
    expect(token1.unstaked).to.equal(0);
    expect(token1.withdrawEpoch).to.equal(0);
    expect(await sweepstakes.getNFTValue(1)).to.equal(
      ethers.utils.parseEther("300")
    );
  });
});

describe("unstake", function () {
  let epoch = 0;
  it("acc2 unstake 100 (200 remains)", async function () {
    await stakingHelper.connect(acc2).unstake(ethers.utils.parseEther("100"));
    expect(await sweepstakes.totalStaked()).to.equal(
      ethers.utils.parseEther("600")
    );
    expect(await sweepstakes.pages(1)).to.equal(
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