import React, { useState } from "react";

export function LuckyStakerRules(stakingHelperAddress, sweepStakeAddress) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="card p-2 px-4 mx-5">
      <div className="row">
        <div className="col-12">
          <h4 onClick={toggleCollapse} style={{ cursor: "pointer" }}>
            How it works {isCollapsed ? "+" : "-"}
          </h4>
          {!isCollapsed && (
            <ol>
              <li>Stake ONE to enter the lottery.</li>
              <li>Every ONE you stake is a chance to win.</li>
              <li>
                Winners are chosen randomly, based on Harmony's built-in verified RNG.
              </li>
              <li>
                Your prizes are automatically restaked for you.
              </li>
              <li>
                You can unstake at any time, then wait 7 epochs to withdraw.
              </li>
              <li>
                Users stake is traked by the Sweepstakes NFT contract at {sweepStakeAddress}.
              </li>
              <li>
                The funds, staking and unstaking are managed via the StakingHelper contract at {stakingHelperAddress}.
              </li>
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
