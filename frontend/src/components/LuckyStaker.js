import React, { useState } from "react";
import { ethers } from "ethers"; 
import { TransactionButton } from "./TransactionButton";
import { EnterForm } from "./EnterForm";
import { UnstakeForm } from "./UnstakeForm";
import { WithdrawForm } from "./WithdrawForm";
import { Prizes } from "./Prizes";
import { LuckyStakerRules } from "./LuckyStakerRules";


export function LuckyStaker({balance, currentEpoch, totalStaked, nextDrawTime, drawPeriod, nextPrize, nextPrizePct, drawFunction, txBeingSent, assignPrize, stake, unstake, withdraw, userStaked, userUnstaked, userWithdrawable, userWithdrawEpoch, stakingHelperAddress, sweepStakesAddress, selectedAddress, ownerOf}) {

//run countdown timer every second
  React.useEffect(() => {
    calculateCountdown();
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedOption, setSelectedOption] = useState("enter");
  //date states
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [min, setMin] = useState("");
  const [drawButton, setDrawButton] = useState(false);

  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);

  const staked = userStaked ? parseFloat(ethers.utils.formatEther(userStaked)).toFixed(2) : 0;
  const yourOddsInverted = totalStaked/staked;
  const yourOdds = "1/" + yourOddsInverted.toFixed(0);
  //get the next prize amount
  const secondsInAYear = 24*60*60*365;
  const nextPrizeCalc = ((drawPeriod/secondsInAYear) * (0.075 * totalStaked * nextPrizePct/100) + nextPrize)*0.96;

  const GRAPHQL_ENDPOINT = 'https://indexer.dev.hyperindex.xyz/1a7fc84/v1/graphql'
  const headers = {
    'Content-Type': 'application/json',
  }
  const graphqlQuery = {
    query: `
      query MyQuery {
        SweepStakesNFTs_WinnerAssigned(
          order_by: {timestamp: desc}
          where: {timestamp: {_gt: 1698692165}}
        ) {
          winnerAddress
          _amount
          winnerBalance
          totalBalance
          timestamp
        }
      }
    `
  };
  const isNarrowScreen = window.innerWidth < 992;

  const getData = async () => {
    setLoading(true);
    try {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(graphqlQuery),
      });
      const data = await response.json();
      const events = data.data.SweepStakesNFTs_WinnerAssigned;
      const newWinners = events.map(event => ({
        winner: event.winnerAddress.toLowerCase() === selectedAddress.toLowerCase() 
          ? "YOU!" :
          isNarrowScreen
            ? `${event.winnerAddress.slice(0, 4)}...${event.winnerAddress.slice(-4)}`
            : event.winnerAddress,
        amount: event._amount.toString().slice(0,-18)+"."+event._amount.toString().slice(-18,-16),
        date: new Date(event.timestamp*1000).toISOString().slice(0, 10),
        odds: "1/" + (event.totalBalance / event.winnerBalance).toFixed(0)
      }));
  
      setWinners([...newWinners]);

    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };


  const calculateCountdown = () => {
    const endDate = nextDrawTime;
    const now = new Date()
    const timeLeft = endDate - now;

    if (isNaN(timeLeft) || timeLeft <= 0) {
      setDays("");
      setHours("");
      setMin("");
      // setDrawButton(true);
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
      <Prizes selectedAddress={selectedAddress} winners={winners} loading={loading} getData={getData}/>
    );
  }

  return (
    <>
      <div className="card p-4 mb-5 mt-1">
        <div className="row">
          <div className="col-md-6 pb-4">
            <h3>Sweepstakes</h3>
            <div className="staker-headers">
              Stake your ONE in a pool.
            </div>
            <div className="staker-headers"> 
              A daily winner scoops the rewards!
            </div>
            <div className="staker-headers">Staked on High Stakes: <strong>{totalStaked} ONE</strong></div>
          </div>
          <div className="col-md-6  pb-4 text-md-right">
          <div className="staker-headers">Your Stake: <strong>{staked} ONE</strong></div>
          {<div className="staker-headers">Your Chances: <strong>{userStaked > 0 ? yourOdds : "Gotta be in to win!"}</strong></div>}
          <div className="staker-headers">Next Prize: ~<strong>{nextPrizeCalc.toFixed(0)} ONE</strong></div>
            {drawButton ? (
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
              <div className="staker-headers">
                Next draw in: <strong>{days} {hours} {min}</strong>
              </div>
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
