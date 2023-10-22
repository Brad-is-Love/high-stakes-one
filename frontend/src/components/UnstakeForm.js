import React, { useState } from "react";
import { ethers } from "ethers";
import { TransactionButton } from "./TransactionButton";

export function UnstakeForm({ userStaked, userUnstaked, userWithdrawable, unstake, withdraw, txBeingSent }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic for Enter option
    // ...
  };

  const [tickets, setTickets] = useState("");
  const [max, setMax] = useState(false);
  
  const readableStaked = userStaked ? parseFloat(ethers.utils.formatEther(userStaked)).toFixed(2) : 0

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
            <span className="float-right"><p className="mb-1">Staked: {readableStaked} ONE</p></span>
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
      <div className="text-center text-md-left pt-2">
        <TransactionButton txBeingSent={txBeingSent} loadingText={"Unstake"} functionToCall={handleUnstakeClick} buttonText={"Unstake " + tickets + " ONE"} />
      </div>
    </form>
  );
}
