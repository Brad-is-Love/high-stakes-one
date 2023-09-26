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


const TESTNET_ID = "1666700000";
const ERROR_CODE_TX_REJECTED_BY_USER = 4001;

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    this.initialState = {
      tokenData: undefined,
      
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
      return <NoWalletDetected />;
    }

    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    if (!this.state.tokenData || !this.state.balance) {
      return <Loading />;
    }

    return (
      <>
        <div className="background"></div>
        <Nav selectedAddress={this.state.selectedAddress} />
        <div className="app bg-light">
        <div className="container p-3 mt-2">
        
          <div className="row my-1">
            <div className="col-12">
              {this.state.txBeingSent && (
                <WaitingForTransactionMessage txHash={this.state.txBeingSent} />
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

          <div className="row ">
            <div className="col-12">
                <LuckyStaker
                  transferTokens={(to, amount) =>
                    this._transferTokens(to, amount)
                  }
                  tokenSymbol={this.state.tokenData.symbol}
                />
            </div>
          </div>
        </div>
        </div>
      </>
    );
  }

  async componentDidMount() {
    this._connectWallet();
  }

  componentWillUnmount() {
    this._stopPollingData();
  }

  async _connectWallet() {
    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    await this._checkNetwork();

    this._initialize(selectedAddress);

    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();

      if (newAddress === undefined) {
        return this._resetState();
      }

      this._initialize(newAddress);
    });
  }

  async _initialize(userAddress) {
    this.setState({
      selectedAddress: userAddress,
    });
  
    try {
      await this._initializeEthers();
      console.log("address: ", sweepstakesAddress.address);
      console.log("abi: ", sweepstakesAtrifact.abi);

      await this._getTokenData();
      this._startPollingData();
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  }
  

  async _initializeEthers() {
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    await this._provider.getNetwork();

    this._sweepstakes= new ethers.Contract(
      sweepstakesAddress.address,
      sweepstakesAtrifact.abi,
      this._provider.getSigner(0)
    );

    console.log("sweepstakes: ", this._sweepstakes);
  }


  _startPollingData() {
    this._pollDataInterval = setInterval(() => this._updateBalance(), 50000);

    this._updateBalance();
  }

  _stopPollingData() {
    clearInterval(this._pollDataInterval);
    this._pollDataInterval = undefined;
  }

  async _getTokenData() {
    const name = await this._sweepstakes.name();
    const symbol = await this._sweepstakes.symbol();

    this.setState({ tokenData: { name, symbol } });
  }

  async _updateBalance() {
    const balance = await this._sweepstakes.balanceOf(this.state.selectedAddress);
    this.setState({ balance });
  }

  async _transferTokens(to, amount) {
    try {
      this._dismissTransactionError();
      const tx = await this._sweepstakes.transfer(to, amount);
      this.setState({ txBeingSent: tx.hash });
      const receipt = await tx.wait();

      if (receipt.status === 0) {
        throw new Error("Transaction failed");
      }

      await this._updateBalance();
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

  async _switchChain() {
    const chainIdHex = `0x${HARDHAT_NETWORK_ID.toString(16)}`;
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    await this._initialize(this.state.selectedAddress);
  }

  // This method checks if the selected network is Localhost:8545
  _checkNetwork() {
    if (window.ethereum.networkVersion !== HARDHAT_NETWORK_ID) {
      this._switchChain();
    }
  }
}
