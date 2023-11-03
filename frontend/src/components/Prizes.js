import React from "react";

export function Prizes({ winners, loading, latestBlock, lowestBlock, getData }) {

  return (
    <>
      <div className="row">
        <div className="col-12">
            <h4>Last Prize</h4>
            <p>
                <strong>{lastPrize}</strong> was won by <strong>{lastWinner}</strong>
            </p>
        </div>
      </div>
      {/* div with centered content */}
    </>
  );
}
