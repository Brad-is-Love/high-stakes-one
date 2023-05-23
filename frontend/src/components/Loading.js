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
          marginLeft: "-100px",
          marginTop: " -13px",
          textAlign: "center",
        }}
      >
        {/* loading bar */}
        <div>
          <span className="loader"></span>
          </div>
      </div>
    </div>
  );
}
