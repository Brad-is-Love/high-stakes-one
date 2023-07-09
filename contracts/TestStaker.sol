// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import "./lib/StakingContract.sol";

contract TestStaker is StakingContract {
    address payable public owner;

    constructor() {
        owner = payable(msg.sender);
    }
    function withdraw() public {
        require(msg.sender == owner, "Only owner can withdraw");
        owner.transfer(address(this).balance);
    }
}