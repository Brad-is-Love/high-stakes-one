// Have changed assign prize, added prizeSchedule and changed the way prizePool is tracked.
// Just need to test those changes.

// npx hardhat test test/mainnetMinorPrizes.js --network testnet

//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  StakingAPI,
  IValidatorFull,
  NETWORK_TYPE,
} = require("harmony-staking-sdk");
const { toBech32 } = require('@harmony-js/crypto');
// ulad in Harmony
const valOne = "one1yp8mw25h0lmm4smjcpdxjj8dw9aydtxg4ywxnr"
const val0x = "0x204fb72a977FF7BAC372C05A6948Ed717a46ACc8"
stakingApi = new StakingAPI({ apiUrl: "https://api.stake.hmny.io" });
let jsonData = {};
const fs = require("fs");
const exp = require("constants");
const { EtherscanProvider } = require("@ethersproject/providers");

before(async function () {
  //load the data from the file
  try {
    data = fs.readFileSync("./ssData.json");
    jsonData = JSON.parse(data);
  } catch (err) {
    console.log("no file yet");
  }

  [owner, acc1, acc2, acc3] = await ethers.getSigners();
});


describe("deploy contracts", function () {
  it("deploy SweepStakesNFTs", async function () {
    if (!jsonData.sweepstakes) {
      const SweepStakesNFTs = await ethers.getContractFactory(
        "SweepStakesNFTs"
      );
      holders = [
        owner.address,
        acc1.address,
        acc2.address,
      ]
      holdings = [
        "100000000000000000000",
        "100000000000000000000",
        "100000000000000000000",
      ]
      sweepstakes = await SweepStakesNFTs.deploy(holders,holdings);
      await sweepstakes.deployed();
      console.log("SweepStakesNFTs deployed to:", sweepstakes.address);
      //log contract size and gas used
      const contractSize = await ethers.provider.getCode(sweepstakes.address);
      console.log("Contract size: ", contractSize.length);
      const tx = await sweepstakes.deployTransaction.wait();
      console.log("Gas used to deploy contract: ", tx.gasUsed.toString());
      saveData("sweepstakes", sweepstakes.address);
      //get block timestamp
      const block = await ethers.provider.getBlock(tx.blockNumber);
      saveData("lastDraw", block.timestamp);
    } else {
      sweepstakes = await ethers.getContractAt(
        "SweepStakesNFTs",
        jsonData.sweepstakes
      );
      console.log("SweepStakesNFTs already at:", sweepstakes.address);
    }
  });
});

describe("deploy staking helper", function () {
    it("deploy StakingHelper: ", async function () {
        if (!jsonData.stakingHelper) {
            const StakingHelper = await ethers.getContractFactory("StakingHelper");
            stakingHelper = await StakingHelper.deploy(
                sweepstakes.address,
                owner.address,
                0,
                [val0x]
            );
            await stakingHelper.deployed();
            console.log("StakingHelper deployed to:", stakingHelper.address);
            //log contract size and gas used
            const contractSize = await ethers.provider.getCode(stakingHelper.address);
            console.log("Contract size: ", contractSize.length);
            const tx = await stakingHelper.deployTransaction.wait();
            console.log("Gas used to deploy contract: ", tx.gasUsed.toString());
            saveData("stakingHelper", stakingHelper.address);
        } else {
            stakingHelper = await ethers.getContractAt(
                "StakingHelper",
                jsonData.stakingHelper
            );
            console.log("StakingHelper already at:", stakingHelper.address);
        }
    });
});

// describe("set stakingHelper", function () {
//     it("set stakingHelper in sweepstakes", async function () {
//         await sweepstakes.setStakingHelper(stakingHelper.address);
//     })
// });

// describe("set sweepstakes", function () {
//   it("set sweepstakes in stakingHelper", async function () {
//     await stakingHelper.setSweepstakes(sweepstakes.address);
//   });
// });


