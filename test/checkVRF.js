//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");

//deploy vrf
describe("deploy vrf", function () {
    it("deploy vrf", async function () {
        const VRF = await ethers.getContractFactory("VRF");
        vrf = await VRF.deploy();
        await vrf.deployed();
        console.log("VRF deployed to:", vrf.address);
    });
    it("get random number", async function () {
        const randomNumber = await vrf.rng();
        console.log("random number: ", randomNumber);
        //sleep for 5 seconds
        await new Promise(r => setTimeout(r, 5000));
    });
    it("get random number", async function () {
        const randomNumber = await vrf.rng();
        console.log("random number2: ", randomNumber);
                //sleep for 5 seconds
                await new Promise(r => setTimeout(r, 5000));
    });
    it("get random number", async function () {
        const randomNumber = await vrf.rng();
        console.log("random number3: ", randomNumber);
    });
});