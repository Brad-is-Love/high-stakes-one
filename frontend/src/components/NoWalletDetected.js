import React from "react";

export function NoWalletDetected() {
  return (
    <div className="connectWalletBackground d-flex align-items-center justify-content-center">
      <div className="container bg-white shadow rounded">
        <div className="row justify-content-md-center">
          <div className="col-6 p-4 text-center">
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
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
