import React, { useState } from "react";

export function LuckyStakerRules({stakingHelperAddress, sweepStakesAddress}) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="card p-2 px-4">
      <div className="row">
        <div className="col-12">
          <h4 onClick={toggleCollapse} style={{ cursor: "pointer" }}>
            How it works {isCollapsed ? "+" : "-"}
          </h4>
          {!isCollapsed && (
            <>
            <p className="pt-2">
              Stake ONE to enter the lottery. Every ONE you stake is a chance to win. 
            </p>
            <p>
              Winners are chosen randomly, based on Harmony's built-in verified RNG and prizes are automatically restaked for you. You can unstake at any time, then wait 7 epochs to withdraw.
            </p>
            <p>
              High Stakes makes money with a 1.2% fee on prizes.
            </p> 
            <p>
              The Sweepstakes NFT contract manages tickets and draws winners: {sweepStakesAddress}.
            </p>
            <p>
              Staking and unstaking are managed via the StakingHelper contract: {stakingHelperAddress}.
            </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
