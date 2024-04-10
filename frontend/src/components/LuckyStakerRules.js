import React, { useState } from "react";

export function LuckyStakerRules({ stakingHelperAddress, sweepStakesAddress }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const reppeggingNode =
    "https://staking.harmony.one/validators/mainnet/one1xazgn47pqv5ewh8aqercl3ptl7t4yhgpjryjer";
  const peaceLoveHarmony =
    "https://staking.harmony.one/validators/mainnet/one1mlkylwnsgsam8cdxzn05hal3ytjngsunlpmp2j";
  const fortuneValidator =
    "https://staking.harmony.one/validators/mainnet/one1v0n7nw6c4fe88xnuasr0d65luult0fvclvvxmf";
  const tecViva = "https://staking.harmony.one/validators/mainnet/one18qk5uszfjq5wrkm2gfstqpx56jdpn0xd4563tk";

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
                Sweepstakes is a no-loss savings lottery inspired by{" "}
                <a
                  href="https://en.wikipedia.org/wiki/Bonus_Bonds"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Bonus Bonds
                </a>
                , a savings scheme in New Zealand that encouraged saving by
                giving interest as prizes.
              </p>
              <p className="pt-2">
                Stake ONE to enter the lottery. Every ONE you stake is a chance
                to win.
              </p>
              <p>
                Winners are drawn daily, with smaller prizes every day and a larger draw on Sunday Evening, UTC.
              </p>
              <p>
                Winners are chosen randomly, by Harmony's built-in verified RNG,
                and prizes are automatically restaked for you. You can unstake
                at any time, then wait 7 epochs to withdraw.
              </p>
              <p>
                The prize money comes from staking rewards. High Stakes makes
                money with a 3% fee on staking rewards. E.g. if Harmony pays 10%
                APR, 9.7% goes to the prize pool and 0.3% goes to High Stakes.
              </p>
              <div>
                <p>We are currently staked with three validators:</p>
                <ul>
                  <li>
                    <a
                      href={reppeggingNode}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Reppegging Node
                    </a>
                  </li>
                  <li>
                    <a
                      href={peaceLoveHarmony}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Peace Love Harmony
                    </a>
                  </li>
                  <li>
                    <a
                      href={fortuneValidator}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Fortune Validator
                    </a>
                  </li>
                  <li>
                    <a
                      href={tecViva}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Tec Viva
                    </a>
                  </li>
                </ul>
              </div>
              <p>
                The Sweepstakes contract holds ticket info and draws the
                winners: {' '}
                <a
                  href={`https://explorer.harmony.one/address/${sweepStakesAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {sweepStakesAddress}
                </a>
              </p>
              <p>
                Staking and unstaking are managed via the StakingHelper
                contract:  {' '}
                <a
                  href={`https://explorer.harmony.one/address/${stakingHelperAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {stakingHelperAddress}
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
