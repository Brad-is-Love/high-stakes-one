import React from "react";

export function Prizes({ winners, loading, latestBlock, lowestBlock, getData }) {

  return (
    <>
      <div className="row">
        <div className="col-12">
          <h4>Last Winners</h4>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Winner</th>
                  <th>Prize</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((winner, index) => {
                  return (
                    <tr key={index}>
                      <td>{winner.date}</td>
                      <td>{winner.winner}</td>
                      <td>{winner.amount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button className="btn btn-primary" onClick={getData}>
            Load More
          </button>
        </div>
      </div>
      {/* div with centered content */}
    </>
  );
}
