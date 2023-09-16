//Testnet 4. after 7 epochs acc2 can withdraw
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

//need to wait ~2 days to do some withdrawing
describe("acc2 withdraws", function () {
  it("acc2 withdraws", async function () {
    try {
      await sweepstakes.connect(acc2).withdraw();
    } catch (err) {
      console.log("withdraw failed");
      process.exit(1);
    }
    const token2 = await sweepstakes.tokenIdToInfo(2);
    expect(token2.staked).to.equal(0);
    expect(token2.unstaked).to.equal(0);
    expect(token2.withdrawEpoch).to.equal(0);
    //sleep 20s
    await new Promise((r) => setTimeout(r, 20000));
  });
  it("acc2 token is burned", async function () {
    // expect token to be burned
    expect (await expectFail(() => sweepstakes.tokenIdToInfo(2))).to.equal("failed");
    expect(await sweepstakes.balanceOf(acc2.address)).to.equal(0);
  });
});
// acc3 stakes 100 and gets acc2s NFT
describe("acc3 stakes 100 and gets token 2", function () {
  it("get totalStaked", async function () {
    ts = await sweepstakes.totalStaked()
  });
  it("acc3 stakes 100", async function () {
    await stakingHelper.connect(acc3).enter(ethers.utils.parseEther("100"), {
      value: ethers.utils.parseEther("100"),
    });
    expect(await sweepstakes.checkpoints(1)).to.equal(
      ethers.utils.parseEther("100")
    );
  });
  it("acc3 gets token 2", async function () {
    expect(await sweepstakes.balanceOf(acc3.address)).to.equal(1);
    expect(await sweepstakes.tokenOfOwnerByIndex(acc3.address, 0)).to.equal(2);
    expect(await sweepstakes.ownerOf(2)).to.equal(acc3.address);
  });
  it("check nft details", async function () {
    const token2 = await sweepstakes.tokenIdToInfo(2);
    expect(token2.staked).to.equal(ethers.utils.parseEther("100"));
    expect(token2.unstaked).to.equal(0);
    expect(token2.withdrawEpoch).to.equal(0);
  });
  it("check address at index", async function () {
    expect(
      await sweepstakes.addressAtIndex(ts.toString())
    ).to.equal(acc3.address);
    //subtract 1 from ts to see if last index is acc3
    ts = await sweepstakes.totalStaked()
    expect(
      await sweepstakes.addressAtIndex(ts.sub(1).toString())
    ).to.equal(acc3.address);
  });
});

// Hack the draw
describe("malicious draw call", function () {
  it("deploy HackDraw.sol", async function () {
    const HackDraw = await ethers.getContractFactory("HackDraw");
    hackDraw = await HackDraw.deploy(sweepstakes.address);
    await hackDraw.deployed();
  });
  it("hackDraw reverts", async function () {
    expext(await expectFail(() => hackDraw.hackDraw())).to.equal("failed");
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