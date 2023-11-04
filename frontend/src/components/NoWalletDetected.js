import React from "react";
import { Description } from "./Description";

export function NoWalletDetected() {
  return (
    <>
    <div className="connectWalletBackground"></div>
      <div className="d-flex align-items-center justify-content-center flex-column p-3">
      <Description />
      <div className="container bg-white shadow rounded mx-4">
          <div className="col-12 p-3 text-center">
            <p>
              No wallet was detected. <br />
              Please install{" "}
              <a
                href="http://metamask.io"
                target="_blank"
                rel="noopener noreferrer"
              >
                MetaMask
              </a>
              . <br />
              Or another wallet of your choice.
            </p>
        </div>
      </div>
      
    </div>
    </>
  );
}
