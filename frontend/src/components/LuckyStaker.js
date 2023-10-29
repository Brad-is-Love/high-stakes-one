import React, { useState } from "react";
import { TransactionButton } from "./TransactionButton";
import { EnterForm } from "./EnterForm";
import { UnstakeForm } from "./UnstakeForm";
import { WithdrawForm } from "./WithdrawForm";
import { Prizes } from "./Prizes";
import { LuckyStakerRules } from "./LuckyStakerRules";

export function LuckyStaker({balance, currentEpoch, totalStaked, nextDrawTime, drawFunction, txBeingSent, assignPrize, stake, unstake, withdraw, userStaked, userUnstaked, userWithdrawable, userWithdrawEpoch, stakingHelperAddress, sweepStakesAddress, selectedAddress, lastWinner, lastPrize}) {

//run countdown timer every second
  React.useEffect(() => {
    calculateCountdown();
  });

  const readableWinner = lastWinner ? lastWinner : "";
  const readablePrize = lastPrize ? lastPrize.toFixed(2) : "";

  const [selectedOption, setSelectedOption] = useState("enter");
  //date states
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [min, setMin] = useState("");
  const [drawButton, setDrawButton] = useState(false);

  const calculateCountdown = () => {
    const endDate = nextDrawTime;
    const now = new Date()
    const timeLeft = endDate - now;

    if (isNaN(timeLeft) || timeLeft <= 0) {
      setDays("");
      setHours("");
      setMin("");
      setDrawButton(true);
      return;
    }
    setDrawButton(false)
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    if(days === 0){
      setDays("");
    } else {
      setDays(days + " days");
    }
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    if(days === 0 && hours === 0){
      setHours("");
    } else {
      setHours(hours + " hours");
    }
    const min = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    if(days === 0 && hours === 0 && min === 0){
      setMin("");
    } else {
      setMin(min + " min");
    }
  }

  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  let formComponent;

  if (selectedOption === "enter") {
    formComponent = (
      <EnterForm balance={balance} stake={stake} txBeingSent={txBeingSent} userStaked={userStaked}/>
    );
  } else if (selectedOption === "unstake") {
    formComponent = (
      <UnstakeForm  userStaked={userStaked} unstake={unstake} txBeingSent={txBeingSent}/>
    );
  } else if (selectedOption === "withdraw") {
    formComponent = (
      <WithdrawForm currentEpoch={currentEpoch} userStaked={userStaked} withdraw={withdraw} txBeingSent={txBeingSent} userUnstaked={userUnstaked} userWithdrawable={userWithdrawable} userWithdrawEpoch={userWithdrawEpoch}/>
    );
  } else if (selectedOption === "prizes") {
    formComponent = (
      <Prizes lastWinner={readableWinner} lastPrize={readablePrize}/>
    );
  }

  const data = {
    winner: "me",
    amount: "100",
    hash: "123",
    send: "true"
  }

  const url = 'https://script.google.com/macros/s/AKfycbzsfTPOPMw0UUAE_1BXvV7dIl6KTvXlXV0NTd6e-YESx7WMHnmrh6AxsBC4u7sLaRQB/exec?'+'winner='+data.winner+'&amount='+data.amount+'&hash='+data.hash+'&send='+data.send

  return (
    <>
      <div className="card p-4 mb-5 mt-1">
        <div className="row">
          <div className="col-12">
            <h4 className="text-center">Sweepstakes</h4>
            <a href={url}>test api</a>
            <p className="text-md-center">
              Stake in a pool with other players. A lucky winner
              gets the rewards!
            </p>
          </div>
        </div>
        <div className="row pb-2">
          <div className="col-md-6">
            <h6>Staked on High Stakes: {totalStaked} ONE</h6>
          </div>
          <div className="col-md-6 text-md-right">
            {lastWinner ? (<p><strong>{readableWinner}</strong> won <strong>{readablePrize}</strong></p>) : drawButton ? (
              nextDrawTime === "assignPrize" ? (
                <TransactionButton
                  txBeingSent={txBeingSent}
                  loadingText={"Assign prize"}
                  functionToCall={assignPrize}
                  buttonText={"Reveal Winner"}
                />
              ) : (
                <TransactionButton
                  txBeingSent={txBeingSent}
                  loadingText={"Draw"}
                  functionToCall={drawFunction}
                  buttonText={"Draw!"}
                />
              )
            ) : (
              <h6>
                Next draw in: {days} {hours} {min}
              </h6>
            )}
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
              selectedOption === "unstake"
                ? "btn-primary"
                : "btn-outline-primary"
            }`}
            onClick={() => handleOptionChange("unstake")}
          >
            Unstake
          </button>
          <button
            type="button"
            className={`btn ${
              selectedOption === "withdraw"
                ? "btn-primary"
                : "btn-outline-primary"
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
      <LuckyStakerRules
        stakingHelperAddress={stakingHelperAddress}
        sweepStakesAddress={sweepStakesAddress}
      />
    </>
  );
}
