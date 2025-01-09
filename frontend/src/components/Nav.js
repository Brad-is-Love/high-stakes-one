import React, { useContext } from "react";
import { Web3Context } from "../contexts/web3Context";

export function Nav() {
  const { selectedAddress, connectWallet } = useContext(Web3Context);
  return (
    <>
      <div className="navbar navbar-expand-lg navbar-dark custom-nav-bg">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            High Stakes
          </a>
          {selectedAddress && (
            <span className="navbar-text text-white text-right">
              Welcome{" "}
              <b>
                {selectedAddress.slice(0, 4)}...
                {selectedAddress.slice(-4)}
              </b>
            </span>
          )}
          {!selectedAddress && (
            <button
              className="btn btn-warning"
              type="button"
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </>
  );
}
