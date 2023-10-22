import React from "react";
import { ethers } from "ethers";
import { TransactionButton } from "./TransactionButton";

export function WithdrawForm({
  currentEpoch,
  userUnstaked,
  userWithdrawable,
  userWithdrawEpoch,
  withdraw,
  txBeingSent,
}) {
  const readableUnstaked = userUnstaked
    ? parseFloat(ethers.utils.formatEther(userUnstaked)).toFixed(2)
    : 0;
  const readableWithdrawable = userWithdrawable
    ? parseFloat(ethers.utils.formatEther(userWithdrawable)).toFixed(3)
    : 0;
  let withdrawButton = false;

  let msg = "";
  if (!(parseFloat(readableWithdrawable) > 0)) {
    if (!(parseFloat(readableUnstaked) > 0)) {
      msg = "You need to unstake before you can withdraw.";
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
            functionToCall={withdraw} // Remove the parentheses here
            buttonText={"Withdraw " + readableWithdrawable + " ONE"}
          />
        </div>
      )}
    </>
  );
}
