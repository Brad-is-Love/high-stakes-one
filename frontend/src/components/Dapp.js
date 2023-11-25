import React from "react";
import { ethers } from "ethers";

import sweepstakesAtrifact from "../contracts/SweepStakesNFTs.json";
import sweepstakesAddress from "../contracts/SweepStakesNFTs-address.json";
import stakingHelperAtrifact from "../contracts/StakingHelper.json";
import stakingHelperAddress from "../contracts/StakingHelper-address.json";
import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
import { Loading } from "./Loading";
import { LuckyStaker } from "./LuckyStaker";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { Nav } from "./Nav";
import { Description } from "./Description";
import { Socials } from "./Socials";

// const TESTNET = {
//   ID: 1666700000,
//   chainName: "Harmony Testnet",
//   nativeCurrency: {
//     name: "TEST ONE",
//     symbol: "TONE",
//     decimals: 18,
//   },
//   rpcUrls: ["https://api.s0.b.hmny.io"],
//   blockExplorerUrls: ["https://explorer.testnet.harmony.one/"],
//   sweepstakesAddress: "0xf266cEAd75739dc9f2A1F79d467DeAEC3976F2AF",
//   stakingHelperAddress: "0x4Dd8518F40d949D6D2EEcC859364Ff836DC456fb"
// };
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
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

