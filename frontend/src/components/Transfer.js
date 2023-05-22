import React, { useState } from "react";

// EnterForm component
const EnterForm = ({ transferTokens, tokenSymbol }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic for Enter option
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Enter form specific fields and UI */}
    </form>
  );
};

// WithdrawForm component
const WithdrawForm = ({ transferTokens, tokenSymbol }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle form submission logic for Withdraw option
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Withdraw form specific fields and UI */}
    </form>
  );
};

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
export function Transfer({ transferTokens, tokenSymbol }) {
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
    <div className="card p-3">
      <div className="row">
        <div className="col-12 text-center">
          <h4>Stake ONE to enter the lottery</h4>
        </div>
      </div>
      <div className="row pb-2">
        <div className="col-md-6">
          <h6>Current pot: 78,900 ONE</h6>
        </div>
        <div className="col-md-6 text-md-right">
          <h6>Drawn in: 241:51:49</h6>
        </div>
      </div>
      <div className="btn-group">
        <button
          type="button"
          className={`btn ${
            selectedOption === "enter" ? "btn-primary" : "btn-secondary"
          }`}
          onClick={() => handleOptionChange("enter")}
        >
          Enter
        </button>
        <button
          type="button"
          className={`btn ${
            selectedOption === "withdraw" ? "btn-primary" : "btn-secondary"
          }`}
          onClick={() => handleOptionChange("withdraw")}
        >
          Withdraw
        </button>
        <button
          type="button"
          className={`btn ${
            selectedOption === "prizes" ? "btn-primary" : "btn-secondary"
          }`}
          onClick={() => handleOptionChange("prizes")}
        >
          Prizes
        </button>
      </div>
      {formComponent}
    </div>
  );
}
