//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");

//deploy vrf
describe("deploy vrf", function () {
  it("deploy vrf", async function () {
    const VRF = await ethers.getContractFactory("VRF");
    vrf = await VRF.deploy("0x87B12cE42b004B4bb98F1bE06632F9F11d3D004C");
    await vrf.deployed();
    console.log("VRF deployed to:", vrf.address);
  });
  winners = {};
  for (let i = 0; i < 100; i++) {
    it("get random number", async function () {
      const randomNumber = await vrf.rng();
      console.log("random number: ", randomNumber);
      const address = await vrf.addressAtRng(randomNumber);
      if(winners[address] == undefined) {
        winners[address] = 1;
      } else {
        winners[address] += 1;
      }
      //sleep for 5 seconds
      await new Promise((r) => setTimeout(r, 3000));
    });
  }
  it("winners", async function () {
    console.log("winners: ", winners);
  }); 
});
