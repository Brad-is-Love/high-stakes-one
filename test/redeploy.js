//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");

const ssAbi = require("../frontend/src/contracts/SweepStakesNFTs.json").abi;
const shAbi = require("../frontend/src/contracts/StakingHelper.json").abi;

const HoundBurningVal = "0xD763ade0083175237Db4311E2c4A3CC1122F28Cb"
const reppeggingNode = "0x374489D7c10329975cfd06478fC42bfF97525d01"
const peaceLoveHarmony = "0xdFEc4fba70443BB3E1a614Df4BF7F122e5344393"
const fortuneValidator = "0x63e7E9BB58aA72739a7CEc06f6EA9Fe73eb7A598"

//Mainnet current
let jsonData = {"sweepstakes":"0x3eCd6879485B1383bA9F45177f12276325DCdeA9","lastDraw":1695598669,"stakingHelper":"0xc63A79E774Bea523d90Bd6b5432a8B24D98af036","acc2UnstakedAtEpoch":2084}

//NEW
// let jsonData = {"sweepstakes":"0x058DCD4FcB02d0cD2df9E8Be992bfB89998A6Bbd","lastDraw":1698460661,"stakingHelper":"0x6eB221b1654BA536784029ce2fd34BA813Cf3261","acc2UnstakedAtEpoch":2259}

before(async function () {
  //load the data from the file

  [owner, acc1, acc2, acc3] = await ethers.getSigners();
});

describe("deploy contracts", function () {
  it("deploy SweepStakesNFTs", async function () {
    sweepstakes = await ethers.getContractAt(
      "SweepStakesNFTs",
      jsonData.sweepstakes
    );
  });
  it("get StakingHelper: ", async function () {
    stakingHelper = await ethers.getContractAt(
      "StakingHelper",
      jsonData.stakingHelper
    );
  });
});


describe("get all token values", function () {
  it("get totalsupply", async function () {
    totalSupply = await sweepstakes.tokenCounter();
    console.log("totalSupply",totalSupply.toString());
  });
  holders = [
    '0x815e2D7607cea807622130E85309385ED3Bb814B',
    '0x106BbE5ab25Afb431c0f2231B33E1Eac61d1253D',
    '0x095CC788b688167a7ac0fea5CA56948e9f9C5F83',
    '0x591a6748b47564B91715352Bd2e9D028102DE7c7',
    '0xFc49B14da27a9d6054a12460a15D1587f48ff712',
    '0xaC85Ec193E534cd5dE30A56dcEBbcf9325911E17',
    '0x7A504f7b53F639cC7F76828622915757c335cb7A',
    '0xd76D5e2e8AcF75Ca91d87F4B3BBc3E3A9137ec18'
  ]
  holdings = [
    '0',
    '300001900369389604151',
    '303145492659673865040',
    '304002736673690554764',
    '300000000000000000000',
    '200000000000000000000',
    '252057663503728881892',
    '110000000000000000000'
  ]
  totalVal = 1968459767159022523982n
  it("get tokens", async function () {
    // for(let i=0;i<totalSupply;i++) {
    //   const holder = await sweepstakes.ownerOf(i);
    //   // holders.push(holder)
    //   const val = await sweepstakes.getNFTValue(i);
    //   // holdings.push(val.toString())
    //   // totalVal += BigInt(val.toString())
    // }
    console.log("holders",holders)
    console.log("holdings",holdings)
    console.log("totalVal",totalVal.toString())
  });
});

describe("deploy new sweepstakes", function () {
  it("deploy sweepstakes", async function () {
    const NewSweepStakesNFTs = await ethers.getContractFactory("SweepStakesNFTs");
    newSweepstakes = await NewSweepStakesNFTs.deploy(holders,holdings);
    await newSweepstakes.deployed();
    console.log("sweepstakes deployed to:", newSweepstakes.address);
  });
});
describe("check new sweepstakes", function () {
  it("check totalsupply", async function () {
    expect(await newSweepstakes.tokenCounter()).to.equal(totalSupply);
    expect(await newSweepstakes.totalStaked()).to.equal(totalVal);
  });
  it("check tokens", async function () {
    for(let i=0;i<totalSupply;i++) {
      expect(await newSweepstakes.ownerOf(i)).to.equal(holders[i]);
      expect((await newSweepstakes.getNFTValue(i)).toString()).to.equal(holdings[i]);
      const token = await newSweepstakes.tokenIdToInfo(i);
      const staked = token.staked;
      expect(staked).to.equal(holdings[i]);
    }
  });
});
describe("deploy stakinghelper", function () {
  it("deploy stakinghelper", async function () {
    const NewStakingHelper = await ethers.getContractFactory("StakingHelper");
    newStakingHelper = await NewStakingHelper.deploy(newSweepstakes.address, owner.address, totalVal, [HoundBurningVal, reppeggingNode, peaceLoveHarmony, fortuneValidator], {value: totalVal});
    await newStakingHelper.deployed();
    console.log("stakinghelper deployed to:", newStakingHelper.address);
  });
});
describe("check stakinghelper", function () {
  it("check stakinghelper", async function () {
    expect(await newStakingHelper.delegatedToValidator(HoundBurningVal)).to.equal(totalVal.div(4));
    expect(await newStakingHelper.delegatedToValidator(reppeggingNode)).to.equal(totalVal.div(4));
  });
});
describe("set stakinghelper in sweepstakes", function () {
  it("set stakinghelper", async function () {
    await newSweepstakes.setStakingHelper(newStakingHelper.address);
    expect(await newSweepstakes.stakingHelper()).to.equal(newStakingHelper.address);
  });
});

describe("remove the old sh from sweepstakes", function () {
  it("sets sweepstakes to owner address for now", async function () {
    await stakingHelper.setSweepstakes(owner.address);
    expect(await stakingHelper.sweepstakes()).to.equal(owner.address);
  });
  it("sets sh to owner too", async function () {
    await sweepstakes.setStakingHelper(owner.address);
    expect(await sweepstakes.stakingHelper()).to.equal(owner.address);
  });
  it("functions fail", async function () {
    await stakingHelper.unstake(ethers.utils.parseEther("20"),'0')
  });
  it("functions fail", async function () {
    await stakingHelper.enter(ethers.utils.parseEther("200"),{value: ethers.utils.parseEther("200")})
  });
  it("functions fail", async function () {
    await sweepstakes.withdrawFees()
  });
});


// // npx hardhat test test/redeploy.js --network testnet