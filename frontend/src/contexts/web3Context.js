// Web3Context.js
import React, { createContext, useState, useEffect } from "react";
import web3Service from "../services/web3Service";

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [selectedAddress, setSelectedAddress] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [networkError, setNetworkError] = useState(undefined);
  const [txBeingSent, setTxBeingSent] = useState(undefined);
  const [transactionError, setTransactionError] = useState(undefined);
  
  // Initialize Web3
  useEffect(() => {
    const init = async () => {
      try {
        await web3Service.initialize();
        // const address = await web3Service.connectWallet();
        // setSelectedAddress(address);
        // const userBalance = await web3Service.getBalance(address);
        // setBalance(userBalance);
      } catch (error) {
        console.error(error);
        setNetworkError(error.message);
      }
    };
    init();

    // Handle account and network changes
    web3Service.handleAccountChanges(async (accounts) => {
      if (accounts.length > 0) {
        setSelectedAddress(accounts[0]);
        const userBalance = await web3Service.getBalance(accounts[0]);
        setBalance(userBalance);
      } else {
        setSelectedAddress(undefined);
        setBalance(undefined);
      }
    });

    web3Service.handleNetworkChanges(async (chainId) => {
      // Implement your network change logic
      // For example, verify if the user is on the correct network
    });

    return () => {
      // Cleanup listeners if necessary
    };
  }, []);

  const connectWallet = async () => {
    try {
      const address = await web3Service.connectWallet();
      setSelectedAddress(address);
      const userBalance = await web3Service.getBalance(address);
      setBalance(userBalance);
    } catch (error) {
      console.error(error);
      setNetworkError(error.message);
    }
  };

  // Define functions to interact with Web3
  const drawWinner = async () => {
    try {
      setTxBeingSent("Draw Winner");
      const tx = await web3Service.drawWinner();
      await tx.wait();
      // Update state as needed
    } catch (error) {
      setTransactionError(error);
    } finally {
      setTxBeingSent(undefined);
    }
  };

  const assignPrize = async () => {
    try {
      setTxBeingSent("Assign Prize");
      const tx = await web3Service.assignPrize();
      await tx.wait();
      // Update state as needed
    } catch (error) {
      setTransactionError(error);
    } finally {
      setTxBeingSent(undefined);
    }
  };

  const stake = async (amount, tokenId) => {
    try {
      setTxBeingSent("Stake");
      const tx = await web3Service.stake(amount, tokenId);
      await tx.wait();
      // Update state as needed
    } catch (error) {
      setTransactionError(error);
    } finally {
      setTxBeingSent(undefined);
    }
  }

  const unstake = async (amount, tokenId) => {
    try {
      setTxBeingSent("Unstake");
      const tx = await web3Service.unstake(amount, tokenId);
      await tx.wait();
      // Update state as needed
    } catch (error) {
      setTransactionError(error);
    } finally {
      setTxBeingSent(undefined);
    }
  }

  const withdraw = async (tokenId) => {
    try {
      setTxBeingSent("Withdraw");
      const tx = await web3Service.withdraw(tokenId);
      await tx.wait();
      // Update state as needed
    } catch (error) {
      setTransactionError(error);
    } finally {
      setTxBeingSent(undefined);
    }
  }


  return (
    <Web3Context.Provider
      value={{
        selectedAddress,
        balance,
        networkError,
        txBeingSent,
        transactionError,
        connectWallet,
        drawWinner,
        assignPrize,
        stake,
        unstake,
        withdraw,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};
