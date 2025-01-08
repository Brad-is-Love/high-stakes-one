import React, { useState } from "react";
import { LuckyStaker } from "./LuckyStaker";

export function GamesWrapper({
  balance,
  currentEpoch,
  totalStaked,
  nextDrawTime,
  drawPeriod,
  nextPrize,
  nextPrizePct,
  drawFunction,
  txBeingSent,
  assignPrize,
  stake,
  unstake,
  withdraw,
  userStaked,
  userUnstaked,
  userWithdrawable,
  userWithdrawEpoch,
  stakingHelperAddress,
  sweepStakesAddress,
  selectedAddress,
}) {
  const [selectedOption, setSelectedOption] = useState("ONE");
  //date states

  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  let formComponent;

  if (selectedOption === "ONE") {
    formComponent = (
      <LuckyStaker
        balance={balance}
        currentEpoch={currentEpoch}
        totalStaked={totalStaked}
        nextDrawTime={nextDrawTime}
        drawPeriod={drawPeriod}
        nextPrize={nextPrize}
        nextPrizePct={nextPrizePct}
        drawFunction={drawFunction}
        txBeingSent={txBeingSent}
        assignPrize={assignPrize}
        stake={stake}
        unstake={unstake}
        withdraw={withdraw}
        userStaked={userStaked}
        userUnstaked={userUnstaked}
        userWithdrawEpoch={userWithdrawEpoch}
        userWithdrawable={userWithdrawable}
        stakingHelperAddress={stakingHelperAddress}
        sweepStakesAddress={sweepStakesAddress}
        selectedAddress={selectedAddress}
      />
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
