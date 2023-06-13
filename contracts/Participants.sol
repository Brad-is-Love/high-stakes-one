//// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import { StakingPrecompiles, Directive } from "./StakingPrecompiles.sol";

/// @title Participants contract
/// @notice This contract is used to keep track of participants and their tickets. It will return the winner when an index is passed in from the lottery contract.
/// @dev If gas gets too high (participants > a few thousand), deploy it again and modify the lottery contract to use both. e.g. if index>totalStaked, find the winner in the second contract.

contract Participants {
    address public owner;
    address public delegatorContract;
    mapping(address => uint256) public tickets;
    mapping(address => uint256) public participantIndex;
    address[] public participants;
    uint256 public prize;
    uint256 public totalStaked;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier onlyDelegator() {
        require(msg.sender == delegatorContract, "Only the delegator contract can call this function");
        _;
    }

    function setDelegator(address _delegatorContract) public onlyOwner {
        delegatorContract = _delegatorContract;
    }

    function setOwner(address _owner) public onlyOwner {
        owner = _owner;
    }


    function buyTickets(address _participant, uint256 amount) public onlyDelegator {
        if(tickets[_participant] == 0){
            participants.push(_participant);
            participantIndex[_participant] = participants.length-1;
        }
        tickets[_participant]+=amount;
        totalStaked+=amount;
    }

    function refundTickets(address _participant, uint256 amount) public onlyDelegator {
        require(tickets[_participant] >= amount, "You don't have enough tickets to refund");
        tickets[_participant]-=amount;
        if(tickets[_participant] == 0){
            //find the index of the person who has just withdrawn
            uint index = participantIndex[_participant];
            //make the participant at that index the last person in the array
            participants[index] = participants[participants.length-1];
            //make the index in the mapping correct
            participantIndex[participants[index]] = index;
            // pop off the last dude
            participants.pop();
        }
        totalStaked-=amount;
    }

//this function costs ~1M gas with 1000 loops - if gas gets too high, deploy another contract and modify the lottery contract to use both
    function findIndex(uint index) public view returns (address) {    
        uint sum = 0;
        address winner = address(0);
        for(uint i=0;i<=participants.length;i++){
            sum+=tickets[participants[i]];
            if(sum>=index){
                winner = participants[i];
                break;
            }
        }
        return winner;
    }

    function getTotalParticipants() public view returns (uint256) {
        return participants.length;
    }
}

///@title Delegator contract
///@notice This contract is used to delegate, undelegate, migrate between validators and collect rewards.

