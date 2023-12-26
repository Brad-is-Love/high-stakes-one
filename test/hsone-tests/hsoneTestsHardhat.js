// High stakes interacts with SweepStakesNFTs, but doesn't need to stake or unstake - no interaction with StakingHelper.
// We can run the tests on hardhat to make things easier, then duplicate on the testnet.

// run with:
// npx hardhat test test/hsone-tests/hsoneTestsHardhat.js

const { expect } = require("chai");
const { ethers } = require("hardhat");

before(async function () {
    [owner, acc1, acc2, acc3] = await ethers.getSigners();
});

describe("deploy contracts", function () {
    it("deploy SweepStakesNFTs", async function () {
        SweepStakesNFTs = await ethers.getContractFactory("SweepStakesNFTs");
        // need to pass in holders and holdings here so we have some nfts to test on acc1 has 100ONE
        sweepStakesNFTs = await SweepStakesNFTs.deploy([acc1.address, acc2.address, acc3.address, acc1.address],[ethers.utils.parseEther("100"), "0", ethers.utils.parseEther("300"),ethers.utils.parseEther("100")]);
        await sweepStakesNFTs.deployed();
    });
    it("deploy HighStakesONE", async function () {
        HighStakesONE = await ethers.getContractFactory("HighStakesONE");
        highStakesONE = await HighStakesONE.deploy(sweepStakesNFTs.address);
        await highStakesONE.deployed();
    });
});

describe("check acc1 has 100ONE nft", function () {
    it("check acc1 has an nft", async function () {
        expect(await sweepStakesNFTs.balanceOf(acc1.address)).to.equal(2);
    });
    it("check it has 100ONE", async function () {
        expect(await sweepStakesNFTs.getNFTValue(0)).to.equal(ethers.utils.parseEther("100"));
    });
});

describe("Check setters", function () {
    it("check setOwner", async function () {
        //non owner can't set owner
        await expect(highStakesONE.connect(acc1).setOwner(acc2.address)).to.be.revertedWith("Only owner");
        await highStakesONE.setOwner(acc2.address);
        expect(await highStakesONE.owner()).to.equal(acc2.address);
        //reset owner
        await highStakesONE.connect(acc2).setOwner(owner.address);
    });
    it("check setBeneficiary", async function () {
        //non owner can't set beneficiary
        await expect(highStakesONE.connect(acc1).setBeneficiary(acc2.address)).to.be.revertedWith("Only owner");
        await highStakesONE.setBeneficiary(acc2.address);
        expect(await highStakesONE.beneficiary()).to.equal(acc2.address);
        //reset beneficiary
        await highStakesONE.setBeneficiary(owner.address);
    });
    it("check setFee", async function () {
        //non owner can't set fee
        await expect(highStakesONE.connect(acc1).setFee("15")).to.be.revertedWith("Only owner");
        await highStakesONE.setFee("15");
        expect(await highStakesONE.fee()).to.equal(15);
        //reset fee
        await highStakesONE.setFee("30");
    });
    it("check sweepStakesNFTs", async function () {
        //non owner can't set sweepStakesNFTs
        await expect(highStakesONE.connect(acc1).setSweepStakesNFTs(acc2.address)).to.be.revertedWith("Only owner");
        await highStakesONE.setSweepStakesNFTs(acc2.address);
        expect(await highStakesONE.sweepStakesNFTs()).to.equal(acc2.address);
        //reset sweepStakesNFTs
        await highStakesONE.setSweepStakesNFTs(sweepStakesNFTs.address);
    });
});


