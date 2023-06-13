// SPDX-License-Identifier: GPL-3.0
// Parts copied from 2022 MerkleLabs

pragma solidity ^0.8.9;

// A system where users can stake ONE in a pool and receive rewards by lottery

/*

- Users can unstake, sets an endEpoch to allow withdrawals
- Owner can rebalance
- Users can always unstake, takes from top validator first then the others
- Has roles: owner, lottery
- Returns address from index
- Pays out winner if called by lottery
- Has totalStaked and totalStakers
- Zeros an NFT and resets owner if withdrawn
- Can't leave a ticket of less than 100 ONE
- Reallocates zeroed NFTs  
- Every 100th token is a checkpoint
*/

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../StakingContract.sol";

/// @title SweepStakesNFTs
/// @notice Users can stake ONE in a pool and receive rewards by lottery
/// @dev Users receive an NFT which is there ticket to the lottery.
///      It stores the amount they've staked and manages unstaking.
///      The lottery contract calls the addressAtIndex function to find the winner.
///      This iterates through all the holders, summing the amount staked.
contract SweepStakesNFTs is ERC721, Ownable, StakingContract {
    uint256 public tokenCounter;
    uint256[] public availableTokenIds;
    uint256 public totalStaked;
    uint256 public initiateMoveEpoch;
    uint256 public moving;
    uint256 public undelegationPeriod = 7; //epochs
    uint256 public drawPeriod;
    uint256 public lastDrawTime;

    Lottery public lottery;
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
    address[] public validators;

    constructor() ERC721("SweepStakesNFTs", "SSN") {
        tokenCounter = 0;
        owner = msg.sender;
        lottery = new Lottery(address(this), msg.sender);
        drawPeriod = 7 days;
    }

    // - Users can enter/stake
    function stake(uint256 _amount) external payable {
        require(msg.value == _amount, "Must send the correct amount of ONE");
        require(_amount >= 100 ether, "Must stake at least 100 ONE");
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
        require(undelegateFromMany(_amount), "Undelegate failed");
    }

    //withdraw - will send the unstaked amount to the user
    //if staked is zero, this will burn the token

    function withdraw() external {
        uint256 tokenId = tokenOfOwnerByIndex(msg.sender, 0);
        require(
            tokenIdToInfo[tokenId].endEpoch <= _epoch(),
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
        checkpoints[tokenId / 100 + 1] -= _value;
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
        tokenIdToInfo[tokenId].prizes += amount;
        lastDrawTime = block.timestamp;
    }

    // claims rewards for the entire pool and returns the amount claimed
    function claimRewards() internal returns (uint256) {
        uint256 initialBalance = address(this).balance;
        require(_collectRewards(), "Collect rewards failed");
        uint256 finalBalance = address(this).balance;
        return finalBalance - initialBalance;
    }

    //owner can claim prizes
    function claimPrizes() {
        uint256 tokenId = tokenOfOwnerByIndex(msg.sender, 0);
        uint256 amount = tokenIdToInfo[tokenId].prizes;
        tokenIdToInfo[tokenId].prizes = 0;
        payable(msg.sender).transfer(amount);
    }

    // This function is called by the lottery contract
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

    function delegateToMany(uint256 _amount) internal {
        //delegates a spread over all the validators
        for (uint256 i = 0; i < validators.length; i++) {
            require(
                _delegate(validators[i], _amount / validators.length),
                "Delegate failed"
            );
        }
    }

    function undelegateFromMany(uint256 _amount) internal {
        //undelegates a spread over all the validators
        for (uint256 i = 0; i < validators.length; i++) {
            require(
                _undelegate(validators[i], _amount / validators.length),
                "Undelegate failed"
            );
        }
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

    function setUndelegationPeriod(
        uint256 _undelegationPeriod
    ) external onlyOwner {
        undelegationPeriod = _undelegationPeriod;
    }

    function setDrawPeriod(uint256 _drawPeriod) external onlyOwner {
        drawPeriod = _drawPeriod;
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