const whitelistedAddresses = [
  "0x7188cc2282c105dfce5249e6a909db71b914b25b",
  "0x815e2d7607cea807622130e85309385ed3bb814b",
  "0x095cc788b688167a7ac0fea5ca56948e9f9c5f83",
  "0x7a504f7b53f639cc7f76828622915757c335cb7a",
  "0xfc49b14da27a9d6054a12460a15d1587f48ff712",
  "0xac85ec193e534cd5de30a56dcebbcf9325911e17",
  "0x8065e83469c2ad5ad61349652fe9cd016bce0f8f",
  "0x7e8dcfcb5f028dfe60aed91f6f3dfdcafc75ffb4",
  "0x40565fd80adb60da9747780a2d0b237fdf776f19",
  "0x106bbe5ab25afb431c0f2231b33e1eac61d1253d",
  "0xd3460a59a029d176d389ae64caa1354567f69f56",
  "0x591a6748b47564b91715352bd2e9d028102de7c7",
  "0xd76d5e2e8acf75ca91d87f4b3bbc3e3a9137ec18",
];

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      lastWinner: undefined,
      lastPrize: undefined,
      nextDrawTime: undefined,
      currentEpoch: undefined,
      totalStaked: undefined,
      userTokenId: undefined,
      userStaked: undefined,
      userUnstaked: undefined,
      userWithdrawEpoch: undefined,
      userWithdrawable: undefined,
      selectedAddress: undefined,
      balance: undefined,
      txBeingSent: undefined,
      transactionError: undefined,
      networkError: undefined,
    };

    this.state = this.initialState;
  }

  render() {
    if (window.ethereum === undefined) {
      return (
        <>
          <NoWalletDetected />
          <Socials />        
        </>
      )
    }

    if (!this.state.selectedAddress || this.state.networkError) {
      return (
        <>
          <ConnectWallet
            connectWallet={() => this._connectWallet()}
            networkError={this.state.networkError}
            dismiss={() => this._dismissNetworkError()}
            switchChain={() => this._switchChain()}
          />       
        </>
      );
    }

    if (!whitelistedAddresses.includes(this.state.selectedAddress.toLowerCase())) {
      return (
        <>
        <div className="connectWalletBackground"></div>
          <div className="d-flex align-items-center justify-content-center flex-column p-3">
          <Description displayMessage={true} />
          <Socials />
        </div>
        
        </>
      );
    }

    if (!this.state.balance) {
      return <Loading />;
    }

    return (
      <>
        <div className="background"></div>
        <Nav
          selectedAddress={this.state.selectedAddress}
        />
        <div className="app mt-md-5">
          <div className="container p-3 mt-2">
            <div className="row my-1">
              <div className="col-12">
                {this.state.txBeingSent && (
                  <WaitingForTransactionMessage
                    txHash={this.state.txBeingSent}
                  />
                )}

                {this.state.transactionError && (
                  <TransactionErrorMessage
                    message={this._getRpcErrorMessage(
                      this.state.transactionError
                    )}
                    dismiss={() => this._dismissTransactionError()}
                  />
                )}
              </div>
            </div>
            <div className="row">
              <div className="col-12">
                <LuckyStaker
                  balance={this.state.balance}
                  currentEpoch={this.state.currentEpoch}
                  totalStaked={this.state.totalStaked}
                  nextDrawTime={this.state.nextDrawTime}
                  drawFunction={this._drawWinner}
                  txBeingSent={this.state.txBeingSent}
                  assignPrize={this._assignPrize}
                  stake={this._stake}
                  unstake={this._unstake}
                  withdraw={this._withdraw}
                  userStaked={this.state.userStaked}
                  userUnstaked={this.state.userUnstaked}
                  userWithdrawEpoch={this.state.userWithdrawEpoch}
                  userWithdrawable={this.state.userWithdrawable}
                  stakingHelperAddress={MAINNET.stakingHelperAddress.toString()}
                  sweepStakesAddress={MAINNET.sweepstakesAddress.toString()}
                  selectedAddress={this.state.selectedAddress}
                  lastWinner={this.state.lastWinner}
                  lastPrize={this.state.lastPrize}
                  ownerOf={this._ownerOf}
                />
              </div>
            </div>
          </div>
          <Socials />
        </div>

      </>
    );
  }

  async componentDidMount() {
    await this._checkNetwork();
    this._switchChain = this._switchChain.bind(this);
    this._drawWinner = this._drawWinner.bind(this);
    this._assignPrize = this._assignPrize.bind(this);
    this._stake = this._stake.bind(this);
    this._unstake = this._unstake.bind(this);
    this._withdraw = this._withdraw.bind(this);
    this._ownerOf = this._ownerOf.bind(this);
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (this.state.networkError === undefined) {
      this._initialize(selectedAddress);
    }

    window.ethereum.on("chainChanged", (chainId) => {
      this._stopPollingData();
      this._resetState();
      this._connectWallet();
    });

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      this._resetState();
      this._initialize(newAddress);
    });
  }

  async _initialize(userAddress) {
    this.setState({
      selectedAddress: userAddress,
    });
    await this._checkNetwork();

    try {
      await this._initializeEthers();
      this._startPollingData();
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  }

  async _initializeEthers() {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    await this._provider.getNetwork();

    this._sweepstakes = new ethers.Contract(
      MAINNET.sweepstakesAddress,
      sweepstakesAtrifact.abi,
      this._provider.getSigner(0)
    );

    this._stakingHelper = new ethers.Contract(
      MAINNET.stakingHelperAddress,
      stakingHelperAtrifact.abi,
      this._provider.getSigner(0)
    );
  }

  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateData(), 10000);

    this._updateData();
  }

  async _updateData() {
    await this._getNextDrawTime();
    await this._getTotalStaked();
    await this._updateBalance();
    await this._getCurrentEpoch();
    await this._getUserStaked();

  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _getTotalStaked() {
    let totalStaked = await this._sweepstakes.totalStaked();
    totalStaked = ethers.utils.formatEther(totalStaked);
    totalStaked = parseFloat(totalStaked).toFixed(0);
    this.setState({ totalStaked });
  }

  async _getNextDrawTime() {
    const prizeAssigned = await this._sweepstakes.prizeAssigned();
    if (!prizeAssigned) {
      this.setState({ nextDrawTime: "assignPrize" });
    } else {
      const lastDrawTime = await this._sweepstakes.lastDrawTime();
      const drawPeriod = await this._sweepstakes.drawPeriod();
      const nextDraw = parseInt(lastDrawTime) + parseInt(drawPeriod);

      //convert to date
      const nextDrawTime = new Date(nextDraw * 1000).getTime();
      this.setState({ nextDrawTime: nextDrawTime });
    }
  }

  async _getCurrentEpoch() {
    const epoch = await this._stakingHelper.epoch();
    const currentEpoch = parseInt(epoch.toString());
    this.setState({ currentEpoch });
  }

  async _getUserStaked() {
    const tokenCount = await this._sweepstakes.balanceOf(
      this.state.selectedAddress
    );
    if (tokenCount.toString() !== "0") {
      const tokenid = await this._sweepstakes.tokenOfOwnerByIndex(
        this.state.selectedAddress,
        0
      );
      this.setState({ userTokenId: tokenid.toString() });
      const token = await this._sweepstakes.tokenIdToInfo(tokenid.toString());
      const staked = token.staked;
      const unstaked = token.unstaked;
      const withdrawEpoch = parseInt(token.withdrawEpoch);
      if (parseInt(token.withdrawEpoch) < this.state.currentEpoch) {
        const withdrawable = token.unstaked;
        this.setState({ userWithdrawable: withdrawable.toString() });
      }
      this.setState({ userStaked: staked.toString() });
      this.setState({ userUnstaked: unstaked.toString() });
      this.setState({ userWithdrawEpoch: withdrawEpoch });
    }
  }

  async _updateBalance() {
    let balance = await this._provider.getBalance(this.state.selectedAddress);
    balance = ethers.utils.formatEther(balance);
    balance = parseFloat(balance).toFixed(2);
    this.setState({ balance });
  }

  async _ownerOf(tokenId) {
    const owner = await this._sweepstakes.ownerOf(tokenId);
    return owner;
  }

  async _drawWinner() {
    await this._sendTransaction("Draw", async () => {
      return await this._sweepstakes.drawWinner();
    });
  }

  async _assignPrize() {
    await this._sendTransaction("Assign prize", async () => {
      return await this._sweepstakes.assignPrize();
    });
  }

  async _stake(amount) {
    const stake = ethers.utils.parseEther(amount.toString());
    if (this.state.userTokenId === undefined) {
      //enter the draw and mint a token
      await this._sendTransaction("Stake", async () => {
        return await this._stakingHelper.enter(stake, { value: stake });
      });
    } else {
      await this._sendTransaction("Stake", async () => {
        return await this._stakingHelper.addToToken(
          stake,
          this.state.userTokenId,
          {
            value: stake,
          }
        );
      });
    }
  }

  async _unstake(amount, isMax) {
    let toUnstake = 0;
    if (isMax) {
      toUnstake = this.state.userStaked;
    } else {
      toUnstake = ethers.utils.parseEther(amount.toString());
    }
    await this._sendTransaction("Unstake", async () => {
      return await this._stakingHelper.unstake(
        toUnstake,
        this.state.userTokenId
      );
    });
  }

  async _withdraw() {
    await this._sendTransaction("Withdraw", async () => {
      return await this._sweepstakes.withdraw(this.state.userTokenId);
    });
  }

  async _sendTransaction(name, transaction) {
    try {
      this._dismissTransactionError();
      const tx = await transaction();
      this.setState({ txBeingSent: name });
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      await this._updateData();
    } catch (error) {
      if (error.code === ERROR_CODE_TX_REJECTED_BY_USER) {
        return;
      }

      console.error(error);
      this.setState({ transactionError: error });
    } finally {
      this.setState({ txBeingSent: undefined });
    }
  }

  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  async _addChain() {
    const chainIdHex = `0x${MAINNET.ID.toString(16)}`;
    await window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: chainIdHex,
          chainName: MAINNET.chainName,
          nativeCurrency: MAINNET.nativeCurrency,
          rpcUrls: MAINNET.rpcUrls,
          blockExplorerUrls: MAINNET.blockExplorerUrls,
        },
      ],
    });
  }

  async _switchChain() {
    await this._addChain();
    const chainIdHex = `0x${MAINNET.ID.toString(16)}`;
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    await this._initialize(this.state.selectedAddress);
  }

  async _checkNetwork() {
    await window.ethereum
      .request({
        method: "eth_chainId",
      })
      .then((chainId) => {
        if (chainId !== `0x${MAINNET.ID.toString(16)}`) {
          this.setState({
            networkError: "Please switch to the Harmony Mainnet",
          });
        } else {
          this.setState({ networkError: undefined });
        }
      });
  }
}