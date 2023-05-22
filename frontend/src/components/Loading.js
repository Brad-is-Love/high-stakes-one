import React from "react";

export function Loading() {
  return (
    <div className="background"
      style={{
        position: "fixed",
        zIndex: 2,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{
          position: "absolute",
          zIndex: 3,
          top: "50%",
          left: "50%",
          width: "100px",
          height: "50px",
          marginLeft: "-50px",
          marginTop: " -25px",
          textAlign: "center",
        }}
      >
        {/* huge thick spinner */}
        <div
          className="spinner-border text-warning"
          role="status"
          style={{
            fontWeight: "extra-bold",
            width: "100px",
            height: "100px",
          }}
        >
          <span className="sr-only">Loading...</span>
          </div>
      </div>
    </div>
  );
}
