// SPDX-License-Identifier: GPL-3.0
// Parts copied from 2022 MerkleLabs

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./lib/StakingContract.sol";

/// @title SweepStakesNFTs
/// @notice Users can stake ONE in a pool and receive rewards by lottery
/// @dev StakingHelper holds the funds, manages staking and unstaking.
/// @dev SweepStakesNFTs is the ERC721, holds the user data and runs draws.
/// @dev The tokens are stored on 'pages' of 100 tokens per page, so that we can iterate through more tokens without running out of gas.

contract WithdrawAll {
    address public owner;
    address public stakingHelper;
    uint256 public totalStaked;

// add inputs to map existing tokens values
    constructor(uint256 _totalStaked, address _stakingHelper) {
        owner = msg.sender;
        totalStaked = _totalStaked;
        stakingHelper = _stakingHelper;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyStaking() {
        require(msg.sender == stakingHelper, "Only staking helper");
        _;
    }

    function unstake(address _holder, uint256 _amount, uint256 _tokenId) external onlyStaking {
        totalStaked -= _amount;
    }

    function withdraw(uint256 _tokenId) onlyOwner external {
        //amount is eth balance of stakingHelper
        uint256 amount = stakingHelper.balance;
        StakingHelperInterface(stakingHelper).payUser(msg.sender, amount);
    }

    function setStakingHelper(address _stakingHelper) external onlyOwner {
        stakingHelper = _stakingHelper;
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }
}

interface StakingHelperInterface {
    function unstake(uint256 _amount, uint256 _tokenId) external;

    function payUser(address _user, uint256 _amount) external;
}
