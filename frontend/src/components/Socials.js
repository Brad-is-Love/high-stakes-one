import React from "react";
import { Discord, Github, Reddit, Twitter } from "react-bootstrap-icons";

export function Socials() {
  return (
    <div className="social">
      <div
        className="row justify-content-center text-center pt-3 mt-3 pb-3 mb-3"
        style={{ width: "300px", margin: "0 auto" }}
      >
        <div className="col">
          <a
            href="https://discord.gg/8WtBWdwp7b"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Discord size={30} color="#fff" />
          </a>
        </div>
        <div className="col">
          <a
            href="https://twitter.com/HighStakes_Life"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Twitter size={30} color="#fff" />
          </a>
        </div>
        <div className="col">
          <a
            href="https://www.reddit.com/r/high_stakes_life/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Reddit size={30} color="#fff" />
          </a>
        </div>
        <div className="col">
          <a
            href="https://github.com/Brad-is-Love/high-stakes-one"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github size={30} color="#fff" />
          </a>
        </div>
      </div>
    </div>
  );
}
