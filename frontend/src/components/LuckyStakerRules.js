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
              Winners are chosen randomly, by Harmony's built-in verified RNG, and prizes are automatically restaked for you. You can unstake at any time, then wait 7 epochs to withdraw.
            </p>
            <p>
              The prize money comes from staking rewards. High Stakes makes money with a 3% fee on staking rewards. E.g. if Harmony pays 10% APR, 9.7% goes to the prize pool and 0.3% goes to High Stakes.
            </p>
            <p>
              The Sweepstakes contract holds ticket info and draws the winners: {sweepStakesAddress}.
            </p>
            <p>
              Staking and unstaking are managed via the StakingHelper contract: {stakingHelperAddress}.
            </p>
            <p className="pt-2">
              Sweepstakes is a no-loss savings lottery inspired by <a href="https://en.wikipedia.org/wiki/Bonus_Bonds" target="_blank" rel="noopener noreferrer">Bonus Bonds</a>, a savings scheme in New Zealand that encouraged saving by giving interest as prizes.
            </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