contract Delegator is StakingPrecompiles {
    address public owner;
    address public participantsContract;
    address public lotteryContract;
    address[] public validators;
    mapping (address => uint256) public stakedToValidators;
    //Should pendingWithdrawals be stored in the participants contract?
    mapping (address => uint256) public pendingWithdrawals;

    event StakingPrecompileCalled(uint8 directive, bool success);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier onlyParticipants() {
        require(msg.sender == participantsContract, "Only the participants contract can call this function");
        _;
    }

    modifier onlyLottery() {
        require(msg.sender == lotteryContract, "Only the lottery contract can call this function");
        _;
    }

    function setParticipantsContract(address _participantsContract) public onlyOwner {
        participantsContract = _participantsContract;
    }

    function setLotteryContract(address _lotteryContract) public onlyOwner {
        lotteryContract = _lotteryContract;
    }

    function setValidators(address[] memory _validators) public onlyOwner {
        validators = _validators;
    }

    function stake(uint256 amount) public payable {
        require(msg.value == amount, "You must send the correct amount");
        require(amount >= 100**18, "You must stake more than 100");
        Participants(participantsContract).buyTickets(msg.sender, amount);
        address _validator = validatorSelection(true);
        _delegate(_validator, amount);
        stakedToValidators[_validator] += amount;
    }

    function unstake(uint256 amount) public {
        require(amount <= Participants(participantsContract).tickets(msg.sender), "You don't have enough tickets to withdraw");
        Participants(participantsContract).refundTickets(msg.sender, amount);
        address _validator = validatorSelection(false);
        _undelegate(_validator, amount);
        stakedToValidators[_validator] -= amount;
        //We need to write some functions to handle this
            //How do we wait until the withdraw is available i.e. 7 epochs?
                //mapping to mapping address=>uint=>uint undelegations - probably should be stored in the participants contract
            //How do we get the instant withdrawals part working? Should we worry about that?
    }

    function getPrizes() public {
        (, uint256 prizes) = _collectRewards();
        address winner = Lottery(lotteryContract).draw();
        pendingWithdrawals[winner] += prizes*95/100;
        pendingWithdrawals[owner] += prizes*5/100;
    }

    function withdraw() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "You don't have any pending withdrawals");
        pendingWithdrawals[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
    
//the following two functions are in case we need to switch validators
    function ownerUndelegate(address validatorAddress, uint256 amount) public onlyOwner {
        _undelegate(validatorAddress, amount);
    }

    function ownerDelegate(address validatorAddress, uint256 amount) public onlyOwner {
        _delegate(validatorAddress, amount);
    }

    function _delegate(address validatorAddress, uint256 amount) internal returns (bool, uint256) {
        uint256 result = delegate(validatorAddress, amount);
        bool success = result != 0;
        require(success, "Delegate failed");
        emit StakingPrecompileCalled(uint8(Directive.DELEGATE), success);
        return (success, result);
    }

    function _undelegate(address validatorAddress, uint256 amount) internal returns (bool, uint256) {
        uint256 result = undelegate(validatorAddress, amount);
        bool success = result != 0;
        require(success, "Undelegate failed");
        emit StakingPrecompileCalled(uint8(Directive.UNDELEGATE), success);
        return (success, result);
    }

    function _collectRewards() public returns (bool, uint256) {
        uint256 result = collectRewards();
        bool success = result != 0;
        require(success, "Collect rewards failed");
        emit StakingPrecompileCalled(uint8(Directive.COLLECT_REWARDS), success);
        return (success, result);
    }

    function validatorSelection(bool _enter) internal view returns (address) {
        address validator = validators[0];
        if(_enter){
            //if entering, find the validator with the least amount staked and stake there
            for(uint i=1;i<validators.length;i++){
                if(stakedToValidators[validators[i]] < stakedToValidators[validator]){
                    validator = validators[i];
                }
            }
        } else {
            //if withdrawing, find the validator with the most amount staked and withdraw from there
            for(uint i=1;i<validators.length;i++){
                if(stakedToValidators[validators[i]] > stakedToValidators[validator]){
                    validator = validators[i];
                }
            }
        }
        return validator;
    }

}

///@title Lottery contract
///@notice This contract draws random numbers using the Harmony VRF and gets addresses from the participants array.
contract Lottery {
    address public owner;
    address public participantsContract;
    address public delegatorContract;
    uint256 public drawPeriod;
    uint256 public lastDraw;

    event LotteryDrawn(uint256[] winners);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier onlyParticipants() {
        require(msg.sender == participantsContract, "Only the participants contract can call this function");
        _;
    }

    constructor(address _participantsContract, address _delegatorContract, uint256 _drawPeriod) {
        owner = msg.sender;
        participantsContract = _participantsContract;
        delegatorContract = _delegatorContract;
        drawPeriod = _drawPeriod;
        lastDraw = block.timestamp;
    }

    function setParticipantsContract(address _participantsContract) public onlyOwner {
        participantsContract = _participantsContract;
    }

    function setDelegatorContract(address _delegatorContract) public onlyOwner {
        delegatorContract = _delegatorContract;
    }

    function setDrawPeriod(uint256 _drawPeriod) public onlyOwner {
        drawPeriod = _drawPeriod;
    }

    function draw() public  returns (address winner) {
        require(block.timestamp >= lastDraw + drawPeriod, "You must wait until the draw period is over");
        lastDraw = block.timestamp;
        //get the total number of tickets
        uint256 totalTickets = Participants(participantsContract).totalStaked();
        //get a random number between 0 and the total number of tickets using the Harmony VRF
        uint256 randomNumber = vrf() % totalTickets;
        //get the addresses of the participant
        return Participants(participantsContract).findIndex(randomNumber);
    }

    function vrf() public view returns (uint256 result) {
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