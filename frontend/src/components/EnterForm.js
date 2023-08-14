import React, { useState } from "react";

export function EnterForm({ transferTokens, tokenSymbol }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic for Enter option
    // ...
  };

  const [tickets, setTickets] = useState(0);

  const handleTicketsChange = (event) => {
    setTickets(event.target.value);
  };

  const handleMaxClick = () => {
    setTickets(9874.148);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-12">
          <div className="form-group">
            <label htmlFor="tickets">How much do you want to stake?</label>
            <div className="input-group">
              <input
                type="number"
                className="form-control"
                id="tickets"
                placeholder="Min 100 ONE"
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
      </div>
      <button type="submit" className="btn btn-primary">
        Stake {tickets} ONE to enter
      </button>
    </form>
  );
}
