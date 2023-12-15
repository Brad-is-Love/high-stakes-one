//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");

let jsonData = {
  sweepstakes: "0x058DCD4FcB02d0cD2df9E8Be992bfB89998A6Bbd",
  lastDraw: 1698460661,
  stakingHelper: "0x6eB221b1654BA536784029ce2fd34BA813Cf3261",
  acc2UnstakedAtEpoch: 2259,
};

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
    console.log("SweepStakesNFTs already at:", sweepstakes.address);
  });
});

describe("deploy staking helper", function () {
  it("get StakingHelper: ", async function () {
    stakingHelper = await ethers.getContractAt(
      "StakingHelper",
      jsonData.stakingHelper
    );
  });
});

describe("Change owner to multisig", function () {
    it("change owner for sweepstakes", async function () {
        const multisig = "0x73484BFf016a25CDEB0d9B892aA6cfF2Ee0f2ce7"
        await sweepstakes.setOwner(multisig);
        expect(await sweepstakes.owner()).to.equal(multisig);
    });
    it("change owner for stakingHelper", async function () {
        const multisig = "0x73484BFf016a25CDEB0d9B892aA6cfF2Ee0f2ce7"
        await stakingHelper.setOwner(multisig);
        expect(await stakingHelper.owner()).to.equal(multisig);
    });
});

describe("try onlyOwner functions with previous owner", function () {
    it("try to change owner for sweepstakes", async function () {
        await expect(sweepstakes.connect(owner).setOwner(owner.getAddress())).to.be.revertedWith("Ownable: caller is not the owner");
    });
    it("try to change owner for stakingHelper", async function () {
        await expect(stakingHelper.connect(owner).setOwner(owner.getAddress())).to.be.revertedWith("Ownable: caller is not the owner");
    });
});





// npx hardhat run scripts/switch-owner.js --network mainnet