import React from "react";

export function Prizes({
  winners,
  loading,
  latestBlock,
  lowestBlock,
  getData,
}) {
  return (
    <>
      <div className="row text-center border-bottom">
        <div className="col-4">
          <h5>Date</h5>
        </div>
        <div className="col-4">
          <h5>Winner</h5>
        </div>
        <div className="col-4">
          <h5>Amount</h5>
        </div>
      </div>
        {winners.map((winner, index) => {
          return (
            <div key={index} className="row text-center py-2 border-bottom">
              <div className="col-4"><p>{winner.date}</p></div>
              <div className="col-4"><p>{winner.winner}</p></div>
              <div className="col-4"><p>{winner.amount}</p></div>
            </div>
          );
        })}
      <div className="row">
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
    </>
  );
}
