import React, { useState } from "react";
import { ethers } from "ethers"; 
import { TransactionButton } from "./TransactionButton";
import { EnterForm } from "./EnterForm";
import { UnstakeForm } from "./UnstakeForm";
import { WithdrawForm } from "./WithdrawForm";
import { Prizes } from "./Prizes";
import { LuckyStakerRules } from "./LuckyStakerRules";


export function LuckyStaker({balance, currentEpoch, totalStaked, nextDrawTime, drawFunction, txBeingSent, assignPrize, stake, unstake, withdraw, userStaked, userUnstaked, userWithdrawable, userWithdrawEpoch, stakingHelperAddress, sweepStakesAddress, selectedAddress, lastWinner, lastPrize, ownerOf}) {

//run countdown timer every second
  React.useEffect(() => {
    calculateCountdown();
    getLatestBlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const readableWinner = lastWinner ? lastWinner : "";
  const readablePrize = lastPrize ? lastPrize.toFixed(2) : "";

  const [selectedOption, setSelectedOption] = useState("enter");
  //date states
  const [days, setDays] = useState("");
  const [hours, setHours] = useState("");
  const [min, setMin] = useState("");
  const [drawButton, setDrawButton] = useState(false);

  const winnerABI = [
    "event WinnerAssigned(uint256 winningTicket, uint256 indexed _winner, uint256 _amount)",
  ];

  const winnerInterface = new ethers.utils.Interface(winnerABI);
  const topic = winnerInterface.getEventTopic("WinnerAssigned");
  const [winners, setWinners] = useState([]);
  const [latestBlock, setLatestBlock] = useState(0);
  const [loading, setLoading] = useState(false);
  const API_KEY = process.env.REACT_APP_COVALENT_API_KEY;

  let headers = new Headers();
  headers.set("Authorization", "Bearer " + API_KEY);

  const winnersObj = {};

  const lowestBlock = 49165773; // The block where the first winner was drawn

  const getLatestBlock = () => {

    if(winners.length !== 0){
      return;
    }

    setLoading(true);
    fetch(`https://api.covalenthq.com/v1/harmony-mainnet/block_v2/latest/?`, {
      method: "GET",
      headers: headers,
    })
      .then((resp) => resp.json())
      .then((data) => {
        const block = data.data.items[0].height;
        //subtract 5 because sometimes the api gives a block that can't be queried
        getData(block-5);
      });
  };

  const getData = async (initialBlock) => {
    setLoading(true);
    let latest = !isNaN(initialBlock) ? initialBlock : latestBlock;
    let startBlock = Math.max(latest - 500000, lowestBlock);
  
    try {
      const response = await fetch(
        `https://api.covalenthq.com/v1/harmony-mainnet/events/address/${sweepStakesAddress}/?starting-block=${startBlock}&ending-block=${latest}&`,
        { method: "GET", headers: headers }
      );
      const data = await response.json();
      const events = data.data.items;
      const winnerEvents = events.filter(event => event.raw_log_topics[0].includes(topic));
      const dates = [];
      const newWinners = [];
  
      for (const event of winnerEvents) {
        const decoded = winnerInterface.decodeEventLog(
          "WinnerAssigned",
          event.raw_log_data,
          event.raw_log_topics
        );
        const date = event.block_signed_at.slice(0, 10);
        const winningToken = decoded._winner.toString();
        const winnerFullAddress = await ownerOf(winningToken);
        const winner = winnerFullAddress.toLowerCase() === selectedAddress.toLowerCase() ? "YOU!" : winnerFullAddress.slice(0, 4) + "..." + winnerFullAddress.slice(-4);
        const amount = parseFloat(ethers.utils.formatEther(decoded._amount)).toFixed(2);
        
        dates.push(date);
        winnersObj[date] = { date, winner, amount };
      }
  
      dates.sort((a, b) => new Date(b) - new Date(a));
  
      for (const date of dates) {
        newWinners.push(winnersObj[date]);
      }
  
      setWinners(prevWinners => [...prevWinners, ...newWinners]);
      setLatestBlock(prevBlock => {
        let newLatestBlock = startBlock;
        console.log("newLatestBlock", newLatestBlock); // This should now log the updated value
    
        // Return the new state
        return newLatestBlock;
      });
    } catch (error) {
      console.error('Error fetching data:', error);
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
      <Prizes selectedAddress={selectedAddress} winners={winners} loading={loading} latestBlock={latestBlock} lowestBlock={lowestBlock} getData={getData}/>
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
