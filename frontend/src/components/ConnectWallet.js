import React from "react";
import { Socials } from "./Socials";

function ConnectDiv({ connectWallet, networkError, switchChain }) {
  if (networkError) {
    return (
      <div className="col-10 p-3 text-center">
        <p className="text-danger">{networkError}</p>
        <button className="btn btn-warning" type="button" onClick={switchChain}>
          Switch to Harmony
        </button>
      </div>
    );
  } else {
    return (
      <div className="col-10 p-3 text-center">
        <p className="pb-3">Connect your wallet to enter.</p>
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

export function ConnectWallet({
  connectWallet,
  networkError,
  dismiss,
  switchChain,
}) {
  return (
    <>
      <div className="connectWalletBackground d-flex flex-column align-items-center justify-content-center px-3">
        <div
          className="card"
          style={{ width: "320px" }}
        >
          <div className="row justify-content-center">
            {/* {networkError && (

            )} */}
            <ConnectDiv
              connectWallet={connectWallet}
              networkError={networkError}
              dismiss={dismiss}
              switchChain={switchChain}
            />
          </div>
        </div>
        <Socials />
      </div>
    </>
  );
}
