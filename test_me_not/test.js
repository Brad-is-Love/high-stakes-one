const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  StakingAPI,
  IValidatorFull,
  NETWORK_TYPE,
} = require("harmony-staking-sdk");

// Testing as an ongoing thing on the testnet
// So need to save to files and read in the next run
// newest testStaker ""
// new testStaker "0x6eB221b1654BA536784029ce2fd34BA813Cf3261"
// old "testStaker":"0x5b1255A27de4b561837f8Af15e8542f9c4Cb7c25"
const testStakerOneAddress = "one1wu3xztkysmpgksk8dfz08m8rqwra07jxagcgfa"

// const testStakerOneAddress = "one1d6ezrvt9fwjnv7zq988zl56t4qfu7vnp5v72lf";
//below is old testStakerOne
// const testStakerOneAddress = "one1tvf9tgnauj6krqml3tc4ap2zl8zvklp9p9hzej";
const validatorAddress = "one198pwc4uq879kjhczvyl9lgt5nst9c5zhwhfrvz";
const val0xAddress = "0x29c2eC57803f8b695f02613E5FA1749c165c5057";
stakingApi = new StakingAPI({ apiUrl: "https://api.stake.hmny.io" });
const fs = require("fs");

//quick tests with harmony testnet to see if it works
before(async function () {
  //load the data from the file
  try {
    const data = fs.readFileSync("./data.json");
    jsonData = JSON.parse(data);
    // console.log("jsonData: ", jsonData);
  } catch (err) {
    // console.log("Error reading file: ", err);
  }

  console.log("Before:");
  [owner, acc1, acc2] = await ethers.getSigners();
});

describe("Get account balances", function () {
  it("owner bal", async function () {
    ownerBalance = await ethers.provider.getBalance(owner.address);
    console.log("Owner balance: ", ownerBalance.toString());
  });
  it("acc1 bal", async function () {
    acc1Balance = await ethers.provider.getBalance(acc1.address);
    console.log("Acc1 balance: ", acc1Balance.toString());
  });
  it("acc2 bal", async function () {
    acc2Balance = await ethers.provider.getBalance(acc2.address);
    console.log("Acc2 balance: ", acc1Balance.toString());
  });
});

describe("deploy TestStaker", function () {
  it("deploy TestStaker", async function () {
    if (jsonData.testStaker == undefined) {
      const TestStaker = await ethers.getContractFactory("TestStaker");
      testStaker = await TestStaker.deploy();
      await testStaker.deployed();
      console.log("TestStaker deployed to:", testStaker.address);
    } else {
      testStaker = await ethers.getContractAt(
        "TestStaker",
        jsonData.testStaker
      );
      console.log("TestStaker already at:", testStaker.address);
    }
  });
});

// describe("TestStaker check epoch, fund and withdraw", function () {
//   it("check owner", async function () {
//     expect(await testStaker.owner()).to.equal(owner.address);
//   });
//   it("check epoch", async function () {
//     const epoch = await testStaker.epoch();
//     console.log("epoch: ", epoch.toString());
//   });

//   it("fund contract", async function () {
//     await testStaker.acceptMoney({ value: ethers.utils.parseEther("1.0") });
//     expect(await ethers.provider.getBalance(testStaker.address)).to.equal(
//       ethers.utils.parseEther("1.0")
//     );
//     ownerBalance = await ethers.provider.getBalance(owner.address);
//     console.log("Owner balance: ", ownerBalance.toString());
//   });
//   it("withdraw the 1 ETH", async function () {
//     //reject not owner
//     await testStaker.withdraw();
//     expect(await ethers.provider.getBalance(testStaker.address)).to.equal(0);
//     ownerBalance = await ethers.provider.getBalance(owner.address);
//     console.log("Owner balance: ", ownerBalance.toString());
//   });
// });

describe("stake", function () {
  // it("0 delegated", async function () {
  //   expect(await getValidatorStats(testStakerOneAddress)).to.equal(0);
  // });

  it("try delegate", async function () {
    await testStaker.stake(val0xAddress, ethers.utils.parseEther("100.0"), {value: ethers.utils.parseEther("100.0")});

    expect(await ethers.provider.getBalance(testStaker.address)).to.equal(0);
  });

  it("100 delegated", async function () {
    expect(await getValidatorStats(testStakerOneAddress,"staked")).to.equal("100000000000000000000");
  });
});

describe("unstake", function () {
  // it("try unstake", async function () {
  //   await testStaker.unstake(val0xAddress, ethers.utils.parseEther("100.0"));
  // });
  // it("confirm undelegated", async function () {
  //   expect(await getValidatorStats(testStakerOneAddress,"undelegations")).to.equal("100000000000000000000");
  // });
  it("save epoch to the file", async function () {
    epoch = await testStaker.epoch();
  });
});

describe("collect rewards", function () {
  // it("try collect rewards", async function () {
  //   await testStaker.collect();

  //   const rewards = await ethers.provider.getBalance(testStaker.address)
  //   console.log("rewards: ", rewards.toString());
  // });
});

// save the contract address and balances to a file
describe("save contract address and balances to a file", function () {
  it("save contract address and balances to a file", async function () {
    const data = {
      testStaker: testStaker.address,
      owner: owner.address,
      acc1: acc1.address,
      acc2: acc2.address,
      ownerBalance: ownerBalance.toString(),
      acc1Balance: acc1Balance.toString(),
      acc2Balance: acc2Balance.toString(),
      epoch: epoch.toString(),
    };
    const jsonData = JSON.stringify(data);
    fs.writeFileSync("./data.json", jsonData, "utf-8");
  });
});

async function getValidatorStats(contractAddress, query) {
  let staked = 0;
  let undelegations = 0;
  try {
    const validator = await stakingApi.fetchValidatorByAddress(
      NETWORK_TYPE.TESTNET,
      validatorAddress
    );
    // console.log(validator)
    const index = validator.delegations.findIndex(
      (delegator) =>
        delegator["delegator-address"] ===
        testStakerOneAddress
    );
    console.log(validator);
    staked = validator.delegations[index].amount.toString();
    undelegations = validator.delegations[index].undelegations.toString();
  } catch (err) {
    console.error(
      `Error fetching validator information for address ${validatorAddress}:`,
      err
    );
  }

  return query == "staked" ? staked : undelegations;
}
