import React, { useState } from "react";
import { ethers } from "ethers";
import { TransactionButton } from "./TransactionButton";

export function UnstakeForm({ userStaked, userUnstaked, userWithdrawable, unstake, withdraw, txBeingSent }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic for Enter option
    // ...
  };

  const [tickets, setTickets] = useState(0);
  const [max, setMax] = useState(false);
  
  const readableStaked = userStaked ? ethers.utils.formatEther(userStaked) : 0

  const handleTicketsChange = (event) => {
    setTickets(event.target.value);
  };

  const handleMaxClick = () => {
    setTickets(readableStaked);
    setMax(true);
  };

  const handleUnstakeClick = () => {
    unstake(tickets, max);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-12">
          <div className="form-group" id="form">
            <label htmlFor="tickets">How much do you want to unstake?</label>
            <span className="float-right">Staked: {readableStaked} ONE</span>
            <div className="input-group">
              <input
                type="number"
                className="form-control"
                id="tickets"
                max={userStaked}
                step="any"
                placeholder="Unstake"
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
      <TransactionButton txBeingSent={txBeingSent} loadingText={"Unstake"} functionToCall={handleUnstakeClick} buttonText={"Unstake " + tickets + " ONE"} />
    </form>
  );
}
