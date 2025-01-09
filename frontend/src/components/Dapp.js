// src/components/Dapp.js
import React, { useContext } from "react";
import { Web3Context } from "../contexts/web3Context";

import { NoWalletDetected } from "./NoWalletDetected";
// import { ConnectWallet } from "./ConnectWallet";
// import { Loading } from "./Loading";
import { TransactionErrorMessage } from "./TransactionErrorMessage";
import { WaitingForTransactionMessage } from "./WaitingForTransactionMessage";
import { Nav } from "./Nav";
import { Socials } from "./Socials";
import { GamesWrapper } from "./GamesWrapper";

export const Dapp = () => {
  const {
    selectedAddress,
    txBeingSent,
    transactionError,
  } = useContext(Web3Context);


  if (typeof window.ethereum === "undefined") {
    return (
      <>
        <NoWalletDetected />
        <Socials />
      </>
    );
  }

  // if (balance === undefined) {
  //   return <Loading />;
  // }

  return (
    <>
      <div className="background"></div>
      <Nav selectedAddress={selectedAddress} />
      <div className="app mt-md-5">
        <div className="container p-3 mt-2">
          <div className="row my-1">
            <div className="col-12">
              {txBeingSent && (
                <WaitingForTransactionMessage txHash={txBeingSent} />
              )}

              {transactionError && (
                <TransactionErrorMessage
                  message={transactionError.message}
                  dismiss={() => {} /* Implement dismiss logic if needed */}
                />
              )}
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <GamesWrapper />
            </div>
          </div>
        </div>
        <Socials />
      </div>
    </>
  );
};
