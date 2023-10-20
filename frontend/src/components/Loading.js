import React from "react";
import { Logo } from "./Logo";

export function Loading() {
  return (
    <>
      <div className="background"></div>
      <div className="landing-page">
        <div className="container text-center">
          <div className="row justify-content-center">
            <Logo />
          </div>
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="slogan">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    </>        
  );
}
