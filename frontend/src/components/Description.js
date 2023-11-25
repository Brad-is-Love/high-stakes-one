import React from "react";
import { Logo } from "./Logo";

export function Description({displayMessage}) {
let addressMessage = " and your address has not been whitelisted"
  return (
    <div className="card m-5">
      <div className="col-12 p-3 text-center">
        <div className="row justify-content-center">
          <Logo />
        </div>
        <div className="row justify-content-center">
          <div className="col-12">
            <h4 className="pb-5">High Stakes has just launched on Harmony Mainnet!</h4>

            <p>
              Our first game, Sweepstakes, is a no-loss savings lottery inspired
              by{" "}
              <a
                href="https://en.wikipedia.org/wiki/Bonus_Bonds"
                target="_blank"
                rel="noopener noreferrer"
              >
                Bonus Bonds
              </a>
              . Stake in a pool with other players. A lucky winner gets the
              rewards every week!
            </p>
            <p>
              We're in a closed alpha launch right now{displayMessage ? addressMessage : ""}.
            </p>
            <p>
              {" "}
              We plan to launch a public beta in early December. Join the{" "}
              <a
                href="https://discord.gg/8WtBWdwp7b"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </a>{" "}
              to stay up to date.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
