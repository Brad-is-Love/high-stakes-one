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
      {/* <div className="row text-center border-bottom prize-headers">
        <div className="col-4 px-0">
          <h5>Date</h5>
        </div>
        <div className="col-4 px-0">
          <h5>Winner</h5>
        </div>
        <div className="col-4 px-0">
          <h5>Amount</h5>
        </div>
      </div> */}
        {winners.map((winner, index) => {
          return (
            <div key={index} className="row text-center py-2 prize-table border-top">
              <div className="col-4 px-0">{winner.date}</div>
              <div className="col-4 px-0">{winner.winner}</div>
              <div className="col-4 px-0">{winner.amount}</div>
            </div>
          );
        })}
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
