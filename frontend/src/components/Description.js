import React from "react";
import { Logo } from "./Logo";

export function Description() {
  return (
    <div className="card m-sm-5">
      <div className="col-12 p-3 text-center">
        <div className="row justify-content-center">
          <Logo />
        </div>
        <div className="row justify-content-center">
          <div className="col-12">
            <h4 className="pb-4">High Stakes has launched on Harmony Mainnet!</h4>

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
              Join the{" "}
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
