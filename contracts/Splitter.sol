// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

contract Splitter {
    // Can collect from SweepStakes
    address public sweepStakesNFTs;
    address public brad;
    address public buttheadus;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public percents;

    constructor(address _sweepStakesNFTs, address _brad, address _buttheadus) {
        sweepStakesNFTs = _sweepStakesNFTs;
        brad = _brad;
        buttheadus = _buttheadus;
        percents[brad] = 75;
        percents[buttheadus] = 25;
    }

    function setPcts(uint256 _bradpct, uint256 _buttheaduspct) external {
        require(msg.sender == brad || msg.sender == buttheadus, "Not authorized");
        percents[brad] = _bradpct;
        percents[buttheadus] = _buttheaduspct;
    }

    function collect() external {
        uint256 balance = address(this).balance;
        ISweepStakesNFTs(sweepStakesNFTs).withdrawFees();
        uint256 claimed = address(this).balance - balance;
        
        
    }
}

interface ISweepStakesNFTs {
    function withdrawFees() external;
}