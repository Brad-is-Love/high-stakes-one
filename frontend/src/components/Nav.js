import React from "react";

export function Nav(props) {
  return (
    <>
      <div className="navbar navbar-expand-lg navbar-dark custom-nav-bg">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">High Stakes</a>
          <span className="navbar-text text-white text-right">
            {/* left 4 and right 4 characters of address */}
            Welcome{" "}
            <b>
              {props.selectedAddress.slice(0, 4)}...
              {props.selectedAddress.slice(-4)}
            </b>
          </span>
        </div>
      </div>
    </>
  );
}


