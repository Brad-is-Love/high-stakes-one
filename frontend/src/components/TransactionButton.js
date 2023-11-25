import React from "react";

export function TransactionButton({
  txBeingSent,
  loadingText,
  functionToCall,
  buttonText,
}) {
  if (txBeingSent === loadingText) {
    return (
      <button type="button" className="btn btn-disabled w-100 p-2" disabled>
        Loading...
      </button>
    );
  } else {
    return (
      <button
        type="button"
        className="btn btn-primary w-100 p-2"
        onClick={() => functionToCall()}
      >
        {buttonText}
      </button>
    );
  }
}
