import React from "react";
import { Description } from "./Description";

export function NoWalletDetected() {
  return (
    <>
      <div className="connectWalletBackground"></div>
      <div className="container">
      <Description />
      <div className="card m-sm-5">
        <div className="col-12 text-center">
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
