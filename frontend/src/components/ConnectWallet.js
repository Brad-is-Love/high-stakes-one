import React from "react";
import { Socials } from "./Socials";

function ConnectDiv({ connectWallet, networkError, dismiss, switchChain }) {
  if (networkError) {
    return (
      <div className="col-10 p-4 text-center">
        <p className="text-danger">{networkError}</p>
        <button className="btn btn-warning" type="button" onClick={switchChain}>
          Switch to Harmony
        </button>
      </div>
    );
  } else {
    return (
      <div className="col-10 p-4 text-center">
        <p className="text-md-center alpha-warn">
          *High Stakes is in Alpha Launch mode, some functionality may be
          limited, use at your own risk.
        </p>
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
          style={{ maxWidth: "500px" }}
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
