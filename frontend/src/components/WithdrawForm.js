import React, { useState } from "react";
import { ethers } from "ethers";
import { TransactionButton } from "./TransactionButton";

export function WithdrawForm({
  currentEpoch,
  userStaked,
  userUnstaked,
  userWithdrawable,
  userWithdrawEpoch,
  approveHSOne,
  apporoved,
  withdraw,
  instantWithdraw,
  txBeingSent,
}) {
  const withdrawableHSOne = userStaked ? (parseFloat(ethers.utils.formatEther(userStaked))*0.997).toFixed(2) : 0;
  const readableUnstaked = userUnstaked
    ? parseFloat(ethers.utils.formatEther(userUnstaked)).toFixed(2)
    : 0;
  const readableWithdrawable = userWithdrawable
    ? parseFloat(ethers.utils.formatEther(userWithdrawable)).toFixed(3)
    : 0;
  let withdrawButton = false;

  const [withdrawMethod, setWithdrawMethod] = useState("instant");
  const handleWithdrawMethodChange = (option) => {
    setWithdrawMethod(option);
  };
  let msg = "";
  if (!(parseFloat(readableWithdrawable) > 0)) {
    if (!(parseFloat(readableUnstaked) > 0)) {
      msg =
        "You need to unstake first, then wait 7 epochs to withdraw 100% of your staked ONE.";
    } else {
      const epochsLeft = userWithdrawEpoch - currentEpoch;
      msg =
        "Unstaking now. You need to wait " +
        epochsLeft +
        " more epochs to withdraw.";
    }
  } else {
    withdrawButton = true;
    msg = "You can withdraw " + readableWithdrawable + " ONE.";
  }

  return (
    <>
      <h5>Withdraw instantly via High Stakes ONE token or unstake and wait.</h5>
      <div className="btn-group pb-3">
        <button
          type="button"
          className={`btn ${
            withdrawMethod === "instant" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => handleWithdrawMethodChange("instant")}
        >
          Instant Withdraw
        </button>
        <button
          type="button"
          className={`btn ${
            withdrawMethod === "unstake" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => handleWithdrawMethodChange("unstake")}
        >
          Unstake & Wait
        </button>
      </div>
      {withdrawMethod === "unstake" && (
        <>
          <div className="row">
            <div className="col-12">
              <p className="mb-1">{msg}</p>
            </div>
          </div>

          {withdrawButton && (
            <div className="text-center text-md-left pt-2">
              <TransactionButton
                txBeingSent={txBeingSent}
                loadingText={"Withdraw"}
                functionToCall={withdraw}
                buttonText={"Withdraw " + readableWithdrawable + " ONE"}
              />
            </div>
          )}
        </>
      )}
      {withdrawMethod === "instant" && (
        <>
          <div className="row">
            <div className="col-12">
              <p className="mb-1">
                Receive 99.7% in High Stakes ONE token right now. This can be
                traded on LINKGOESHERE
              </p>
            </div>
          </div>
          {apporoved ? (
          <div className="text-center text-md-left pt-2">
            <TransactionButton
              txBeingSent={txBeingSent}
              loadingText={"Instant Withdraw"}
              functionToCall={instantWithdraw}
              buttonText={"Receive " + withdrawableHSOne + " HSONE"}
            />
          </div>) : (
            <div className="text-center text-md-left pt-2">
            <TransactionButton
              txBeingSent={txBeingSent}
              loadingText={"Approve"}
              functionToCall={approveHSOne}
              buttonText={"Approve"}
            />
          </div>)}
        </>
      )}
    </>
  );
}
