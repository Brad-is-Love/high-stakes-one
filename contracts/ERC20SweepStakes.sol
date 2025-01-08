// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title ERC20SweepStakesNFTs
/// @notice Users can stake an ERC20 token in a pool and receive rewards by lottery
/// @dev The tokens are stored on 'pages' of 100 tokens per page, so that we can iterate through more tokens without running out of gas.

contract ERC20SweepStakesNFTs is ERC721Enumerable {
    uint256 public pageSize;
    mapping(uint256 => uint256) public pages;
    uint256 public tokenCounter;
    uint256 public totalStaked;
    uint256 public drawPeriod;
    uint256 public lastDrawTime;
    uint256 public prizeFee = 0; // no fees at the moment
    uint256 public feesToCollect; //beneficiary can withdraw these
    address public owner;
    address public beneficiary;
    address public prizeTokenAddress;
    IERC20 public prizeToken;
    address public stakingTokenAddress;
    IERC20 public stakingToken;
    uint256 public prizePool; // the balance of the prize token in the contract dedicated to prizes
    uint256 public minStake = 100 ether; // This was changed to 20 ONE after deployment
    uint256 private lastWinner; //last winner is assigned to private variable on draw and revealed on sendPrize to prevent malicious draws
    uint256 public weeklyPrizePool;
    uint256[] public prizeSchedule; // An array of the % of the prize pool given for each draw. Should add to 100
    uint256 public prizeScheduleIndex; // where we are in the prize schedule - we iterate through the week with larger draws on the weekend.
    bool public prizeSent;
    bool internal locked;
    mapping(uint256 => uint256) public tokenIdToStakedAmount;

// add inputs to map existing tokens values on deployment because we updated previous contract.
    constructor(address _prizeTokenAddress, address _stakingTokenAddress) ERC721("ERC20 Sweepstakes", "ESS") {
        tokenCounter = 0;
        owner = msg.sender;
        beneficiary = msg.sender;
        drawPeriod = 23 * 60 * 60; //23 hours
        lastDrawTime = block.timestamp;
        prizeSent = true;
        pageSize = 100;
        prizeToken = IERC20(_prizeTokenAddress);
        prizeTokenAddress = _prizeTokenAddress;
        stakingToken = IERC20(_stakingTokenAddress);
        stakingTokenAddress = _stakingTokenAddress;
    }

    event Enter(address _user, uint256 indexed _tokenId, uint256 _amount);
    event Withdraw(address _user, uint256 indexed _tokenId, uint256 _amount);
    event DrawWinner();
    event PrizeSent(address _user, uint256 indexed _winningToken, uint256 _amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // enter - will mint a new token and add the stake to the token
    function enter(uint256 _amount) external {
        require(_amount >= minStake, "Too low");
        require(stakingToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        _safeMint(msg.sender, tokenCounter);
        addStake(tokenCounter, _amount);

        emit Enter(msg.sender, tokenCounter, _amount);
        tokenCounter++;
    }

    // addToToken - will add the stake to existing token
    function addToToken(uint256 _amount, uint256 _tokenId) external {
        require(_isApprovedOrOwner(msg.sender, _tokenId), "Not owner or approved");
        require(stakingToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        addStake(_tokenId, _amount);

        emit Enter(msg.sender, _tokenId, _amount);
    }

    // unstake - will add a withdrawEpoch to the token, along with the amount to unstake
    function withdraw(uint256 _amount, uint256 _tokenId) external {
        require(_isApprovedOrOwner(msg.sender, _tokenId), "Not owner or approved");
        require(tokenIdToStakedAmount[_tokenId] >= _amount, "Not enough staked");
        tokenIdToStakedAmount[_tokenId] -= _amount;
        pages[_tokenId / pageSize] -= _amount;
        totalStaked -= _amount;
        //will burn the token if staked is zero
        if (tokenIdToStakedAmount[_tokenId] == 0) {
            burn(_tokenId);
        }
        require(stakingToken.transfer(msg.sender, _amount), "Transfer failed");

        emit Withdraw(msg.sender, _tokenId, _amount);
    }

    function burn(uint256 _tokenId) internal {
        _burn(_tokenId);
        tokenIdToStakedAmount[_tokenId] = 0;
    }

    // We draw the winner and assign to a private variable to prevent malicious draws
    function drawWinner() external {
        require(block.timestamp > lastDrawTime + drawPeriod, "Too soon");
        require(prizeSent == true, "Prize not assigned");
        lastWinner = vrf() % (totalStaked - 1);
        lastDrawTime = block.timestamp;
        prizeSent = false;

        emit DrawWinner();
    }

    // Assigns the prize to the winner and re-stakes it
    function sendPrize() public {
        require(prizeSent == false);
        prizeSent = true;
        require(block.timestamp > lastDrawTime, "can't execute with draw");
        
        // in case someone unstakes between draw and prize assignment
        if(lastWinner > totalStaked-1){
            lastWinner = lastWinner % (totalStaked - 1);
        } 
        uint256 prize = weeklyPrizePool * prizeSchedule[prizeScheduleIndex]/100;
        require(prizePool >= prize, "Not enough prize tokens");
        prizePool -= prize;

        uint256 fees = (prize * prizeFee) / 10000;

        if(prizeScheduleIndex < prizeSchedule.length - 1){
            prizeScheduleIndex++;
        } else {
            prizeScheduleIndex = 0;
        }

        feesToCollect += fees;
        prize -= fees;
        
        uint256 winningToken = tokenAtIndex(lastWinner);
        
        require(prizeToken.transfer(ownerOf(winningToken), prize), "Transfer failed");

        emit PrizeSent(ownerOf(winningToken), winningToken, prize);
    }

    function addStake(uint256 _tokenId, uint256 _amount) internal {
        tokenIdToStakedAmount[_tokenId] += _amount;
        pages[_tokenId / pageSize] += _amount;
        totalStaked += _amount;
    }

    //withdrawFees - will send the fees to the beneficiary
    function withdrawFees() external {
        require(msg.sender == beneficiary, "Only beneficiary");
        require(feesToCollect > 0, "No fees to collect");
        uint256 amount = feesToCollect;
        feesToCollect = 0;
        require(prizeToken.transfer(beneficiary, amount), "Transfer failed");
    }

    // Iterates through pages first, then through tokens on that page
    // This is done to save gas: should be able to get ~100k tokens in here on harmony
    function tokenAtIndex(uint256 _index) public view returns (uint256) {
        require(_index < totalStaked, "Index out of range");
        uint256 subTotal = 0;
        //find the page the token is on:
        for (uint256 page = 0; page <= tokenCounter / pageSize; page++) {
            //add the page value to subtotal
            if (subTotal + pages[page] > _index) {
                //Iterate through the tokens on this page.
                for (
                    uint256 tokenId = page * pageSize;
                    tokenId < (page + 1) * pageSize;
                    tokenId++
                ) {
                    if (subTotal + tokenIdToStakedAmount[tokenId] >= _index) {
                        return tokenId;
                    }
                    subTotal += tokenIdToStakedAmount[tokenId];
                }
            }
            subTotal += pages[page];
        }
        //should never get to here
        require(false, "Winner not found");
        return (0);
    }

    function fundWithPrizeTokens(uint256 _amount) external {
        require(prizeToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        prizePool += _amount;
    }

    function withdrawPrizeToken(uint256 amount) external onlyOwner {
        // Withdraw prize token from the contract in case of emergency
        require(prizeToken.transfer(beneficiary, amount), "Transfer failed");
    }

    function setWeeklyPrizePool(uint256 _weeklyPrizePool) external onlyOwner {
        weeklyPrizePool = _weeklyPrizePool;
    }

    function setPrizeSchedule(uint256[] memory _prizeSchedule) external onlyOwner {
        require(_prizeSchedule.length > 0, "No prize schedule");
        for (uint256 i = 0; i < _prizeSchedule.length; i++) {
            require(_prizeSchedule[i]<=100, "Cant be more than 100% of prizepool");
        }
        prizeSchedule = _prizeSchedule;
    }

    function setBeneficiary(address _beneficiary) external onlyOwner {
        beneficiary = _beneficiary;
    }

    function setPrizeToken(address _prizeTokenAddress) external onlyOwner {
        prizeToken = IERC20(_prizeTokenAddress);
        prizeTokenAddress = _prizeTokenAddress;
    }

    function setStakingToken(address _stakingTokenAddress) external onlyOwner {
        stakingToken = IERC20(_stakingTokenAddress);
        stakingTokenAddress = _stakingTokenAddress;
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function setDrawPeriod(uint256 _drawPeriod) external onlyOwner {
        drawPeriod = _drawPeriod;
    }

    function setPrizeFee(uint256 _prizeFee) external onlyOwner {
        prizeFee = _prizeFee;
    }


    function setMinStake(uint256 _minStake) external onlyOwner {
        minStake = _minStake;
    }

    //The harmony built-in VRF https://docs.harmony.one/home/developers/harmony-specifics/tools/harmony-vrf
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
}