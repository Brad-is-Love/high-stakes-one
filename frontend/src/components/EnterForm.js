import React, { useState } from "react";
import { TransactionButton } from "./TransactionButton";
import { ethers } from "ethers";

export function EnterForm({ balance, stake, txBeingSent, userStaked }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic for Enter option
    // ...
  };

  const [tickets, setTickets] = useState("");
  const [msgDisplay, setMsgDisplay] = useState("none");
  const [msg, setMsg] = useState("");

  const stakedByUser = userStaked ? ethers.utils.formatEther(userStaked) : 0;
  const userMax = balance - 1
  const maxTickets = userMax

  const handleTicketsChange = (event) => {
    setTickets(event.target.value);
    if(event.target.value < maxTickets){
      setMsgDisplay("none");
    } else {
      // commented out for alpha
      setMsgDisplay("block");
    }
  };

  const handleMaxClick = () => {
    if(userMax < 20){
      setMsg("You need at least 20 ONE to stake.")
    } else {
      setTickets(maxTickets);
      setMsg("We saved you ONE for gas.")
    }
    setMsgDisplay("block");
  };

  const handleStakeClick = () => {
    if(tickets < 20){
      setMsg("You need to stake at least 20 ONE.")
      setMsgDisplay("block");
      return;
    }
    stake(tickets);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row">
        <div className="col-12">
          <div className="form-group" id="form">
            {/* <p>How much do you want to stake?</p> */}
            <span className="float-right"><p className="mb-1">Balance: {balance} ONE</p></span>
            <div className="input-group">
              <input
                type="number"
                className="form-control"
                id="tickets"
                min={20}
                max={maxTickets}
                step="any"
                placeholder="Min 20 ONE"
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
                  All In!
                </button>
              </div>
            </div>
            <div style={{ display: msgDisplay, fontSize: "small", color: "blue", width: "100%" }}>
              {msg}
            </div>
          </div>
        </div>
      </div>
      {/* div with centered content */}
      <div className="text-center text-md-left pt-2">
          <TransactionButton txBeingSent={txBeingSent} loadingText={"Stake"} functionToCall={handleStakeClick} buttonText={"Stake " + tickets + " ONE to enter"} />
      </div>
    </form>
  );
}