describe("check HSONE set up", function () {
    it("check HSONE has 0 totalSupply", async function () {
        expect(await highStakesONE.totalSupply()).to.equal(0);
    });
    it("check name & symbol", async function () {
        expect(await highStakesONE.name()).to.equal("High Stakes ONE");
        expect(await highStakesONE.symbol()).to.equal("HSONE");
    });
    it("check owner & beneficiary", async function () {
        expect(await highStakesONE.owner()).to.equal(owner.address);
        expect(await highStakesONE.beneficiary()).to.equal(owner.address);
    });
});

 // Staking tests
 describe("staking tests", function () {
 // can't stake if not approved
    it("can't stake if not approved", async function () {
        await expect(highStakesONE.stakeNFT(0)).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
 // can't stake if not owner of nft
    it("can't stake if not owner of nft", async function () {
        await sweepStakesNFTs.connect(acc1).approve(highStakesONE.address, 0);
        await expect(highStakesONE.connect(acc2).stakeNFT(0)).to.be.revertedWith("ERC721: transfer from incorrect owner");
    });
 // can stake and get nft value - fee of HSONE
    it("can stake", async function () {
        await sweepStakesNFTs.connect(acc1).approve(highStakesONE.address, 0);
        await highStakesONE.connect(acc1).stakeNFT(0);
        expect(await sweepStakesNFTs.balanceOf(acc1.address)).to.equal(1);
        expect(await sweepStakesNFTs.balanceOf(highStakesONE.address)).to.equal(1);
        expect(await sweepStakesNFTs.ownerOf(0)).to.equal(highStakesONE.address);
        expect(await highStakesONE.totalSupply()).to.equal(ethers.utils.parseEther("100"));
    });
    it("staked and received HSONE", async function () {
        expect(await highStakesONE.balanceOf(acc1.address)).to.equal(ethers.utils.parseEther("99.7"));
        // check that the fee was taken
        expect(await highStakesONE.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("0.3"));
        //check price
        expect(await highStakesONE.getNFTPrice(0)).to.equal(ethers.utils.parseEther("100"));
    });
    // can't stake again
    it("can't approve again", async function () {
        await expect(sweepStakesNFTs.connect(acc1).approve(highStakesONE.address, 0)).to.be.revertedWith("ERC721: approval to current owner");
    });
 // can't stake 0 value nft
    it("can't stake 0 value nft", async function () {
        await sweepStakesNFTs.connect(acc2).approve(highStakesONE.address, 1)
        await expect(highStakesONE.connect(acc2).stakeNFT(1)).to.be.revertedWith("NFT has no value");
    });
 });

 describe("check pausable", function () {
    it("check pause", async function () {
        //non owner can't pause
        await expect(highStakesONE.connect(acc1).pause()).to.be.revertedWith("Only owner");
        await highStakesONE.pause();
        expect(await highStakesONE.paused()).to.equal(true);
    });
    it("can't stake when paused", async function () {
        await sweepStakesNFTs.connect(acc3).approve(highStakesONE.address, 2);
        await expect(highStakesONE.connect(acc3).stakeNFT(2)).to.be.revertedWith("ERC20Pausable: token transfer while paused");
    });
    it("can't transfer when paused", async function () {
        await expect(highStakesONE.connect(acc1).transfer(acc2.address, ethers.utils.parseEther("1"))).to.be.revertedWith("ERC20Pausable: token transfer while paused");
    });
    it("check unpause", async function () {
        //non owner can't unpause
        await expect(highStakesONE.connect(acc1).unpause()).to.be.revertedWith("Only owner");
        await highStakesONE.unpause();
        expect(await highStakesONE.paused()).to.equal(false);
    });
 });

 //stake acc3's NFT
 describe("stake acc3's NFT", function () {
    it("stake acc3's NFT", async function () {
        await sweepStakesNFTs.connect(acc3).approve(highStakesONE.address, 2);
        await highStakesONE.connect(acc3).stakeNFT(2);
        expect(await sweepStakesNFTs.balanceOf(acc3.address)).to.equal(0);
        expect(await sweepStakesNFTs.balanceOf(highStakesONE.address)).to.equal(2);
        expect(await sweepStakesNFTs.ownerOf(2)).to.equal(highStakesONE.address);
        expect(await highStakesONE.totalSupply()).to.equal(ethers.utils.parseEther("400"));
    });
    it("staked and received HSONE", async function () {
        expect(await highStakesONE.balanceOf(acc3.address)).to.equal(ethers.utils.parseEther("299.1"));
        // check that the fee was taken
        expect(await highStakesONE.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("1.2"));
        //check price
        expect(await highStakesONE.getNFTPrice(2)).to.equal(ethers.utils.parseEther("300"));
    });
 });
 //check unstake functions
 describe("check unstake functions", function () {
    // reverts while paused
    it("reverts while paused", async function () {
        await highStakesONE.pause();
        await expect(highStakesONE.connect(acc3).unstakeNFT(0)).to.be.revertedWith("ERC20Pausable: token transfer while paused");
        await highStakesONE.unpause();
    });
    // burns 100 HSONE from acc3 and transfers the NFT to them
    it("unstakeNFT", async function () {
        await highStakesONE.connect(acc3).unstakeNFT(0);
        expect(await sweepStakesNFTs.balanceOf(acc3.address)).to.equal(1);
        expect(await sweepStakesNFTs.balanceOf(highStakesONE.address)).to.equal(1);
        expect(await sweepStakesNFTs.ownerOf(0)).to.equal(acc3.address);
        expect(await highStakesONE.totalSupply()).to.equal(ethers.utils.parseEther("300"));
        expect(await highStakesONE.balanceOf(acc3.address)).to.equal(ethers.utils.parseEther("199.1"));
    });
    // can restake it
    it("can restake it", async function () {
        await sweepStakesNFTs.connect(acc3).approve(highStakesONE.address, 0);
        await highStakesONE.connect(acc3).stakeNFT(0);
        expect(await sweepStakesNFTs.balanceOf(acc3.address)).to.equal(0);
        expect(await sweepStakesNFTs.balanceOf(highStakesONE.address)).to.equal(2);
        expect(await sweepStakesNFTs.ownerOf(0)).to.equal(highStakesONE.address);
        expect(await highStakesONE.totalSupply()).to.equal(ethers.utils.parseEther("400"));
        expect(await highStakesONE.balanceOf(acc3.address)).to.equal(ethers.utils.parseEther("298.8"));
    });
 });

 describe("deploy another NFT and try to send it", function () {
    it("deploy SSN", async function () {
        SSN = await ethers.getContractFactory("SweepStakesNFTs");
        // need to pass in holders and holdings here so we have some nfts to test on acc1 has 100ONE
        sSN = await SSN.deploy([owner.address],[ethers.utils.parseEther("100")]);
        await sSN.deployed();
    });
    it("can't send different NFT to HSONE", async function () {
        await expect(sSN["safeTransferFrom(address,address,uint256)"](owner.address, highStakesONE.address, 0)).to.be.revertedWith("ERC721: transfer to non ERC721Receiver implementer");
    });
});