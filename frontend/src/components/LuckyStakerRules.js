import React, { useState } from "react";

export function LuckyStakerRules() {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="card p-3">
      <div className="row">
        <div className="col-12">
          <h4 onClick={toggleCollapse} style={{ cursor: "pointer" }}>
            How it works {isCollapsed ? "+" : "-"}
          </h4>
          {!isCollapsed && (
            <ol>
              <li>Stake ONE to enter the lottery.</li>
              <li>
                The base ticket price is 100 ONE, but this increases, at the
                rate of the staking APY, throughout the month.
              </li>
              {/* increase indent */}
              <ol>
                <li>
                  For example, if the APY is 9% and you wait 15 days, the ticket
                  price will be 100+(100x0.09*15/365) = 100.37 ONE
                </li>
                <li>
                  This means you can't stake elsewhere and then enter the
                  lottery at the last minute!
                </li>
              </ol>

              <li>Every ticket you have is a chance to win.</li>
              <li>
                Winners are chosen randomly, based on Harmony's built-in
                verified RNG.
              </li>
              <li>
                When the lottery is drawn, all the rewards for that month are
                distributed to the winners.
              </li>
              <li>
                The losers will not lose their stake, they just won't get any rewards that month.
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
