// We import Chai to use its asserting functions here.
const { expect } = require("chai");

main = async () => {
  //deploy the contract
  describe("Deploy Participants Contract", function () {
    //deploy the contract
    it("Should deploy the contract", async function () {
      [owner, addr1, addr2, addr3] = await ethers.getSigners();
      const Participants = await ethers.getContractFactory("Participants");
      participants = await Participants.deploy();
      await participants.deployed();
      console.log("Participants deployed to:", participants.address);

      //check the owner
      expect(await participants.owner()).to.equal(owner.address);
    });
  });

  describe("Buy tickets", function () {
    it("Should buy tickets and update vars", async function () {
      //buy tickets
      await participants.buyTickets(addr1.address, 100);
      //check addr1 has 100 tickets
      expect(await participants.tickets(addr1.address)).to.equal(100);
      //check addr1 is at index zero
      expect(await participants.participantIndex(addr1.address)).to.equal(0);
      //check addr1 is in the participants array
      expect(await participants.participants(0)).to.equal(addr1.address);
      //check totalStaked
      expect(await participants.totalStaked()).to.equal(100);

      //same thing with addr2 and addr3, call from addr2
      await participants.connect(addr2).buyTickets(addr2.address, 100);
      expect(await participants.tickets(addr2.address)).to.equal(100);
      expect(await participants.participantIndex(addr2.address)).to.equal(1);
      expect(await participants.participants(1)).to.equal(addr2.address);
      expect(await participants.totalStaked()).to.equal(200);

      await participants.connect(addr2).buyTickets(addr3.address, 100);
      expect(await participants.tickets(addr3.address)).to.equal(100);
      expect(await participants.participantIndex(addr3.address)).to.equal(2);
      expect(await participants.participants(2)).to.equal(addr3.address);
      expect(await participants.totalStaked()).to.equal(300);
    });
  });

  describe("find index", function () {
    it("Should find index", async function () {
      expect(await participants.findIndex(59)).to.equal(addr1.address);
      expect(await participants.findIndex(100)).to.equal(addr1.address);
      expect(await participants.findIndex(101)).to.equal(addr2.address);
      expect(await participants.findIndex(299)).to.equal(addr3.address);
      //reverts if not found
        await expect(participants.findIndex(301)).to.be.reverted;
        });
  });

  describe("refund tickets", function () {
    it("Should refund tickets and update vars", async function () {
      //refund tickets
      await participants.refundTickets(addr1.address, 100);
      //check addr1 has 0 tickets
      expect(await participants.tickets(addr1.address)).to.equal(0);
      //check addr1 is not in the participants array
      expect(await participants.participants(0)).to.equal(addr3.address);
      //check totalStaked
      expect(await participants.totalStaked()).to.equal(200);
    });

    it("find index again", async function () {
        expect(await participants.findIndex(59)).to.equal(addr3.address);
        expect(await participants.findIndex(100)).to.equal(addr3.address);
        expect(await participants.findIndex(101)).to.equal(addr2.address);
        expect(await participants.findIndex(200)).to.equal(addr2.address);
        await expect(participants.findIndex(201)).to.be.reverted;
    });

    it("try again with smaller amount", async function () {
        await participants.refundTickets(addr2.address, 50);
        expect(await participants.tickets(addr2.address)).to.equal(50);
        expect(await participants.participants(1)).to.equal(addr2.address);
        expect(await participants.totalStaked()).to.equal(150);
        expect(await participants.findIndex(150)).to.equal(addr2.address);
        await expect(participants.findIndex(151)).to.be.reverted;
        });
  });
};

main();
