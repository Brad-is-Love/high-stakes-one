// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import { StakingPrecompiles, Directive } from "./StakingPrecompiles.sol";
/// @title This contract holds the list of entrants for the lottery and the logic to add and remove them. The lottery functionality is in Lottery.sol
/// @notice This contract is not yet audited and the owner is not yet a multi-sig wallet 

contract StakingContract is StakingPrecompiles {

    event StakingPrecompileCalled(uint8 directive, bool success);

    function acceptMoney() public payable {
    }

    function _delegate(address validatorAddress, uint256 amount) public returns (bool success) {
        uint256 result = delegate(validatorAddress, amount);
        success = result != 0;
        emit StakingPrecompileCalled(uint8(Directive.DELEGATE), success);
    }

    function _undelegate(address validatorAddress, uint256 amount) public returns (bool success) {
        uint256 result = undelegate(validatorAddress, amount);
        success = result != 0;
        emit StakingPrecompileCalled(uint8(Directive.UNDELEGATE), success);
    }

    function _collectRewards() public returns (bool success) {
        uint256 result = collectRewards();
        success = result != 0;
        emit StakingPrecompileCalled(uint8(Directive.COLLECT_REWARDS), success);
    }
}

contract Entrants {
    address public manager;
    mapping(address => uint) public tickets;
    mapping(address => uint[]) public participantIndices;
    address[] public participants;
}

contract Lottery {
    address public manager;
    uint public totalStaked;
    uint public ticketPrice;
    mapping(address => uint) public tickets;
    mapping(address => uint[]) public participantIndices;
    //split the participants arrays into 100s,1000s,10000s,100000s,1000000s
    address[] public participants;
    uint public winnerIndex;

    event TicketPurchased(address indexed participant, uint ticketCount);
    event TicketRefunded(address indexed participant, uint ticketCount);
    event WinnerSelected(address indexed winner, uint winnings);

    constructor() {
        manager = msg.sender;
        ticketPrice = 1 ether; // Set the ticket price to 1 ether, you can adjust this as needed
    }

    function getPrice() public view returns (uint) {
        //get the APY of the stakers...? Maybe just collect rewards and then calculate...
        //get rewards
        //calculate APY
    }

    function buyTickets(uint ticketCount) public payable {
        require(msg.value == ticketCount * ticketPrice, "Insufficient funds");
        
        tickets[msg.sender] += ticketCount;
        
        for (uint i = 0; i < ticketCount; i++) {
            participants.push(msg.sender);
        }
        
        emit TicketPurchased(msg.sender, ticketCount);
    }

function refundTickets(uint ticketCount) public {
    require(tickets[msg.sender] >= ticketCount, "Insufficient tickets");
    require(ticketCount > 0, "Invalid ticket count");

    tickets[msg.sender] -= ticketCount;
    
    uint refundAmount = ticketCount * ticketPrice;
    payable(msg.sender).transfer(refundAmount);
    
    // Remove participant from participants array
    for (uint i = 0; i < ticketCount; i++) {
        uint indexToRemove = participantIndices[msg.sender][i];
        address lastParticipant = participants[participants.length - 1];
        participants[indexToRemove] = lastParticipant;
        participantIndices[lastParticipant].push(indexToRemove);
        participantIndices[lastParticipant].pop();
        participants.pop();
    }
    
    emit TicketRefunded(msg.sender, ticketCount);
}


    function selectWinner() public restricted {
        require(participants.length > 0, "No participants");
        
        uint index = random() % participants.length;
        address winner = participants[index];
        winnerIndex = index;

        uint winnings = participants.length * ticketPrice;
        payable(winner).transfer(winnings);
        
        participants = new address[](0);
        
        emit WinnerSelected(winner, winnings);
    }
    
    function removeParticipant(address participant) private {
        for (uint i = 0; i < participants.length; i++) {
            if (participants[i] == participant) {
                participants[i] = participants[participants.length - 1];
                participants.pop();
                return;
            }
        }
    }

    function random() private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.timestamp, participants.length)));
    }

    modifier restricted() {
        require(msg.sender == manager, "Restricted to manager");
        _;
    }
}
