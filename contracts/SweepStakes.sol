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

contract SweepStakesNFTs is ERC721Enumerable {
    uint256 public undelegationPeriod = 7; //epochs
    uint256 public pageSize;
    mapping(uint256 => uint256) public pages;
    uint256 public tokenCounter;
    uint256[] public availableTokenIds; //tokens that have been burned and are available for reuse
    uint256 public totalStaked;
    uint256 public drawPeriod;
    uint256[] public prizeSchedule; // An array of the % of the prize pool given for each draw. This allows for different sized draws.
    uint256 public prizeScheduleIndex; // where we are in the prize schedule - we iterate through the week with larger draws on the weekend.
    uint256 public lastDrawTime;
    uint256 public prizeFee = 300; // 3%
    uint256 public feesToCollect; //beneficiary can withdraw these
    address public owner;
    address public beneficiary;
    address public stakingHelper;
    uint256 public minStake = 100 ether; // This was changed to 20 ONE after deployment
    uint256 private lastWinner; //last winner is assigned to private variable on draw and revealed on assignPrize to prevent malicious draws
    uint256 public prizePool;
    bool public prizeAssigned;
    bool internal locked;

    struct tokenInfo {
        uint256 staked;
        uint256 unstaked;
        uint256 withdrawEpoch;
    }

    mapping(uint256 => tokenInfo) public tokenIdToInfo;

// add inputs to map existing tokens values on deployment because we updated previous contract.
    constructor(address[] memory _holders, uint256[] memory _staked, uint256[] memory _unstaked, uint256[] memory _withdrawEpochs) ERC721("Sweepstakes NFTs", "SSN") {
        tokenCounter = 0;
        owner = msg.sender;
        beneficiary = msg.sender;
        drawPeriod = 23 * 60 * 60; //23 hours
        lastDrawTime = block.timestamp;
        prizeAssigned = true;
        pageSize = 100;
        for(uint256 i = 0; i < _holders.length; i++){
            _safeMint(_holders[i], tokenCounter);
            addStake(tokenCounter, _staked[i]);
            tokenIdToInfo[tokenCounter].unstaked = _unstaked[i];
            tokenIdToInfo[tokenCounter].withdrawEpoch = _withdrawEpochs[i];
            tokenCounter++;
        }
    }

    event Enter(uint256 indexed _tokenId, uint256 _amount);
    event Unstake(uint256 indexed _tokenId, uint256 _amount);
    event Withdraw(uint256 indexed _tokenId, uint256 _amount);
    event DrawWinner();
    event WinnerAssigned(uint256 winningTicket, uint256 indexed _winner, uint256 _amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyStaking() {
        require(msg.sender == stakingHelper, "Only staking");
        _;
    }

    // enter - will mint a new token and add the stake to the token
    function enter(address _entrant, uint256 _amount) external onlyStaking {
        require(_amount >= minStake, "Too low");
        uint256 tokenId = 0;
        // if there are available tokens, use one
        if (availableTokenIds.length > 0) {
            tokenId = availableTokenIds[availableTokenIds.length - 1];
            availableTokenIds.pop();
            _safeMint(_entrant, tokenId);
        } else {
            // otherwise mint a new one
            tokenId = tokenCounter;
            _safeMint(_entrant, tokenCounter);
            tokenCounter++;
        }

        addStake(tokenId, _amount);
        emit Enter(tokenId, _amount);
    }

    // addToToken - will add the stake to existing token
    function addToToken(address _entrant, uint256 _amount, uint256 _tokenId) external onlyStaking {
        require(_amount >= minStake, "Too low");
        require(_isApprovedOrOwner(_entrant, _tokenId), "Not owner or approved");
        addStake(_tokenId, _amount);

        emit Enter(_tokenId, _amount);
    }

    // unstake - will add a withdrawEpoch to the token, along with the amount to unstake
    function unstake(address _holder, uint256 _amount, uint256 _tokenId) external onlyStaking {
        require(tokenIdToInfo[_tokenId].staked >= _amount,"Can't unstake more than you've staked");
        require(_isApprovedOrOwner(_holder, _tokenId), "Not owner or approved");
        tokenIdToInfo[_tokenId].staked -= _amount;
        tokenIdToInfo[_tokenId].unstaked += _amount;
        tokenIdToInfo[_tokenId].withdrawEpoch =
            StakingHelper(stakingHelper).epoch() +
            undelegationPeriod;
        pages[_tokenId / pageSize] -= _amount;
        totalStaked -= _amount;

        emit Unstake(_tokenId, _amount);
    }

    //withdraw - will send the unstaked amount to the user
    //if staked is zero, this will burn the token
    function withdraw(uint256 _tokenId) external {
        require(locked == false, "No reentrancy");
        locked = true;
        require(tokenIdToInfo[_tokenId].withdrawEpoch <= StakingHelper(stakingHelper).epoch(), "Must wait until undelegation complete");
        require(_isApprovedOrOwner(msg.sender, _tokenId), "Not owner or approved");
        uint256 amount = tokenIdToInfo[_tokenId].unstaked;
        tokenIdToInfo[_tokenId].unstaked = 0;
        tokenIdToInfo[_tokenId].withdrawEpoch = 0;
        //will burn the token if staked is zero
        if (tokenIdToInfo[_tokenId].staked == 0) {
            burn(_tokenId);
        }
        StakingHelper(stakingHelper).payUser(msg.sender, amount);

        emit Withdraw(_tokenId, amount);
        locked = false;
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
        require(prizeAssigned == true, "Prize not assigned");
        lastWinner = vrf() % (totalStaked - 1);
        lastDrawTime = block.timestamp;
        prizeAssigned = false;

        emit DrawWinner();
    }

    // Assigns the prize to the winner and re-stakes it
    function assignPrize() public {
        require(prizeAssigned == false);
        prizeAssigned = true;
        require(block.timestamp > lastDrawTime, "can't execute with draw");
        prizePool += StakingHelper(stakingHelper).collect();
        
        if(lastWinner > totalStaked-1){
            lastWinner = lastWinner % (totalStaked - 1);
        }
        uint256 prize = prizePool * prizeSchedule[prizeScheduleIndex] / 100; 
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
        
        //auto compound prizes
        addStake(winningToken, prize);
        StakingHelper(stakingHelper).autoCompound(prize);

        emit WinnerAssigned(lastWinner, winningToken, prize);
    }

    function addStake(uint256 _tokenId, uint256 _amount) internal {
        tokenIdToInfo[_tokenId].staked += _amount;
        pages[_tokenId / pageSize] += _amount;
        totalStaked += _amount;
    }

    //withdrawFees - will send the fees to the beneficiary
    function withdrawFees() external {
        require(msg.sender == beneficiary, "Only beneficiary");
        uint256 amount = feesToCollect;
        feesToCollect = 0;
        StakingHelper(stakingHelper).payUser(beneficiary, amount);
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
                    if (subTotal + tokenIdToInfo[tokenId].staked >= _index) {
                        return tokenId;
                    }
                    subTotal += tokenIdToInfo[tokenId].staked;
                }
            }
            subTotal += pages[page];
        }
        //should never get to here
        require(false, "Winner not found");
        return (0);
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

    function setPrizeSchedule(uint256[] memory _prizeSchedule) external onlyOwner {
        require(_prizeSchedule.length > 0, "No prize schedule");
        for (uint256 i = 0; i < _prizeSchedule.length; i++) {
            require(_prizeSchedule[i]<=100, "Cant be more than 100% of prizepool");
        }
        prizeSchedule = _prizeSchedule;
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

    //Allow returning the total value of a token for loans/defi
    function getNFTValue(uint256 _tokenId) external view returns (uint256) {
        return
            tokenIdToInfo[_tokenId].staked + tokenIdToInfo[_tokenId].unstaked;
    }
}

