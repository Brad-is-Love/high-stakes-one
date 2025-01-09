import React from "react";
import ReactDOM from "react-dom/client";
import { Web3Provider } from "./contexts/web3Context";
import { Dapp } from "./components/Dapp";

// We import bootstrap here, but you can remove if you want
import "bootstrap/dist/css/bootstrap.css";
import "./app.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Web3Provider>
    <Dapp />
  </Web3Provider>
);
