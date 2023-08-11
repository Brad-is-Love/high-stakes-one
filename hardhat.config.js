require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  networks: {
    docker: {
      url: "http://localhost:9599",
    },
    testnet: {
      url: "https://api.s0.b.hmny.io",
      accounts: [process.env.OWNER_PRIVATE_KEY, process.env.ACC1_PRIVATE_KEY, process.env.ACC2_PRIVATE_KEY, process.env.ACC3_PRIVATE_KEY],
      chainId: 1666700000,
    },
    mainnet: {
      url: "https://api.s0.t.hmny.io",
      accounts: [process.env.OWNER_PRIVATE_KEY, process.env.ACC1_PRIVATE_KEY, process.env.ACC2_PRIVATE_KEY, process.env.ACC3_PRIVATE_KEY],
      chainId: 1666600000,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 10,
          }
        }
      }],
  },
};
