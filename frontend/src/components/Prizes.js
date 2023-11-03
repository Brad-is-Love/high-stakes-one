import React from "react";

export function Prizes({ selectedAddress, sweepstakesAddress }) {
  React.useEffect(() => {
    fetch();
  });

  let headers = new Headers();
  headers.set("Authorization", "Bearer cqt_rQWwWcRTh4PD8MF7tCW8wFXxvvVJ");

  fetch(
    `https://api.covalenthq.com/v1/harmony-mainnet/address/${sweepstakesAddress}/transactions_v3/page/1/?`,
    { method: "GET", headers: headers }
  )
    .then((resp) => resp.json())
    .then((data) => console.log(data));

  return (
    <>
      <div className="row">
        <div className="col-12">
          <h4>Last Winners</h4>
          <p></p>
        </div>
      </div>
      {/* div with centered content */}
    </>
  );
}
