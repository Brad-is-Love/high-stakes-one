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

// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../StakingContract.sol";

contract SweepStakesNFTs is ERC721, Ownable, StakingContract {

    uint256 public tokenCounter;
    uint256 [] public availableTokenIds;
    uint256 public totalStaked;

    Lottery public lottery;
    struct tokenInfo {
        uint256 staked;
        uint256 withdrawableAtEpoch;
        uint256 prizes; // DO WE WANT THIS SEPARATE??
    }

    mapping(uint256 => tokenInfo) public tokenIdToInfo;
    // every 100 tokens is a checkpoint, with the total up to there
    // saves gas when iterating
    mapping(uint256 => uint256) public checkpoints;

    constructor() ERC721("SweepStakesNFTs", "SSN") {
        tokenCounter = 0;
        owner = msg.sender;
        lottery = new Lottery(address(this));
    }

// - Users can enter/stake
    function stake(uint256 _amount) external payable {
        require(msg.value == _amount, "Must send the correct amount of ONE");
        require(_amount >= 100 ether, "Must stake at least 100 ONE");
        address selectedValidator = selectValidator();
        _delegate(_amount);
        mint(msg.sender, _amount);
        // add to totalStaked
        totalStaked += _amount;
    }

    function selectValidator() internal returns (address) {
        

    function mint(address _to, uint256 _value) internal {
        // if there are available tokens, use one
        if(availableTokenIds.length > 0) {
            uint256 tokenId = availableTokenIds[availableTokenIds.length-1];
            availableTokenIds.pop();
            _safeMint(_to, tokenId);
            checkpoints[tokenId/100] += _value;
            tokenIdToInfo[tokenId] = tokenInfo(_value, 0, 0);
            return;
        } else {
            // otherwise mint a new one
            _safeMint(_to, tokenCounter);
            checkpoints[tokenCounter/100] += _value;
            tokenIdToInfo[tokenCounter] = tokenInfo(_value, 0, 0);
            tokenCounter++;
        }

    }

    function burn(uint256 _tokenId) internal {
        checkpoints[tokenId/100+1] -= _value;
        _burn(_tokenId);
        delete tokenIdToInfo[_tokenId];
        // make token available for reuse
        availableTokenIds.push(_tokenId);
    }

// This function is called by the lottery contract
// Iterates through checkpoints first, then through addresses
// This is done to save gas: should be able to get maybe 100k address in here on harmony 
    function returnAddress(uint256 _index) public view returns (address) {
        //find the first checkpoint above the index and iterate through that block
        uint256 subTotal = 0;
        for(uint256 i = 0; i <= tokenCounter/100; i++) {
            if(subTotal + checkpoints[i] > _index) {
                //iterate through the checkpoints[i] block
                for(uint256 j = 0; j < 100; j++) {
                    //find the first address above the index and return it
                    if(subTotal + tokenIdToInfo[i*100+j].staked > _index) {
                        return ownerOf(i*100+j);
                    }
                    subTotal += tokenIdToInfo[i*100+j].staked;
                }
            } else {
                subTotal += checkpoints[i];
            }
        }
        return address(0);
    }

}