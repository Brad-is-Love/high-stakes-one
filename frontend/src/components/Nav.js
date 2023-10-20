import React from "react";
import { ethers } from "ethers";

export function Nav(props) {
  const readableStaked = props.userStaked ? parseInt(ethers.utils.formatEther(props.userStaked)) : 0
  return (
    <>
      <div className="navbar navbar-expand-lg navbar-dark custom-nav-bg">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">HIGH STAKES</a>
          <span className="navbar-text text-white text-right">
            {/* left 4 and right 4 characters of address */}
            Welcome{" "}
            <b>
              {props.selectedAddress.slice(0, 4)}...
              {props.selectedAddress.slice(-4)}
            </b>

          <br/>
          Your stake: {readableStaked} ONE
          </span>
        </div>
      </div>
    </>
  );
}


