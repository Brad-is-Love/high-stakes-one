import React, { useState } from "react";
import { TransactionButton } from "./TransactionButton";

export function EnterForm({ balance, stake, txBeingSent }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic for Enter option
    // ...
  };

  const [tickets, setTickets] = useState("");
  const [msgDisplay, setMsgDisplay] = useState("none");

  const handleTicketsChange = (event) => {
    setTickets(event.target.value);
    if(event.target.value < balance - 1){
      setMsgDisplay("none");
    } else {
      setMsgDisplay("block");
    }
  };

  const handleMaxClick = () => {
    setTickets(balance - 1);
    //add message after form
    setMsgDisplay("block");
  };

  const handleStakeClick = () => {
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
                min={100}
                max={balance - 1}
                step="any"
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
                  All In!
                </button>
              </div>
            </div>
            <div style={{ display: msgDisplay, fontSize: "small", color: "blue", width: "100%" }}>
              We saved you 1 ONE for future gas.
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
