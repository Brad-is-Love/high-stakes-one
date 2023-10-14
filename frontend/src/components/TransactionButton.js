import React from "react";

export function TransactionButton({
  txBeingSent,
  loadingText,
  functionToCall,
  buttonText,
}) {
  if (txBeingSent === loadingText) {
    return (
      <button type="button" className="btn btn-disabled" disabled>
        Loading...
      </button>
    );
  } else {
    return (
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => functionToCall()}
      >
        {buttonText}
      </button>
    );
  }
}
