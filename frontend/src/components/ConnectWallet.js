import React from "react";

import { NetworkErrorMessage } from "./NetworkErrorMessage";

export function ConnectWallet({ connectWallet, networkError, dismiss }) {
  return (
    <div className="connectWalletBackground d-flex align-items-center justify-content-center">
      <div className="container bg-white shadow rounded" style={{maxWidth: "500px"}}>
        <div className="row justify-content-center">
          <div className="col-12 text-center">
            {/* Wallet network should be set to Localhost:8545. */}
            {networkError && (
              <NetworkErrorMessage message={networkError} dismiss={dismiss} />
            )}
          </div>
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
        </div>
      </div>
    </div>
  );
}
