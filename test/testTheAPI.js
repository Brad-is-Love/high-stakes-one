const { StakingAPI, IValidatorFull, NETWORK_TYPE } = require("harmony-staking-sdk");
const { expect } = require("chai");
const { ethers } = require("hardhat");

// Testing as an ongoing thing on the testnet
// So need to save to files and read in the next run
const fs = require("fs");

const validatorAddress = "one198pwc4uq879kjhczvyl9lgt5nst9c5zhwhfrvz";
// https://api.s0.b.hmny.io
const stakingApi = new StakingAPI({ apiUrl: "https://api.stake.hmny.io" });

//quick tests with harmony testnet to see if it works
before(async function () {
  stakingApi
    .fetchNetworks()
    .then((networks) => {
      // console.log("Available networks:", networks);
    })
    .catch((err) => {
      // console.error("Error fetching networks:", err);
    });
  //load the data from the file
  try {
    const data = fs.readFileSync("./data.json");
    jsonData = JSON.parse(data);
    // console.log("jsonData: ", jsonData);
  } catch (err) {
    // console.log("Error reading file: ", err);
  }
//API info at: https://github.com/harmony-one/staking-sdk
  stakingApi.fetchValidatorByAddress(NETWORK_TYPE.TESTNET, validatorAddress)
  .then((validator) => {
    console.log('Validator information:', validator);
  })
  .catch((err) => {
    console.error(`Error fetching validator information for address ${validatorAddress}:`, err);
  });

  console.log("Before:");
  [owner, acc1, acc2] = await ethers.getSigners();

});

describe("Get account balances", function () {
  it("owner bal", async function () {
    ownerBalance = await ethers.provider.getBalance(owner.address);
    // console.log("Owner balance: ", ownerBalance.toString());
  });
//   it("acc1 bal", async function () {
//     acc1Balance = await ethers.provider.getBalance(acc1.address);
//     console.log("Acc1 balance: ", acc1Balance.toString());
//   });
//   it("acc2 bal", async function () {
//     acc2Balance = await ethers.provider.getBalance(acc2.address);
//     console.log("Acc2 balance: ", acc1Balance.toString());
//   });
});

// describe("deploy TestStaker", function () {
//   it("deploy TestStaker", async function () {
//     if (jsonData.testStaker == undefined) {
//       const TestStaker = await ethers.getContractFactory("TestStaker");
//       testStaker = await TestStaker.deploy();
//       await testStaker.deployed();
//       console.log("TestStaker deployed to:", testStaker.address);
//     } else {
//       testStaker = await ethers.getContractAt(
//         "TestStaker",
//         jsonData.testStaker
//       );
//       console.log("TestStaker already at:", testStaker.address);
//     }
//   });
// });

// describe("TestStaker check, fund and withdraw", function () {
//   it("check owner", async function () {
//     expect(await testStaker.owner()).to.equal(owner.address);
//   });
//   // this uses the owner account with the acceptMoney function and a message value of 1 ETH
//   it("fund contract", async function () {
//     await testStaker.acceptMoney({ value: ethers.utils.parseEther("1.0") });
//     expect(await ethers.provider.getBalance(testStaker.address)).to.equal(
//       ethers.utils.parseEther("1.0")
//     );
//     ownerBalance = await ethers.provider.getBalance(owner.address);
//     console.log("Owner balance: ", ownerBalance.toString());
//   });
//   it("withdraw the 1 ETH", async function () {
//     await testStaker.withdraw();
//     expect(await ethers.provider.getBalance(testStaker.address)).to.equal(0);
//     ownerBalance = await ethers.provider.getBalance(owner.address);
//     console.log("Owner balance: ", ownerBalance.toString());
//   });
// });

// // describe("fund and stake" , function () {
// //     it("fund contract", async function () {
// //         await testStaker.acceptMoney({value: ethers.utils.parseEther("100.0")});
// //         expect(await ethers.provider.getBalance(testStaker.address)).to.equal(ethers.utils.parseEther("100.0"));

// // save the contract address and balances to a file
// describe("save contract address and balances to a file", function () {
//   it("save contract address and balances to a file", async function () {
//     const data = {
//       testStaker: testStaker.address,
//       owner: owner.address,
//       acc1: acc1.address,
//       acc2: acc2.address,
//       ownerBalance: ownerBalance.toString(),
//       acc1Balance: acc1Balance.toString(),
//       acc2Balance: acc2Balance.toString(),
//     };
//     const jsonData = JSON.stringify(data);
//     fs.writeFileSync("./data.json", jsonData, "utf-8");
//   });
// });
