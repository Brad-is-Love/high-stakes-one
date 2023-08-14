import React, { useState } from "react";
import { EnterForm } from "./EnterForm";
import { WithdrawForm } from "./WithdrawForm";
import { LuckyStakerRules } from "./LuckyStakerRules";

// PrizesForm component
const PrizesForm = ({ transferTokens, tokenSymbol }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic for Prizes option
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Prizes form specific fields and UI */}
    </form>
  );
};

// Transfer component
export function LuckyStaker({ transferTokens, tokenSymbol }) {
  const [selectedOption, setSelectedOption] = useState("enter");

  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  let formComponent;

  if (selectedOption === "enter") {
    formComponent = (
      <EnterForm transferTokens={transferTokens} tokenSymbol={tokenSymbol} />
    );
  } else if (selectedOption === "withdraw") {
    formComponent = (
      <WithdrawForm transferTokens={transferTokens} tokenSymbol={tokenSymbol} />
    );
  } else if (selectedOption === "prizes") {
    formComponent = (
      <PrizesForm transferTokens={transferTokens} tokenSymbol={tokenSymbol} />
    );
  }

  return (
    <>
    <div className="card p-4 mb-5 mx-5 mt-1">
      <div className="row">
        <div className="col-12 text-center">
          <h4>Sweepstakes</h4>
          <p>Stake in a pool with other players. A weekly draw determines who gets the rewards!</p>
        </div>
      </div>
      <div className="row pb-2">
        <div className="col-md-6">
          <h6>Next draw's prize pool: 789.15 ONE</h6>
        </div>
        <div className="col-md-6 text-md-right">
          <h6>Drawn in: 21:51:49</h6>
        </div>
      </div>
      <div className="btn-group pb-3">
        <button
          type="button"
          className={`btn ${
            selectedOption === "enter" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => handleOptionChange("enter")}
        >
          Enter
        </button>
        <button
          type="button"
          className={`btn ${
            selectedOption === "withdraw" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => handleOptionChange("withdraw")}
        >
          Withdraw
        </button>
        <button
          type="button"
          className={`btn ${
            selectedOption === "prizes" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => handleOptionChange("prizes")}
        >
          Prizes
        </button>
      </div>
      {formComponent}
      
    </div>
    <LuckyStakerRules/>
    </>
  );
}
