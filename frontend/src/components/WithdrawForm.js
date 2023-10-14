import React, { useState } from "react";
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
  React.useEffect(() => {
    makeReadable();
  }, [userUnstaked, userWithdrawable]);

  const [readableUnstaked, setReadableUnstaked] = useState(0);
  const [readableWithdrawable, setReadableWithdrawable] = useState(0);
  const [withdrawButton, setWithdrawButton] = useState(false);

  const makeReadable = () => {
    if (userUnstaked !== undefined) {
      setReadableUnstaked(ethers.utils.formatEther(userUnstaked));
    }
    if (userWithdrawable !== undefined) {
      setReadableWithdrawable(ethers.utils.formatEther(userWithdrawable));
    }
  };

  let msg = "";
  if (!(parseFloat(readableWithdrawable) > 0)) {
    if (!(parseFloat(readableUnstaked) > 0)) {
      msg = "You need to unstake before you can withdraw.";
    } else {
      const epochsLeft = userWithdrawEpoch - currentEpoch;
      msg =
        "Unstaking now. You need to wait " + epochsLeft + " more epochs to withdraw.";
    }
  } else {
    setWithdrawButton(true);
    msg = "You can withdraw " + readableWithdrawable + " ONE.";
  }

  return (
    <>
      <div className="row">
        <div className="col-12">
          {msg}
        </div>
      </div>
        {withdrawButton && (
        <TransactionButton
        txBeingSent={txBeingSent}
        loadingText={"Withdraw"}
        functionToCall={withdraw} // Remove the parentheses here
        buttonText={"Withdraw " + readableWithdrawable + " ONE"}
        />
        )}
    </>
  );
}
