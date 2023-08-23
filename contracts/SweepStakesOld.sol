// SPDX-License-Identifier: GPL-3.0
// Parts copied from 2022 MerkleLabs

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./lib/StakingContract.sol";

/// @title SweepStakesOld
/// @notice Users can stake ONE in a pool and receive rewards by lottery
/// @dev StakingHelper holds the funds, stakes and unstakes etc. 
///      SweepStakesOld is the ERC721, holds the user data and runs draws.
///      It stores the amount they've staked and manages unstaking, fees etc.
///      i.e StakingHelper is the bank, SweepStakesOld is the database.

contract SweepStakesOld is ERC721Enumerable {
    uint256 public undelegationPeriod = 7; //epochs
    uint256 public checkpointSize;
    uint256 public tokenCounter;
    uint256[] public availableTokenIds;
    uint256 public totalStaked;
    uint256 public drawPeriod;
    uint256 public lastDrawTime;
    uint256 public prizeFee = 500; // 5%
    uint256 public feesToCollect;
    address public owner;
    address public beneficiary;
    address public stakingHelper;
    uint256 public minStake = 100 ether;
    address private lastWinner;
    uint256 private lastPrize;
    bool public prizeAssigned;

    struct tokenInfo {
        uint256 staked;
        uint256 unstaked;
        uint256 withdrawEpoch; // this is when we can withdraw unstaked amount
        uint256 prizes; // Withdrawable any time
    }

    mapping(uint256 => tokenInfo) public tokenIdToInfo;

    // every 100 tokens is a checkpoint, with the total up to there
    // saves gas when iterating
    mapping(uint256 => uint256) public checkpoints;

    constructor() ERC721("Sweepstakes NFTs", "SSN") {
        tokenCounter = 0;
        owner = msg.sender;
        beneficiary = msg.sender;
        drawPeriod = 3 days; //3 days for tests
        lastDrawTime = block.timestamp;
        prizeAssigned = true;
        checkpointSize = 2; // 2 for tests
        StakingHelperOld sh = new StakingHelperOld(address(this), owner);
        stakingHelper = address(sh);
    }

    event Enter(address indexed _entrant, uint256 _amount);
    event Unstake(address indexed _entrant, uint256 _amount);
    event Withdraw(address indexed _entrant, uint256 _amount);
    event DrawWinner();
    event WinnerAssigned(address indexed _winner, uint256 _amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyStaking() {
        require(msg.sender == stakingHelper, "Only staking");
        _;
    }

    // - Users can enter/stake
    function enter(address _entrant, uint256 _amount) external onlyStaking {
        require(_amount >= minStake, "Too low");
        //check if user owns tokens
        if (balanceOf(_entrant) == 0) {
            // if not, mint one
            mint(_entrant, _amount);
        } else {
            // otherwise, add to the existing one
            uint256 tokenId = tokenOfOwnerByIndex(_entrant, 0);
            tokenIdToInfo[tokenId].staked += _amount;
            checkpoints[tokenId / checkpointSize] += _amount;
        }
        // add to totalStaked
        totalStaked += _amount;

        emit Enter(_entrant, _amount);
    }

    function mint(address _to, uint256 _value) internal {
        // if there are available tokens, use one
        if (availableTokenIds.length > 0) {
            uint256 tokenId = availableTokenIds[availableTokenIds.length - 1];
            availableTokenIds.pop();
            _safeMint(_to, tokenId);
            checkpoints[tokenId / checkpointSize] += _value;
            tokenIdToInfo[tokenId] = tokenInfo(_value, 0, 0, 0);
        } else {
            // otherwise mint a new one
            _safeMint(_to, tokenCounter);
            checkpoints[tokenCounter / checkpointSize] += _value;
            tokenIdToInfo[tokenCounter] = tokenInfo(_value, 0, 0, 0);
            tokenCounter++;
        }
    }

    // unstake - will add an withdrawEpoch to the token, along with the amount to unstake

    function unstake(address _holder, uint256 _amount) external onlyStaking {
        uint256 tokenId = tokenOfOwnerByIndex(_holder, 0);
        require(
            tokenIdToInfo[tokenId].staked >= _amount,
            "Can't unstake more than you've staked"
        );
        tokenIdToInfo[tokenId].staked -= _amount;
        tokenIdToInfo[tokenId].unstaked += _amount;
        tokenIdToInfo[tokenId].withdrawEpoch =
            StakingHelperOld(stakingHelper).epoch() +
            undelegationPeriod;
        checkpoints[tokenId / checkpointSize] -= _amount;
        totalStaked -= _amount;

        emit Unstake(_holder, _amount);
    }

    //withdraw - will send the unstaked amount and/or any prizes to the user

    //if staked is zero, this will burn the token
    function withdraw() external {
        uint256 tokenId = tokenOfOwnerByIndex(msg.sender, 0);
        require(
            tokenIdToInfo[tokenId].withdrawEpoch <= StakingHelperOld(stakingHelper).epoch(),
            "Must wait until undelegation complete"
        );
        uint256 amount = tokenIdToInfo[tokenId].unstaked + tokenIdToInfo[tokenId].prizes;

        tokenIdToInfo[tokenId].unstaked = 0;
        tokenIdToInfo[tokenId].withdrawEpoch = 0;
        tokenIdToInfo[tokenId].prizes = 0;
        if (tokenIdToInfo[tokenId].staked == 0) {
            burn(tokenId);
        }
        StakingHelperOld(stakingHelper).payUser(msg.sender, amount);

        emit Withdraw(msg.sender, amount);
    }

    function claimPrizes() external {
        uint256 tokenId = tokenOfOwnerByIndex(msg.sender, 0);
        uint256 amount = tokenIdToInfo[tokenId].prizes;
        tokenIdToInfo[tokenId].prizes = 0;
        StakingHelperOld(stakingHelper).payUser(msg.sender, amount);

        emit Withdraw(msg.sender, amount);
    }

    function burn(uint256 _tokenId) internal {
        _burn(_tokenId);
        delete tokenIdToInfo[_tokenId];
        // make token available for reuse
        availableTokenIds.push(_tokenId);
    }

    // We draw the winner and assign to a private variable to prevent malicious draws
    function drawWinner() external {
        require(block.timestamp > lastDrawTime + drawPeriod, "Too soon");
        if (!prizeAssigned) {
            assignPrize();
        }
        uint index = vrf() % totalStaked;
        lastWinner = addressAtIndex(index);
        lastPrize = StakingHelperOld(stakingHelper).collect();
        lastDrawTime = block.timestamp;
        prizeAssigned = false;

        emit DrawWinner();
    }

    function assignPrize() public {
        require(prizeAssigned == false);
        require(block.timestamp > lastDrawTime, "can't execute with draw");
        //get the token of the winner and add the amount to the prizes
        uint256 tokenId = tokenOfOwnerByIndex(lastWinner, 0);
        tokenIdToInfo[tokenId].prizes +=
            (lastPrize * (10000 - prizeFee)) /
            10000;
        feesToCollect += (lastPrize * prizeFee) / 10000;
        prizeAssigned = true;

        emit WinnerAssigned(lastWinner, lastPrize);
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = feesToCollect;
        feesToCollect = 0;
        StakingHelperOld(stakingHelper).payUser(beneficiary, amount);
    }

    // Iterates through checkpoints first, then through addresses
    // This is done to save gas: should be able to get 50-100k address in here on harmony
    function addressAtIndex(uint256 _index) public view returns (address) {
        require(_index < totalStaked, "Index out of range");
        //find the first checkpoint above the index and iterate through that block
        uint256 subTotal = 0;
        for (uint256 i = 0; i <= tokenCounter / checkpointSize; i++) {
            if (subTotal + checkpoints[i] > _index) {
                //iterate through the checkpoints[i] block
                for (uint256 j = 0; j < checkpointSize; j++) {
                    //find the first address above the index and return it
                    if (
                        subTotal +
                            tokenIdToInfo[i * checkpointSize + j].staked >
                        _index
                    ) {
                        return ownerOf(i * checkpointSize + j);
                    }
                    subTotal += tokenIdToInfo[i * checkpointSize + j].staked;
                }
            } else {
                subTotal += checkpoints[i];
            }
        }
        return address(0);
    }

    function setBeneficiary(address _beneficiary) external onlyOwner {
        beneficiary = _beneficiary;
    }

    function setStakingHelper(address _stakingHelper) external onlyOwner {
        stakingHelper = _stakingHelper;
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

     function setDrawPeriod(uint256 _drawPeriod) external onlyOwner {
        drawPeriod = _drawPeriod;
    }

    function setUndelegationPeriod(
        //epochs
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

    function getNFTValue(uint256 _tokenId) external view returns (uint256) {
        return
            tokenIdToInfo[_tokenId].staked +
            tokenIdToInfo[_tokenId].unstaked +
            tokenIdToInfo[_tokenId].prizes;
    }
}

contract StakingHelperOld is StakingContract {
    address[] public validators;
    address public owner;
    address public sweepstakes;
    uint256 public initiateMoveEpoch;
    uint256 public moving;
    uint256 public extraFunds;
    mapping(address => uint256) public delegatedToValidator;

    constructor(address _sweepstakes, address _owner) StakingContract() {
        owner = _owner;
        sweepstakes = _sweepstakes;
    }

    event MoveStarted(address indexed _fromValidator, uint256 _amount);
    event MoveCompleted(uint256 _amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlySweepstakes() {
        require(msg.sender == sweepstakes, "Only sweepstakes");
        _;
    }

    function juicePrizePool() public payable {
        //extra funds get automatically raffled in the next draw
        extraFunds += msg.value;
    }

    function enter(uint256 _amount) external payable {
        require(msg.value == _amount, "Wrong Amount");
        //delegates a spread over all the validators
        for (uint256 i = 0; i < validators.length; i++) {
            require(
                _delegate(validators[i], _amount / validators.length),
                "Delegate failed"
            );
            delegatedToValidator[validators[i]] += _amount / validators.length;
        }
        SweepStakesOld(sweepstakes).enter(msg.sender, _amount);
    }

    function unstake(uint256 _amount) external {
        //withdraws a spread over all the validators
        for (uint256 i = 0; i < validators.length; i++) {
            require(
                _undelegate(validators[i], _amount / validators.length),
                "Withdraw failed"
            );
            delegatedToValidator[validators[i]] -= _amount / validators.length;
        }
        SweepStakesOld(sweepstakes).unstake(msg.sender, _amount);
    }

//collect is called by the sweepstakes contract to collect rewards and add to the prize pool, extraFunds are also added.
    function collect() external onlySweepstakes returns (uint256) {
        uint256 balance = address(this).balance + extraFunds;
        extraFunds = 0;
        require(_collectRewards(), "Collect rewards failed");
        return address(this).balance - balance;
    }

    function payUser(address _user, uint256 _amount) external onlySweepstakes {
        payable(_user).transfer(_amount);
    }

    //this function is to reallocate funds to set validators if one has been removed
    function moveFromOldValidator(
        address _fromValidator
    ) external onlyOwner {
        //check that the validator has been removed
        require(
            !isValidator(_fromValidator),
            "Validator still active"
        );
        //undelegates from the validator to be reassigned
        require(moving == 0, "Already moving");
        uint256 amount = delegatedToValidator[_fromValidator];
        delegatedToValidator[_fromValidator] = 0;
        require(_undelegate(_fromValidator, amount), "Undelegate failed");
        uint256 currentEpoch = epoch();
        initiateMoveEpoch = currentEpoch;
        moving = amount;

        emit MoveStarted(_fromValidator, moving);
    }

    function moveToCurrentValidators() external onlyOwner {
        require(moving > 0, "Nothing to move");
        require(epoch() > initiateMoveEpoch, "Epoch not passed");
        //delegates a spread over all the validators
        for (uint256 i = 0; i < validators.length; i++) {
            require(
                _delegate(validators[i], moving / validators.length),
                "Delegate failed"
            );
        }
        moving = 0;

        emit MoveCompleted(moving);
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

    function isValidator(address _validator) public view returns (bool) {
        for (uint256 i = 0; i < validators.length; i++) {
            if (validators[i] == _validator) {
                return true;
            }
        }
        return false;
    }
}
