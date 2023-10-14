import React from "react";

import { NetworkErrorMessage } from "./NetworkErrorMessage";

function ConnectDiv({ connectWallet, networkError, dismiss, switchChain }) {
  if (networkError) {
    return (
      <div className="col-12 p-4 text-center">
        <p className="text-danger">{networkError}</p>
        <button
        className="btn btn-warning"
        type="button"
        onClick={switchChain}
      >
        Switch to Harmony
      </button>
      </div>
    );
  } else {
    return (
      <div className="col-12 p-4 text-center">
      <p>Connect your wallet to enter.</p>
      <button
        className="btn btn-warning"
        type="button"
        onClick={connectWallet}
      >
        Connect Wallet
      </button>
    </div>
    );
  }
}


export function ConnectWallet({ connectWallet, networkError, dismiss, switchChain }) {
  return (
    <div className="connectWalletBackground d-flex align-items-center justify-content-center">
      <div className="container bg-white shadow rounded" style={{maxWidth: "500px"}}>
        <div className="row justify-content-center">
            {/* {networkError && (

            )} */}
            <ConnectDiv connectWallet={connectWallet} networkError={networkError} dismiss={dismiss} switchChain={switchChain} />

        </div>
      </div>
    </div>
  );
}
