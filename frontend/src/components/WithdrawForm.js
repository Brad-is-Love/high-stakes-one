import React, { useState } from "react";

export function WithdrawForm({ transferTokens, tokenSymbol }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic for Enter option
    // ...
  };

  const [tickets, setTickets] = useState(0);
  const refund = 99.7;

  const handleTicketsChange = (event) => {
    setTickets(event.target.value);
  };

  const handleMaxClick = () => {
    setTickets(100);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-12">
          <div className="form-group">
            <label htmlFor="tickets">How much would you like to unstake?</label>
            <div className="input-group">
              <input
                type="number"
                className="form-control"
                id="tickets"
                placeholder="Enter no. of tickets"
                value={tickets}
                onChange={handleTicketsChange}
              />
              <div className="input-group-append">
                <button
                  type="button"
                  className="btn btn-primary"
                  id="max"
                  onClick={handleMaxClick}
                >
                  Max
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <p>Current ticket price: {refund} ONE</p>
        </div>
      </div>
      <button type="submit" className="btn btn-primary">
        Withdraw {Math.round(tickets * refund * 100) / 100} ONE
      </button>
    </form>
  );
}
