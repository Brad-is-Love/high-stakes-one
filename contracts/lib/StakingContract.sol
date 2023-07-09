//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import { StakingPrecompiles, Directive } from "./StakingPrecompiles.sol";

contract StakingContract is StakingPrecompiles {
    event StakingPrecompileCalled(uint8 directive, bool success);

    function acceptMoney() public payable {}

    function _delegate(address validatorAddress, uint256 amount) internal returns (bool success) {
        uint256 result = delegate(validatorAddress, amount);
        success = result != 0;
        emit StakingPrecompileCalled(uint8(Directive.DELEGATE), success);
    }

    function _undelegate(address validatorAddress, uint256 amount) internal returns (bool success) {
        uint256 result = undelegate(validatorAddress, amount);
        success = result != 0;
        emit StakingPrecompileCalled(uint8(Directive.UNDELEGATE), success);
    }

    function _collectRewards() internal returns (bool success) {
        uint256 result = collectRewards();
        success = result != 0;
        emit StakingPrecompileCalled(uint8(Directive.COLLECT_REWARDS), success);
    }

    function _epoch() public view returns (uint256 epochNumber) {
        epochNumber = uint256(epoch());
    }
}
