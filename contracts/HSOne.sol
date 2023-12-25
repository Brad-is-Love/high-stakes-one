// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

//pausable 
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// This is High Stakes ONE, the settlement token for instant withdrawals on High Stakes.
// Users can stake an NFT from SweepstakesNFTs and receive the eqaul value in HSONE, which can be traded for ONE.
// That NFT can be purchased by other users for the same amount of HSONE.
// Made Pausable in case we need to upgrade the SweepstakesNFTs contract.

contract HighStakesONE is ERC20Pausable, IERC721Receiver {
    address public sweepStakesNFTs;
    mapping (uint256 => uint256) public stakedNFTsToPrice;
    address public owner;
    uint256 public fee = 30; //0.3%
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public beneficiary;

    // Events
    event StakeNFT(uint256 indexed _tokenId, uint256 _price);
    event UnstakeNFT(uint256 indexed _tokenId, uint256 _price);

    constructor(address _sweepStakesNFTs) ERC20("High Stakes ONE", "HSONE") {
        sweepStakesNFTs = _sweepStakesNFTs;
        owner = msg.sender;
        beneficiary = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function onERC721Received (
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // Stake an NFT from SweepstakesNFTs and receive the equal value in HSONE.
    function stakeNFT(uint256 _tokenId) external {
        uint256 price = iSweepstakesNFTs(sweepStakesNFTs).getNFTValue(_tokenId);
        require(stakedNFTsToPrice[_tokenId] == 0, "NFT is already staked");
        require(price > 0, "NFT has no value");
        uint256 tax = price * fee / FEE_DENOMINATOR;
        iSweepstakesNFTs(sweepStakesNFTs).safeTransferFrom(msg.sender, address(this), _tokenId);
        stakedNFTsToPrice[_tokenId] = price;
        _mint(msg.sender, price-tax);
        _mint(beneficiary, tax);

        emit StakeNFT(_tokenId, price);
    }

    // Burn HSONE to receive an NFT
    function unstakeNFT(uint256 _tokenId) external {
        uint256 price = stakedNFTsToPrice[_tokenId];
        require(price > 0, "NFT is not staked");
        stakedNFTsToPrice[_tokenId] = 0;
        _burn(msg.sender, price);
        iSweepstakesNFTs(sweepStakesNFTs).transferFrom(address(this), msg.sender, _tokenId);

        emit UnstakeNFT(_tokenId, price);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function setOwner(address _owner) external onlyOwner {
        owner = _owner;
    }

    function setSweepStakesNFTs(address _sweepStakesNFTs) external onlyOwner {
        sweepStakesNFTs = _sweepStakesNFTs;
    }

    function setFee (uint256 _fee) external onlyOwner {
        fee = _fee;
    }

    function setBeneficiary(address _beneficiary) external onlyOwner {
        beneficiary = _beneficiary;
    }

    function getNFTPrice(uint256 _tokenId) external view returns (uint256) {
        return stakedNFTsToPrice[_tokenId];
    }
}

interface iSweepstakesNFTs is IERC721{
    // Returns the value of the NFT in ONE (staked plus unstaked)
    function getNFTValue(uint256 _tokenId) external view returns (uint256);
}

