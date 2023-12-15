//Testnet 1: deploy contracts and stake
const { expect } = require("chai");
const { ethers } = require("hardhat");

const ssAbi = require("../frontend/src/contracts/SweepStakesNFTs.json").abi;
const shAbi = require("../frontend/src/contracts/StakingHelper.json").abi;
// mainnent

before(async function () {
  //load the data from the file
  [owner, acc1, acc2, acc3] = await ethers.getSigners();
});

const participants = ['0x095CC788b688167a7ac0fea5CA56948e9f9C5F83', '0x7A504f7b53F639cC7F76828622915757c335cb7A', '0xFc49B14da27a9d6054a12460a15D1587f48ff712', '0xaC85Ec193E534cd5dE30A56dcEBbcf9325911E17', '0x8065E83469c2ad5Ad61349652FE9CD016bCE0f8f', '0x7e8dcfcB5f028dfe60aed91f6f3DfDCaFC75Ffb4', '0x40565fD80adB60dA9747780a2D0B237fDF776f19', '0x106BbE5ab25Afb431c0f2231B33E1Eac61d1253D', '0xd3460a59A029D176d389ae64cAA1354567F69f56']
const toSend = "0"

describe("send one to all participants", function () {
  for(let i=0;i<participants.length;i++) {
    it("send one to: " + participants[i], async function () {
      //get the eth balance of the participant
      let balance = await ethers.provider.getBalance(participants[i]);
      await owner.sendTransaction({
        to: participants[i],
        value: ethers.utils.parseEther(toSend),
      });
      let balance2 = await ethers.provider.getBalance(participants[i]);
      expect(balance2).to.equal(balance.add(ethers.utils.parseEther(toSend)));
    });
  }
});


// npx hardhat test test/distributeONE.js --network testnet