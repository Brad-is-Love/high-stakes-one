// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title ERC Draws
/// @notice This contract runs draws on who is staking ONE in the sweepstakesNFTs contract, and rewards the winner with an ERC Token

contract ERCDraw {
    address public owner;
    address public prizeTokenAddress;
    address public sweepstakesNFTsAddress;
    IERC20 public prizeToken;
    ISweepstakesNFTs public sweepstakesNFTs;
    uint256 public weeklyPrizePool;
    uint256 public drawPeriod = 24*60*60; // 24 hours
    uint256[] public prizeSchedule; // Should add to 100
    uint256 public prizeScheduleIndex;
    uint256 public lastDrawTime;
    address private lastWinner;
    bool public prizeSent = true;

    constructor(address _sweepstakesAddress, address _prizeTokenAddress) {
        owner = msg.sender;
        sweepstakesNFTsAddress = _sweepstakesAddress;
        sweepstakesNFTs = ISweepstakesNFTs(_sweepstakesAddress);
        prizeToken = IERC20(_prizeTokenAddress);
        prizeTokenAddress = _prizeTokenAddress;
        prizeSchedule = [3, 5, 8, 10, 14, 20, 40];
        prizeScheduleIndex = 0;
        weeklyPrizePool = 68 * 10 ** 18;
        lastDrawTime = 0;
    }

    event WinnerDrawn();
    event PrizeSent(address winner, uint256 prize);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function drawWinner() external {
        require(block.timestamp > lastDrawTime + drawPeriod, "Too soon");
        require(prizeSent == true, "Prize not assigned");
        uint256 totalStaked = sweepstakesNFTs.totalStaked();
        uint256 index = vrf() % (totalStaked -1);
        uint256 winningToken = sweepstakesNFTs.tokenAtIndex(index);
        lastWinner = sweepstakesNFTs.ownerOf(winningToken);
        lastDrawTime = block.timestamp;
        prizeSent = false;

        emit WinnerDrawn();
    }

    function sendPrize() external {
        require(prizeSent == false, "Prize already assigned");
        prizeSent = true;
        require(block.timestamp > lastDrawTime, "can't execute with draw");
        uint256 prize = weeklyPrizePool * prizeSchedule[prizeScheduleIndex]/100;
        
        if(prizeScheduleIndex < prizeSchedule.length - 1){
            prizeScheduleIndex++;
        } else {
            prizeScheduleIndex = 0;
        }
        require(prizeToken.transfer(lastWinner, prize), "Transfer failed");

        emit PrizeSent(lastWinner, prize);
    }

    function withdrawPrizeToken(uint256 amount) external onlyOwner {
        // Withdraw prize token from the contract in case of emergency
        require(prizeToken.transfer(owner, amount), "Transfer failed");
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function setPrizeToken(address _prizeTokenAddress) external onlyOwner {
        prizeToken = IERC20(_prizeTokenAddress);
    }

    function setWeeklyPrizePool(uint256 _weeklyPrizePool) external onlyOwner {
        weeklyPrizePool = _weeklyPrizePool;
    }

    function setDrawPeriod(uint256 _drawPeriod) external onlyOwner {
        drawPeriod = _drawPeriod;
    }

    function setPrizeSchedule(uint256[] memory _prizeSchedule) external onlyOwner {
        prizeSchedule = _prizeSchedule;
    }

    function setPrizeScheduleIndex(uint256 _prizeScheduleIndex) external onlyOwner {
        prizeScheduleIndex = _prizeScheduleIndex;
    }

    function setSweepstakesNFTs(address _sweepstakesNFTsAddress) external onlyOwner {
        sweepstakesNFTs = ISweepstakesNFTs(_sweepstakesNFTsAddress);
    }

    // The harmony built-in VRF https://docs.harmony.one/home/developers/harmony-specifics/tools/harmony-vrf
    function vrf() internal view returns (uint256 result) {
        uint256[1] memory bn;
        bn[0] = block.number;
        assembly {
            let memPtr := mload(0x40)
            if iszero(staticcall(not(0), 0xff, bn, 0x20, memPtr, 0x20)) {
                invalid()
            }
            result := mload(memPtr)
        }
    }

    function getContractPrizeTokenBalance() public view returns (uint256) {
        return prizeToken.balanceOf(address(this));
    }
}

interface ISweepstakesNFTs {
    function totalStaked() external view returns (uint256);
    function tokenAtIndex(uint256 index) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
}
