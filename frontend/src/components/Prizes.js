import React from "react";

export function Prizes({ selectedAddress, winners, loading, latestBlock, lowestBlock, getData }) {

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
                      <td><p>{winner.date}</p></td>
                      <td><p>{winner.winner}</p></td>
                      <td><p>{winner.amount}</p></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {loading ? <p>Loading...</p> : 
          latestBlock > lowestBlock ?
          <button className="btn btn-primary" onClick={getData}>
            Load More
          </button> : <p>No more winners</p>
          }
        </div>
      </div>
      {/* div with centered content */}
    </>
  );
}