// Stake a couple people
// describe("enter", function () {
//     it("owner enters with 100 ONE", async function () {
//         await stakingHelper.enter(ethers.utils.parseEther("100"), {
//           value: ethers.utils.parseEther("100"),
//         });
//     })
//     it("acc1 enters with 100 ONE", async function () {
//         await stakingHelper.connect(acc1).enter(ethers.utils.parseEther("200"), {
//           value: ethers.utils.parseEther("200"),
//         });
//     })
//     it("acc2 enters with 200 ONE", async function () {
//         await stakingHelper.connect(acc2).enter(ethers.utils.parseEther("200"), {
//           value: ethers.utils.parseEther("200"),
//         });
//     })
// });
// // Set prize schedule [1,10,50,100]
// describe("set prize schedule", function () {
//     it("set prize schedule", async function () {
//         await sweepstakes.setPrizeSchedule([1,10,50,100]);
//     })
// });

// // juice pool with 1000 ONE
// describe("juice the Prize Pool", function () {
//   it("stakingHelper accepts 1000 ONE", async function () {
//     await stakingHelper.juicePrizePool({
//       value: ethers.utils.parseEther("1000"),
//     });
//     expect(await stakingHelper.extraFunds()).to.equal(
//       ethers.utils.parseEther("1000")
//     );
//   });
// });

// Run a draw every minute
describe("run draw", function () {
  it("set draw period to 30s", async function () {
    await sweepstakes.setDrawPeriod(30);
    expect(await sweepstakes.drawPeriod()).to.equal(30);
  });
  it("draw winner", async function () {
    prizeAssigned = false
    console.log("lastDraw", await sweepstakes.lastDrawTime());
    console.log("prizeAssigned", await sweepstakes.prizeAssigned());
    await sweepstakes.drawWinner();
    prizeAssigned = await sweepstakes.prizeAssigned()
    //draw again if failed
    if(prizeAssigned) {
      await sweepstakes.drawWinner();
    }
    prizeAssigned = await sweepstakes.prizeAssigned()
    console.log("lastDraw", await sweepstakes.lastDrawTime());
    console.log("prizeAssigned", prizeAssigned);
  });
  it("check lastDrawTime", async function () {
    expect(await sweepstakes.lastDrawTime()).to.not.equal(jsonData.lastDraw);
    const block = await ethers.provider.getBlock("latest");
    saveData("lastDraw", block.timestamp);
  });
  it("assignPrize", async function () {
    let pendingDelegation = await stakingHelper.pendingDelegation();
    console.log("pendingDelegation before", pendingDelegation.toString());
    let index = await sweepstakes.prizeScheduleIndex();
    let extraFunds = await stakingHelper.extraFunds();
    let schedule = [1,10,50,100]
    let expectedPrize = extraFunds.mul(schedule[index]).div(100);
    console.log("expectedPrize", expectedPrize.toString());
    console.log("index", index.toString());
    ownerToken = (await sweepstakes.tokenIdToInfo(0)).staked;
    acc1Token = (await sweepstakes.tokenIdToInfo(1)).staked;
    acc2Token = (await sweepstakes.tokenIdToInfo(2)).staked;
    if(!prizeAssigned) {
      tx = await sweepstakes.assignPrize();
      const receipt = await tx.wait()
      for (const event of receipt.events) {
        if (event.event === "WinnerAssigned") {
          console.log("WinnerDrawn", event.args);
        }
      }
      console.log("gas used",receipt.gasUsed.toString())
    } else {
      //something has gone wrong with drawWinner. 
      process.exit(0);
    }
  });
  it("check balances", async function () {
    const fees = await sweepstakes.feesToCollect();
    console.log("fees", fees.toString());
    //should auto compound
    const totalStaked = await sweepstakes.totalStaked();
    console.log("totalStaked", totalStaked.toString());
    const ownerTokenAfter = (await sweepstakes.tokenIdToInfo(0)).staked;
    const acc1TokenAfter = (await sweepstakes.tokenIdToInfo(1)).staked;
    const acc2TokenAfter = (await sweepstakes.tokenIdToInfo(2)).staked;
    console.log(
      "owner before, after",
      ownerToken.toString(),
      ownerTokenAfter.toString()
    );
    console.log(
      "acc1 before, after",
      acc1Token.toString(),
      acc1TokenAfter.toString()
    );
    console.log(
      "acc2 before, after",
      acc2Token.toString(),
      acc2TokenAfter.toString()
    );
  });
});

describe("save contract address and balances to a file", function () {
  it("save contract address and balances to a file", async function () {
    const jd = JSON.stringify(jsonData);
    fs.writeFileSync("./ssData.json", jd, "utf-8");
  });
});

function saveData(key, value) {
  jsonData[key] = value;
}
