import React, { useState } from "react";

export function LuckyStakerRules() {
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
                High Stakes makes money by a 5% fee on staking rewards.
              </li>
              <li>
                The losers will not lose their stake, they just won't get any rewards that week.
              </li>
              <li>
                You can unstake your ONE to exit the lottery. You will receive
                99.7 ONE per ticket back i.e. There is a 0.3% fee on
                withdrawals.
              </li>
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
