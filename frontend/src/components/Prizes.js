import React from "react";

export function Prizes({
  winners,
  loading,
  latestBlock,
  lowestBlock,
  getData,
}) {
  return (
    <div className=" prize-container">
      <div>
        <div className="row text-center py-2 prize-table border-top">
          <div className="col-4 col-md-2 px-0"><strong>Date</strong></div>
          <div className="col-4 col-md-6 px-0"><strong>Winner</strong></div>
          <div className="col-2 px-0"><strong>Prize</strong></div>
          <div className="col-2 px-0"><strong>Odds</strong></div>
        </div>
        {winners && winners.map((winner, index) => (
          <div key={index} className="row text-center py-2 prize-table border-top">
            <div className="col-4 col-md-2 px-0">{winner.date}</div>
            <div className="col-4 col-md-6 px-0">{winner.winner}</div>
            <div className="col-2 px-0">{winner.amount}</div>
            <div className="col-2 px-0">{winner.odds}</div>
          </div>
        ))}
        {winners.length === 0 && (
          <div className="row text-center py-2 prize-table border-top">
            <div className="col-12 px-0">Error loading prize data.</div>
          </div>
        )}
      </div>
      <div className="row pt-4 pl-4">
        {loading ? (
          <p>Loading...</p>
        ) : latestBlock > lowestBlock ? (
          <button className="btn btn-primary" onClick={getData}>
            Load More
          </button>
        ) : (
          <p>No more winners</p>
        )}
      </div>
    </div>
  );
}
