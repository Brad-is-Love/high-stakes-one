// SPDX-License-Identifier: GPL-3.0
// Parts copied from 2022 MerkleLabs

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./lib/StakingContract.sol";

/// @title SweepStakesNFTs
/// @notice Users can stake ONE in a pool and receive rewards by lottery
/// @dev Users receive an NFT which is their ticket to the lottery.
///      It stores the amount they've staked and manages unstaking.
///      The lottery contract calls the addressAtIndex function to find the winner.
///      This iterates through all the holders, summing the amount staked.
contract SweepStakesNFTs is ERC721Enumerable {
    uint256 public undelegationPeriod = 7; //epochs
    uint256 public tokenCounter;
    uint256[] public availableTokenIds;
    uint256 public totalStaked;
    uint256 public drawPeriod;
    uint256 public lastDrawTime;
    uint256 public prizeFee; //As a percentage
    uint256 public ownerHoldings;
    address payable public owner;
    StakingHelper public stakingHelper;
    uint256 public minStake = 100 ether;

    struct tokenInfo {
        uint256 staked;
        uint256 unstaked;
        uint256 endEpoch; // this is when we can withdraw unstaked amount
        uint256 prizes; // Withdrawable any time
    }

    mapping(uint256 => tokenInfo) public tokenIdToInfo;
    // every 100 tokens is a checkpoint, with the total up to there
    // saves gas when iterating
    mapping(uint256 => uint256) public checkpoints;

    constructor() ERC721("Sweepstakes NFTs", "SSN") {
        tokenCounter = 0;
        owner = payable(msg.sender);
        drawPeriod = 7 days;
        lastDrawTime = block.timestamp;
        prizeFee = 5;
        stakingHelper = new StakingHelper(address(this));
    }

    //NEED TO DO THE FEES AND OWNER WITHDRAWAL

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyStaking

    // - Users can enter/stake
    function enter(address _entrant, uint256 _amount) external onlyStaking {
        require(_amount >= minStake, "Too low");
        //check if user owns tokens
        if (balanceOf(msg.sender) == 0) {
            // if not, mint one
            mint(msg.sender, _amount);
        } else {
            // otherwise, add to the existing one
            uint256 tokenId = tokenOfOwnerByIndex(msg.sender, 0);
            tokenIdToInfo[tokenId].staked += _amount;
            checkpoints[tokenId / 100] += _amount;
            totalStaked += _amount;
        }
        mint(msg.sender, _amount);
        // add to totalStaked
        totalStaked += _amount;
    }

    // unstake - will add an endEpoch to the token, along with the amount to unstake

    function unstake(uint256 _amount) external {
        uint256 tokenId = tokenOfOwnerByIndex(msg.sender, 0);
        require(
            tokenIdToInfo[tokenId].staked >= _amount,
            "Can't unstake more than you've staked"
        );
        tokenIdToInfo[tokenId].staked -= _amount;
        tokenIdToInfo[tokenId].unstaked += _amount;
        tokenIdToInfo[tokenId].endEpoch = _epoch() + undelegationPeriod;
        checkpoints[tokenId / 100] -= _amount;
        totalStaked -= _amount;
        stakingHelper.undelegateFromMany(_amount);
    }

    //withdraw - will send the unstaked amount to the user
    //if staked is zero, this will burn the token

    function withdraw() external {
        uint256 tokenId = tokenOfOwnerByIndex(msg.sender, 0);
        require(
            tokenIdToInfo[tokenId].endEpoch <= stakingHelper._epoch(),
            "Must wait until undelegation complete"
        );
        uint256 amount = tokenIdToInfo[tokenId].unstaked;
        tokenIdToInfo[tokenId].unstaked = 0;
        tokenIdToInfo[tokenId].endEpoch = 0;
        tokenIdToInfo[tokenId].prizes = 0;
        if (tokenIdToInfo[tokenId].staked == 0) {
            burn(tokenId);
        }
        payable(msg.sender).transfer(amount);
    }

    function mint(address _to, uint256 _value) internal {
        // if there are available tokens, use one
        if (availableTokenIds.length > 0) {
            uint256 tokenId = availableTokenIds[availableTokenIds.length - 1];
            availableTokenIds.pop();
            _safeMint(_to, tokenId);
            checkpoints[tokenId / 100] += _value;
            tokenIdToInfo[tokenId] = tokenInfo(_value, 0, 0, 0);
        } else {
            // otherwise mint a new one
            _safeMint(_to, tokenCounter);
            checkpoints[tokenCounter / 100] += _value;
            tokenIdToInfo[tokenCounter] = tokenInfo(_value, 0, 0, 0);
            tokenCounter++;
        }
    }

    function burn(uint256 _tokenId) internal {
        _burn(_tokenId);
        delete tokenIdToInfo[_tokenId];
        // make token available for reuse
        availableTokenIds.push(_tokenId);
    }

    // Lottery pays out winner
    function drawWinner() external {
        require(block.timestamp > lastDrawTime + drawPeriod, "Too soon");
        uint index = vrf() % totalStaked;
        address winner = addressAtIndex(index);
        uint256 amount = claimRewards();
        //get the token of the winner and add the amount to the prizes
        uint256 tokenId = tokenOfOwnerByIndex(winner, 0);
        tokenIdToInfo[tokenId].prizes += (amount * (100 - prizeFee)) / 100;
        ownerHoldings += (amount * prizeFee) / 100;
        lastDrawTime = block.timestamp;
    }

    // claims rewards for the entire pool and returns the amount claimed
    function claimRewards() internal returns (uint256) {
        uint256 initialBalance = address(this).balance;
        stakingHelper.collect();
        uint256 finalBalance = address(this).balance;
        return finalBalance - initialBalance;
    }

    function ownerWithdraw() external onlyOwner {
        uint256 amount = ownerHoldings;
        ownerHoldings = 0;
        payable(msg.sender).transfer(amount);
    }

    //owner can claim prizes
    function claimPrizes() external {
        uint256 tokenId = tokenOfOwnerByIndex(msg.sender, 0);
        uint256 amount = tokenIdToInfo[tokenId].prizes;
        tokenIdToInfo[tokenId].prizes = 0;
        payable(msg.sender).transfer(amount);
    }

    // Iterates through checkpoints first, then through addresses
    // This is done to save gas: should be able to get 50-100k address in here on harmony
    function addressAtIndex(uint256 _index) public view returns (address) {
        //find the first checkpoint above the index and iterate through that block
        uint256 subTotal = 0;
        for (uint256 i = 0; i <= tokenCounter / 100; i++) {
            if (subTotal + checkpoints[i] > _index) {
                //iterate through the checkpoints[i] block
                for (uint256 j = 0; j < 100; j++) {
                    //find the first address above the index and return it
                    if (subTotal + tokenIdToInfo[i * 100 + j].staked > _index) {
                        return ownerOf(i * 100 + j);
                    }
                    subTotal += tokenIdToInfo[i * 100 + j].staked;
                }
            } else {
                subTotal += checkpoints[i];
            }
        }
        return address(0);
    }

    function setDrawPeriod(uint256 _drawPeriod) external onlyOwner {
        drawPeriod = _drawPeriod;
    }

    function setUndelegationPeriod(
        uint256 _undelegationPeriod
    ) external onlyOwner {
        undelegationPeriod = _undelegationPeriod;
    }

    function setPrizeFee(uint256 _prizeFee) external onlyOwner {
        prizeFee = _prizeFee;
    }

    function setMinStake(uint256 _minStake) external onlyOwner {
        minStake = _minStake;
    }

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

contract StakingHelper is StakingContract {
    address[] public validators;
    address public owner;
    address public sweepstakes;
    uint256 public initiateMoveEpoch;
    uint256 public moving;

    constructor(address _sweepstakes) {
        owner = msg.sender;
        sweepstakes = _sweepstakes;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlySweepstakes() {
        require(msg.sender == sweepstakes, "Only sweepstakes");
        _;
    }

    function enter(uint256 _amount) external payable {
        require(msg.value == _amount, "Wrong Amount");
        //delegates a spread over all the validators
        for (uint256 i = 0; i < validators.length; i++) {
            require(
                _delegate(validators[i], _amount / validators.length),
                "Delegate failed"
            );
        }
        Sweepstakes(sweepstakes).enter(msg.sender, _amount);
    }

    function undelegateFromMany(uint256 _amount) external onlySweepstakes {
        //undelegates a spread over all the validators
        for (uint256 i = 0; i < validators.length; i++) {
            require(
                _undelegate(validators[i], _amount / validators.length),
                "Undelegate failed"
            );
        }
    }

    function collect() external onlySweepstakes {
        require(_collectRewards(), "Collect rewards failed");
    }

    function moveFrom(
        address _fromValidator,
        uint256 _amount
    ) external onlyOwner {
        //undelegates an amount from the validator to be reassigned
        require(moving == 0, "Already moving");
        require(_undelegate(_fromValidator, _amount), "Undelegate failed");
        uint256 currentEpoch = _epoch();
        initiateMoveEpoch = currentEpoch;
        moving = _amount;
    }

    function moveTo(address _toValidator) external onlyOwner {
        //delegates the amount to the new validator
        require(moving > 0, "Nothing to move");
        require(_epoch() > initiateMoveEpoch, "Epoch not passed");
        require(_delegate(_toValidator, moving), "Delegate failed");
        moving = 0;
    }

    function setValidators(address[] memory _validators) external onlyOwner {
        validators = _validators;
    }

    function setSweepstakes(address _sweepstakes) external onlyOwner {
        sweepstakes = _sweepstakes;
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }
}