//StakingHelper uses the staking precompiles from here: https://github.com/MaxMustermann2/harmony-staking-precompiles
contract StakingHelper is StakingContract {
    address[] public validators;
    address public owner;
    address public sweepstakes;
    uint256 public initiateMoveEpoch;
    uint256 public pendingDelegation;
    uint256 public minDelegation = 100 ether;
    uint256 public moving;
    uint256 public extraFunds;
    bool internal locked;
    mapping(address => uint256) public delegatedToValidator;

    constructor(address _sweepstakes, address _owner, uint256 _stake, address[] memory _validators) StakingContract() payable {
        owner = _owner;
        sweepstakes = _sweepstakes;
        validators = _validators;
        spreadStake(_stake);
    }

    event MoveStarted(uint256 _amount);
    event MoveCompleted(uint256 _amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlySweepstakes() {
        require(msg.sender == sweepstakes, "Only sweepstakes");
        _;
    }

    modifier noReentrancy() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }

    // Can add funds to the prize pool for the next draw
    function juicePrizePool() public payable {
        extraFunds += msg.value;
    }

    function enter(uint256 _amount) external payable noReentrancy {
        require(msg.value == _amount, "Wrong Amount");
        SweepStakesNFTs(sweepstakes).enter(msg.sender, _amount);
        spreadStake(_amount);
    }

    function addToToken(uint256 _amount, uint256 _tokenId) external payable noReentrancy {
        require(msg.value == _amount, "Wrong Amount");
        SweepStakesNFTs(sweepstakes).addToToken(msg.sender, _amount, _tokenId);
        spreadStake(_amount);
    }

    function autoCompound(uint256 _amount) external onlySweepstakes {
        spreadStake(_amount);
    }

    function unstake(uint256 _amount, uint256 _tokenId) external noReentrancy {
        require(moving == 0, "Can't unstake while changing validators");
        SweepStakesNFTs(sweepstakes).unstake(msg.sender, _amount, _tokenId);
        uint256 toUnstake = _amount;
        //if unstaking more than in pendingDelegations:
        //subtract then zero pending, then unstake
        if(toUnstake > pendingDelegation){
            toUnstake -= pendingDelegation;
            pendingDelegation = 0;
            //then unstake
            for (uint256 i = 0; i < validators.length; i++) {
                require(
                    _undelegate(validators[i], toUnstake / validators.length),
                    "Undelegate failed"
                );
                delegatedToValidator[validators[i]] -= toUnstake / validators.length;
            }
        } else {
            //just subtract from pending
            pendingDelegation -= toUnstake;
        }
    }

    //collect is called by the sweepstakes contract to collect rewards and add to the prize pool, extraFunds are also added.
    function collect() external onlySweepstakes returns (uint256) {
        uint256 balance = address(this).balance;
        balance -= extraFunds;
        extraFunds = 0;
        require(_collectRewards(), "Collect rewards failed");
        return address(this).balance - balance;
    }

    function payUser(address _user, uint256 _amount) external onlySweepstakes {
        payable(_user).transfer(_amount);
    }

    //this function is to rebalance funds and set the new validators array.
    //Will first unstake all from the current validators, then update the validators array to the new addresses
    //This will allow people to continue entering the sweepstakes while the rebalance is happening
    //although unstake will have to wait until the rebalance is complete.
    function rebalanceStart(address[] memory _newValidators) external onlyOwner {
        require(_newValidators.length > 0, "No validators given");
        require(moving == 0, "Already moving");
        for (uint256 i = 0; i < validators.length; i++) {
            uint256 amount = delegatedToValidator[validators[i]];
            delegatedToValidator[validators[i]] = 0;
            require(_undelegate(validators[i], amount), "Undelegate failed");
            moving += amount;
        }
        initiateMoveEpoch = epoch();

        validators = _newValidators;

        emit MoveStarted(moving);
    }

    //anyone can close out the rebalance after the epoch has passed
    function rebalanceEnd() external noReentrancy {
        require(moving > 0, "Nothing to move");
        require(epoch() > initiateMoveEpoch, "Epoch not passed");
        spreadStake(moving);
        moving = 0;

        emit MoveCompleted(moving);
    }

    // the helper function to spread the stake over the validators
    function spreadStake(uint256 _amount) internal {
        //add the amount to the pending delegation
        uint256 toStake = pendingDelegation + _amount;
        if (toStake / validators.length < minDelegation) {
            //if less than the minimum delegation, add to pending
            pendingDelegation = toStake;
        } else {
            //delegates a spread over all the validators
            for (uint256 i = 0; i < validators.length; i++) {
                require(
                    _delegate(validators[i], toStake / validators.length),
                    "Delegate failed"
                );
                delegatedToValidator[validators[i]] +=
                    toStake /
                    validators.length;
            }
            pendingDelegation = 0;
        }
    }

    function setSweepstakes(address _sweepstakes) external onlyOwner {
        sweepstakes = _sweepstakes;
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function setMinDelegation(uint256 _minDelegation) external onlyOwner {
        minDelegation = _minDelegation;
    }

    function setValidators(address[] memory _validators) external onlyOwner {
        validators = _validators;
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
