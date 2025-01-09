import { ethers } from "ethers";
import sweepstakesArtifact from "../contracts/SweepStakesNFTs.json";
import sweepstakesAddress from "../contracts/SweepStakesNFTs-address.json";
import stakingHelperArtifact from "../contracts/StakingHelper.json";
import stakingHelperAddress from "../contracts/StakingHelper-address.json";

const MAINNET = {
  ID: 1666600000,
  chainName: "Harmony Mainnet",
  nativeCurrency: {
    name: "ONE",
    symbol: "ONE",
    decimals: 18,
  },
  rpcUrls: ["https://api.harmony.one"],
  blockExplorerUrls: ["https://explorer.harmony.one/"],
  sweepstakesAddress: sweepstakesAddress.address,
  stakingHelperAddress: stakingHelperAddress.address,
};

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.sweepstakes = null;
    this.stakingHelper = null;
  }

  async initialize() {
    if (window.ethereum) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
      this.signer = this.provider.getSigner();
      this.sweepstakes = new ethers.Contract(
        MAINNET.sweepstakesAddress,
        sweepstakesArtifact.abi,
        this.signer
      );
      this.stakingHelper = new ethers.Contract(
        MAINNET.stakingHelperAddress,
        stakingHelperArtifact.abi,
        this.signer
      );
    } else {
      throw new Error("Ethereum wallet not detected");
    }
  }

  async connectWallet() {
    console.log("Connecting wallet...");
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    return accounts[0];
  }

  handleAccountChanges(callback) {
    window.ethereum.on("accountsChanged", callback);
  }

  handleNetworkChanges(callback) {
    window.ethereum.on("chainChanged", callback);
  }

  async getBalance(address) {
    const balance = await this.provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  }

  // Add other Web3 methods here...
  async drawWinner() {
    return await this.sweepstakes.drawWinner();
  }

  async assignPrize() {
    return await this.sweepstakes.assignPrize();
  }

  async stake(amount, tokenId) {
    const stake = ethers.utils.parseEther(amount.toString());
    if (!tokenId) {
      return await this.stakingHelper.enter(stake, { value: stake });
    } else {
      return await this.stakingHelper.addToToken(stake, tokenId, {
        value: stake,
      });
    }
  }

  async unstake(amount, tokenId) {
    const toUnstake = ethers.utils.parseEther(amount.toString());
    return await this.stakingHelper.unstake(toUnstake, tokenId);
  }

  async withdraw(tokenId) {
    return await this.sweepstakes.withdraw(tokenId);
  }

}

const web3Service = new Web3Service();
export default web3Service;
