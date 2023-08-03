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

    function stake(address validatorAddress, uint256 amount) payable public {
        require(_delegate(validatorAddress, amount), "Stake failed");
    }

    function unstake(address validatorAddress, uint256 amount) public {
        require(_undelegate(validatorAddress, amount), "Unstake failed");
    }

    function collect() public {
        require(_collectRewards(), "Collect rewards failed");
    }
}