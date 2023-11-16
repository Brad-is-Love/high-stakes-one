import React, { useState } from "react";
import { ethers } from "ethers";

export function Prizes({ selectedAddress, sweepstakesAddress, ownerOf }) {
  React.useEffect(() => {
    getLatestBlock();
  }, []);

  const winnerABI = [
    "event WinnerAssigned(uint256 winningTicket, uint256 indexed _winner, uint256 _amount)",
  ];

  const winnerInterface = new ethers.utils.Interface(winnerABI);
  const topic = winnerInterface.getEventTopic("WinnerAssigned");
  const [winners, setWinners] = useState([]);
  const [latestBlock, setLatestBlock] = useState(0);
  const API_KEY = process.env.REACT_APP_COVALENT_API_KEY;

  let headers = new Headers();
  headers.set("Authorization", "Bearer " + API_KEY);

  const winnersObj = {};

  const getLatestBlock = () => {
    console.log("getLatestBlock");
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
    let latest = initialBlock || latestBlock;
    let startBlock = latest - 500000;
  
    try {
      const response = await fetch(
        `https://api.covalenthq.com/v1/harmony-mainnet/events/address/${sweepstakesAddress}/?starting-block=${startBlock}&ending-block=${latest}&`,
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
        const winner = await ownerOf(winningToken);
        const amount = parseFloat(ethers.utils.formatEther(decoded._amount)).toFixed(2);
        
        dates.push(date);
        winnersObj[date] = { date, winner, amount };
      }
  
      dates.sort((a, b) => new Date(b) - new Date(a));
  
      for (const date of dates) {
        newWinners.push(winnersObj[date]);
      }
  
      setWinners(prevWinners => [...prevWinners, ...newWinners]);
      setLatestBlock(startBlock);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  return (
    <>
      <div className="row">
        <div className="col-12">
          <h4>Last Winners</h4>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Winner</th>
                  <th>Prize</th>
                </tr>
              </thead>
              <tbody>
                {winners.map((winner, index) => {
                  return (
                    <tr key={index}>
                      <td>{winner.date}</td>
                      <td>{winner.winner}</td>
                      <td>{winner.amount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button className="btn btn-primary" onClick={getData}>
            Load More
          </button>
        </div>
      </div>
      {/* div with centered content */}
    </>
  );
}
