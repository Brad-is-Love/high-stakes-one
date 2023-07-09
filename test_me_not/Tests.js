const { expect } = require("chai");
const { ethers } = require("hardhat");

before(async function () {
  console.log("Before:");
  [owner] = await ethers.getSigners();
  const SweepStakesNFTs = await ethers.getContractFactory("SweepStakesNFTs");
  sweepstakes = await SweepStakesNFTs.deploy();
  await sweepstakes.deployed();
  console.log("SweepStakesNFTs deployed to:", sweepstakes.address);
  //log contract size and gas used
  const contractSize = await ethers.provider.getCode(sweepstakes.address);
  console.log("Contract size: ", contractSize.length);
  const tx = await sweepstakes.deployTransaction.wait();
  console.log("Gas used to deploy contract: ", tx.gasUsed.toString());
});

describe("Test constructor", function () {
  it("name and symbol are correct", async function () {
    expect(await sweepstakes.name()).to.equal("Sweepstakes NFTs");
    expect(await sweepstakes.symbol()).to.equal("SSN");
  });

  it("token count, owner, draw period, lastdraw and prize fee", async function () {
    expect(await sweepstakes.tokenCounter()).to.equal(0);
    expect(await sweepstakes.owner()).to.equal(owner.address);
    expect(await sweepstakes.drawPeriod()).to.equal(7*24*60*60);
    const block = await ethers.provider.getBlock();
    const currentBlockTime = block.timestamp;
    expect(await sweepstakes.lastDrawTime()).to.equal(currentBlockTime);
    expect(await sweepstakes.prizeFee()).to.equal(5);  
  });
});

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


