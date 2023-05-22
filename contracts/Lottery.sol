// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/// @title A contract that allows users to stake ONE tokens where rewards are paid out in a lottery
/// @notice This contract is not yet audited 

// Lottery opens, the StONE price is saved as openingPrice
// 1 ticket is ticketPrice x current StONE price / openingPrice
// When it closes, the prize pool is tickets * ticketPrice * (closingPrice - openingPrice)


contract Lottery {
    address public manager;
    uint public ticketPrice;
    mapping(address => uint) public tickets;
    mapping(address => uint[]) public participantIndices;
    address[] public participants;
    uint public winnerIndex;

    event TicketPurchased(address indexed participant, uint ticketCount);
    event TicketRefunded(address indexed participant, uint ticketCount);
    event WinnerSelected(address indexed winner, uint winnings);

    constructor() {
        manager = msg.sender;
        ticketPrice = 1 ether; // Set the ticket price to 1 ether, you can adjust this as needed
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
