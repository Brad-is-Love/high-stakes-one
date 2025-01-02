const { expect } = require("chai");
const { ethers } = require("hardhat");

const ssAbi = require("../frontend/src/contracts/SweepStakesNFTs.json").abi;

const oldSweepstakesAddress = "0x058DCD4FcB02d0cD2df9E8Be992bfB89998A6Bbd";

before(async function () {
  [owner] = await ethers.getSigners();
});

describe("get contract", function () {
  it("get SweepStakesNFTs", async function () {
    oldSweepstakes = await ethers.getContractAt(
      "SweepStakesNFTs",
      oldSweepstakesAddress
    );
  });
});

describe("get all token values", function () {
    it("get totalsupply", async function () {
      totalSupply = await oldSweepstakes.tokenCounter();
      console.log("totalSupply",totalSupply.toString());
    });
    it("get all holders and holdings", async function () {
      holders = []
      staked = []
      unstaked = []
      withdrawEpochs = []
      totalStaked = ethers.BigNumber.from(0);
      for (let i = 0; i < totalSupply; i++) {
        holders.push(await oldSweepstakes.ownerOf(i));
        const token = await oldSweepstakes.tokenIdToInfo(i);
        staked.push(token.staked.toString());
        unstaked.push(token.unstaked.toString());
        withdrawEpochs.push(token.withdrawEpoch.toString());
        totalStaked = totalStaked.add(token.staked);
      }
      // replace the HSOne contract with mine 0xDfAF08706eF28337c7D81F320982f4B2D9615EA0
      const index = holders.findIndex(holder => holder === "0xDfAF08706eF28337c7D81F320982f4B2D9615EA0");
      holders[index] = "0x7188CC2282c105DfcE5249e6a909DB71b914B25b";
      console.log("holders",holders);
      console.log("staked",staked);
      console.log("unstaked",unstaked);
      console.log("withdrawEpochs",withdrawEpochs);
      console.log("added totalStaked",totalStaked.toString());
      console.log("actual totalStaked", await oldSweepstakes.totalStaked());
      // check totalStake matches oldSweepstakes.totalStake() otherwise end process
      if(totalStaked.toString() !== (await oldSweepstakes.totalStaked()).toString()){
        console.log("added up totalStaked does not match oldSweepstakes.totalStaked()");
        process.exit();
      }
    });
  });

//   run with npx hardhat test scripts/getOldData.js --network mainnet