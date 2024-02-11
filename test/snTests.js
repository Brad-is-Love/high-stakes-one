const { expect } = require("chai");
const { ethers } = require("hardhat");

before(async function () {
    //load the data from the file
    [owner, acc1, acc2, acc3] = await ethers.getSigners();
});

describe("deply screenNames contract", function () {
    it("Should deploy the contract", async function () {
        const screenNames = await ethers.getContractFactory("ScreenNames");
        sn = await screenNames.deploy();
        await sn.deployed();
    });
    it("Should set the owner", async function () {
        expect(await sn.owner()).to.equal(owner.address);
    });
    it("Owner is admin", async function () {
        expect(await sn.isAdmin(owner.address)).to.equal(true);
    });
});

describe("Set screen name, admin remove", function () {
    it("Should set screen name", async function () {
        await sn.connect(acc2).setScreenName("pig dog");
        expect(await sn.screenNames(acc2.address)).to.equal("pig dog");
        expect(await sn.screenNameReverse("pig dog")).to.equal(acc2.address);
    });
    it("Should remove screen name", async function () {
        await sn.removeScreenName(acc2.address);
        expect(await sn.screenNames(acc2.address)).to.equal("");
        expect(await sn.screenNameReverse("pig dog")).to.equal("0x0000000000000000000000000000000000000000");
    })
    it("Should not remove screen name", async function () {
        await sn.connect(acc2).setScreenName("pig dog");
        await expect(sn.connect(acc1).removeScreenName(acc2.address)).to.be.revertedWith("Only admin can call this function");
    });
});

describe("Add/remove admin", function () {
    it("Should add admin", async function () {
        await sn.addAdmin(acc1.address);
        expect(await sn.isAdmin(acc1.address)).to.equal(true);
    });
    it("Should not add admin", async function () {
        await expect(sn.connect(acc1).addAdmin(acc2.address)).to.be.revertedWith("Only owner can call this function");
    });
    it("Should remove admin", async function () {
        await sn.removeAdmin(acc1.address);
        expect(await sn.isAdmin(acc1.address)).to.equal(false);
    });
    it("Should not remove admin", async function () {
        await expect(sn.connect(acc1).removeAdmin(acc2.address)).to.be.revertedWith("Only owner can call this function");
    });
});
  
// npx hardhat test test/snTests.js