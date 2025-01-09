import React, { useState } from "react";
import { LuckyStaker } from "./LuckyStaker";

export function GamesWrapper() {
  const [selectedOption, setSelectedOption] = useState("ONE");
  //date states

  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  let formComponent;

  if (selectedOption === "ONE") {
    formComponent = (
      <LuckyStaker />
    );
  } else if (selectedOption === "ERC20") {
    formComponent = <h1>ERC20</h1>;
  }

  return (
    <>
      <div className="w-100">
        <div className="wrapper-group btn-group w-100">
          <button
            type="button"
            className={`btn ${
              selectedOption === "ONE" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => handleOptionChange("ONE")}
          >
            ONE
          </button>
          <button
            type="button"
            className={`btn ${
              selectedOption === "ERC20" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => handleOptionChange("ERC20")}
          >
            ERC20
          </button>
        </div>
        {formComponent}
      </div>
    </>
  );
}
