//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

//This contract just tests the staking logic without actually staking, just so we can test the sweepstakes logic

contract DummyStaking {
    function acceptMoney() public payable {}

    function _delegate(
        address validatorAddress,
        uint256 amount
    ) public pure returns (bool) {
        if (validatorAddress != address(0) && amount > 0) {
            return true;
        }
        return false;
    }

    function _undelegate(
        address validatorAddress,
        uint256 amount
    ) public pure returns (bool) {
        if (validatorAddress != address(0) && amount > 0) {
            return true;
        }
        return false;
    }

    function _collectRewards() public payable returns (bool success) {
        return true;
    }

    function _epoch() public view returns (uint256 epochNumber) {
        uint epoch = block.timestamp / 86400;
        epochNumber = uint256(epoch);
    }
}
