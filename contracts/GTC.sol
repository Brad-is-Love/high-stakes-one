// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// a local GTC for testing
contract GTC is ERC20 {
    constructor() ERC20("GTC", "GTC") {
        _mint(msg.sender, 69420 * 10 ** decimals());
    }
}