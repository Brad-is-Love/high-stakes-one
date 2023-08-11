// SPDX-FileCopyrightText: 2022 MerkleLabs
// SPDX-License-Identifier: GPL-3.0


pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../lib/StakingContract.sol";
import "./oneLidoNFT.sol";

/**
 * @title Lido on Harmony. 
 */

contract stONE is
    StakingContract,
    Ownable,
    ERC20("Staked ONE", "stONE")
{
    event StakedEvent(address indexed _from, uint256 indexed _amount);
    event UnstakedEvent(address indexed _from, uint256 indexed _amount);
    event ClaimedEvent(
        address indexed _from,
        uint256 indexed _id,
        uint256 indexed _amount
    );
    event RebalanceInitiated(
        uint256 indexed rebalanceNumber,
        address[] delegateAddresses_,
        uint256[] delegateAllocation_,
        uint256 indexed _epoch
    );
    event RedelegateEvent(
        address indexed _from,
        uint256 indexed _amount,
        uint256 indexed _burnID
    );
    event RebalanceCompleted(uint256 indexed _rebalanceNumber, uint256 indexed _epoch);
    event RewardsCollected(uint256 indexed _rewards);

    // number of rebalances so far, starts with 0
    uint256 totalRebalances;
    uint256 constant BASE = 1e4;
    
    // minimum ONEs needed to delegate to a validator 
    uint256 public MINIMUM_AMOUNT_FOR_DELEGATION = 1e20;

    // Number of epoch users have to wait for undelegation
    uint256 END_EPOCH = 7;

    // Total amount staked to the validators on rebalance
    uint256 amountStakedDuringRebalance;
    
    oneLidoNFT public immutable nONE;

    // total ONEs in the contract which can be claimed by the users
    uint256 public totalClaimableBalance;
    
    // Totak amount staked to the protocol
    uint256 public totalStaked;

    // Fee accrued so far
    uint256 public collectedFee;
    uint256 public totalRewardsCollected;

    uint256 public rewardFee; // factor of the collected fee (% / bps)
    uint256 public redemptionFee = 0;  // factor of the redemption fee (% / bps)
    uint256 public protocolRedemptionSurcharge; // pct protocol charge on redemption Fee (% / bps)

    uint256 public rebalanceInitiateEpoch;
    uint256 public rebalanceCompleteEpoch;

    // list of validator address
    address[] public validatorAddresses;

    // whether the protocol is rebalancing -> True or False
    bool public isRebalancing;
    uint256 public MINIMUM_DELEGATED_THRESHOLD = 1e20;
    bool public minDelegatedThresholdActivated = false;
    
    // amount pending to each validator
    mapping(address => uint256) public accruedPendingDelegations;
    
    // total Global accrued amonnt to be delegated
    uint256 public totalAccruedPendingDelegations;

    mapping(address => uint256) public pendingReDelegation;
    uint256 public totalPendingReDelegation;

    // percentage allocation
    mapping(address => uint256) public validatorPercentages;
    // Total amount staked to a validator
    mapping(address => uint256) public validatorStakedAmount;

    //  multiSig
    address public feeCollector;
    address public rebalancer;

    /**
    * @dev The contract must be initialized with following variables:
    * @notice sum of the allocation should be 100%
    * @param validatorAddresses_ Addresses to which the ONEs will be delegated
    * @param validatorPercentages_ validator allocation distribution
    * @param rebalancer_ will have the right to rebalnce
    * @param feeCollector_ will get all the protocol fees
    */
    constructor(
        address[] memory validatorAddresses_,
        uint256[] memory validatorPercentages_,
        address rebalancer_,
        address feeCollector_
    ) {
        require(
            validatorAddresses_.length == validatorPercentages_.length,
            "The length of arrays should be equal"
        );
        validatorAddresses = validatorAddresses_;
        uint256 _totalDelegationPercentages;
        uint256 _validatorsLength = validatorAddresses.length;

        for (uint256 index = 0; index < _validatorsLength; index++) {

            address _validator = validatorAddresses_[index];
            uint256 _allocation = validatorPercentages_[index];
            _totalDelegationPercentages = _totalDelegationPercentages + _allocation;
            validatorPercentages[_validator] = _allocation;

        }
        require(_totalDelegationPercentages == 1e4, "Wrong percentage inputs");

        nONE = new oneLidoNFT();
        rebalancer = rebalancer_;
        feeCollector = feeCollector_;
        isRebalancing = false;
    }

    /**
    * @dev Convert 'amount_' of ONE to stONE
    * @param amount_ amount in ONE
    * @return amount in stONE, total stONEs and totalStaked
    */
    function convertONEToStONE(uint256 amount_)
        public
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        uint256 stONESupply = totalSupply();
        uint256 amountInStONE = totalStaked == 0 ? amount_ : (amount_ * stONESupply) / totalStaked;

        return (amountInStONE, stONESupply, totalStaked);
    }

     /**
     * @dev Send funds to the contract and mints stONE to msg.sender
     * @notice Requires that msg.value is greater than the MINIMUM_AMOUNT_FOR_DELEGATION
     * @param amount_ - of stONE which needs to be converted back to ONE
     * @return oneToReceive - ONEs the user will recieve on unstaking
     */
    function stake(uint256 amount_)
        external
        payable
        returns (uint256)
    {

        require(
            amount_ >= MINIMUM_AMOUNT_FOR_DELEGATION,
            "Minimum amount to stake is 100 ONE"
        );
        _updateClaimableBalance(false);
        stakeRewards();
        (
            uint256 tokenToMint,
            uint256 tokenSupply,
            uint256 oneStaked
        ) = convertONEToStONE(amount_);

        _stake(amount_, false);
        totalStaked += amount_;
        _updateClaimableBalance(false);

        _mint(msg.sender, tokenToMint);

        emit StakedEvent(msg.sender, tokenToMint);

        return tokenToMint;
    }

    /**
    * @dev Convert 'amount_' of stONE to ONE
    * @param amount_ amount in ONE
    * @return amount in ONE, total stONEs and totalStaked
    */
    function convertStONEToONE(uint256 amount_)
        public
        view
        returns (
            uint256,
            uint256,
            uint256
        )
    {
        uint256 stONESupply = totalSupply();
        uint256 amountInONE = amount_ * totalStaked / stONESupply;

        return (amountInONE, stONESupply, totalStaked);
    }

     /**
     * @dev Send stONEs token to the contract and mints a ticket which can 
     * be claimed after END_EPOCH no of epochs
     * @notice Requires that user has sufficient stONE with him
     * @param amount_ - of stONE which needs to be converted back to ONE
     * @return oneToReceive - ONEs the user will recieve on unstaking
     */
    function unstake(uint256 amount_)
        external
        returns (uint256)
    {
        // The user should have more stONE than the input amount
        require(balanceOf(msg.sender) >= amount_, "Not enough stONE");

        (
            uint256 oneToReceive,
            uint256 tokenSupply,
            uint256 oneStaked
        ) = convertStONEToONE(amount_);

        stakeRewards();
        _updateClaimableBalance(false);
        _unstake(oneToReceive);


        // END EPOCH should increase by 1 during protocol rebalnce
        uint256 _endEpoch;
        if (isRebalancing) {
            _endEpoch = _epoch() + 1 + END_EPOCH;
        } else {
            _endEpoch = _epoch() + END_EPOCH;
        }

        totalStaked = totalStaked - oneToReceive;

        _updateClaimableBalance(false);

        _burn(msg.sender, amount_);
        nONE.mint(msg.sender, _epoch(), _endEpoch, oneToReceive);

        emit UnstakedEvent(msg.sender, amount_);

        return oneToReceive;
    }

    /**
     * @dev Claims tokenId & receives the token amount from the contract balance 
     * @notice Requires user to be the owner(or approved) of the token
     * @notice Requires contract to have sufficient balance to pay back the user
     * @notice Requires if the ticket is Unlocked
     * @param tokenId_ - Id of the token that is to be claimed
     * @return _amount claimed by the user
     */
    function claim(uint256 tokenId_)
        external
        returns (uint256)
    {
        // need to check if he is the owner of the token ID
        _updateClaimableBalance(false);
        require(
            nONE.checkOwnerOrApproved(msg.sender, tokenId_),
            "Not Owner and not approved"
        );

        uint256 _amount = nONE.getAmountOfTokenByIndex(tokenId_);
        require(
            _amount <= totalClaimableBalance,
            "Not enough ONE in the pool"
        );

        require(
            _epoch() > nONE.getClaimableEpochOfTokenByIndex(tokenId_),
            "Not yet claimable"
        );

        stakeRewards();

        nONE.burn(tokenId_);
        // totalClaimableBalance -= amount_;


        uint256 _redemptionFeeAmount = redemptionFee * _amount / BASE;
        uint256 netAmountToPay = _amount - _redemptionFeeAmount;
        uint256 protocolSurchargeAmount = _redemptionFeeAmount * protocolRedemptionSurcharge / BASE;
        uint256 redemptionFeeToReStake = _redemptionFeeAmount - protocolSurchargeAmount;

        _stake(redemptionFeeToReStake, false);

        totalClaimableBalance -= _amount;

        (bool success, ) = payable(msg.sender).call {
            value: netAmountToPay
        }("");

        require(success, "Failed to send ONE");

        emit ClaimedEvent(msg.sender, tokenId_, _amount);

        return _amount;
    }


    /**
     * @dev Token NFT can be redelegated post 1 epoch when it was generated
     * @notice Requires user to be the owner(or approved) of the token
     * @notice Requires amount to be greated than MINIMUM_AMOUNT_FOR_DELEGATION
     * @notice Requires current epoch to be different to the ticket mintedEpoch
     * @param tokenId_ - Id of the token that is to be redelegated
     * @return _amount redelegated by the user
     */
    function reDelegate(uint256 tokenId_)
        external
        returns (uint256)
    {

        require(
            nONE.checkOwnerOrApproved(msg.sender, tokenId_),
            "Not Owner and not approved"
        );

        uint256 _amount = nONE.getAmountOfTokenByIndex(tokenId_);
        uint256 _mintedEpoch = nONE.getMintedEpochOfTokenByIndex(tokenId_);
        uint256 _endEpoch = nONE.getClaimableEpochOfTokenByIndex(tokenId_);

        require(
            _amount >= MINIMUM_AMOUNT_FOR_DELEGATION,
            "Only Claimable, min amount is 100 ONE"
        );

        require(_epoch() > _mintedEpoch, "Try again on next epoch");

        stakeRewards();
        _updateClaimableBalance(false);

        (
            uint256 tokenToMint,
            uint256 tokenSupply,
            uint256 oneStaked
        ) = convertONEToStONE(_amount);

        // token to be burned
        uint256 _toBurn = tokenId_;

        if (_endEpoch > _epoch()) {
            _stake(_amount, true);
        }
        else{
            _stake(_amount, false);
        }

        _updateClaimableBalance(false);

        totalStaked = totalStaked + _amount;

        nONE.burn(_toBurn);
        _mint(msg.sender, tokenToMint);

        emit RedelegateEvent(msg.sender, _toBurn, tokenToMint);

        return _amount;
    }

    /**
     * @dev Collect and stake the net reward amount to the validators. Rewards fee
     * are also charged here
     * @return rewards amount staked back to all the validators
     */
    function stakeRewards()
        public
        returns (uint256)
    {

        uint256 contractBalancePreReward = address(this).balance;
        _collectRewards();
        uint256 contractBalancePostReward = address(this).balance;

        uint256 rewards = contractBalancePostReward - contractBalancePreReward;
        totalRewardsCollected += rewards;

        collectedFee += (rewards * rewardFee) / BASE;
        rewards = (rewards * (BASE - rewardFee)) / BASE;
        totalStaked = totalStaked + rewards;
        uint256 _validatorsLength = validatorAddresses.length;

        for (uint256 index = 0; index < _validatorsLength; index++) {

            uint256 pctAlloc = validatorPercentages[validatorAddresses[index]];
            uint256 _rewardStake = (pctAlloc * rewards) / BASE;

            accruedPendingDelegations[validatorAddresses[index]] =
                accruedPendingDelegations[validatorAddresses[index]] +
                _rewardStake;
            totalAccruedPendingDelegations =
                totalAccruedPendingDelegations +
                _rewardStake;
        }
        // Net of fees
        emit RewardsCollected(rewards);

        return rewards;
    }

    /**
     * @dev Initiates the rebalance by undelelating from all existing validators
     * @notice Requires the length of new validator list and allocation list
     * to be same
     * @notice Requires the total allocation sum to be 100% (in bps)
     * @notice Requires the rebalaning state to be true
     * @param delegateAddresses_ New validators participating on the rebalance 
     * @param delegateAllocation_ allocation distributin to the new validators
     */
    function rebalanceInitiate(
        address[] memory delegateAddresses_,
        uint256[] memory delegateAllocation_
    )
        external
        onlyRebalancer
    {

        uint256 _currentEpoch = _epoch();
        require(
            _currentEpoch > rebalanceInitiateEpoch,
            "Rebalance already initiated in this epoch"
        );
        require(isRebalancing == false, "Rebalance already initiated");
        
        require(
            delegateAddresses_.length == delegateAllocation_.length,
            "Length of delegateAddresses_ and delegateAllocation_ should be equal"
        );

        stakeRewards();
        _updateClaimableBalance(false);

        uint256 _totalDelegationPercentages;
        for (uint256 index = 0; index < delegateAllocation_.length; index++) {

            _totalDelegationPercentages =
                _totalDelegationPercentages +
                delegateAllocation_[index];
        }
        require(
            _totalDelegationPercentages == 10000,
            "Total delegation should be 100 percent"
        );

        for (uint256 index = 0; index < validatorAddresses.length; index++) {

            address validator = validatorAddresses[index];
            uint256 amountStaked = validatorStakedAmount[validator];

            require(_undelegate(validator, amountStaked), "Could not undelegate");

            pendingReDelegation[validator] = 0.0;
            validatorPercentages[validator] = 0.0;
        }

        delete totalPendingReDelegation;
        delete validatorAddresses;

        validatorAddresses = delegateAddresses_;
        for (uint256 index = 0; index < delegateAddresses_.length; index++) {

            validatorPercentages[delegateAddresses_[index]] = delegateAllocation_[index];
        }

        rebalanceInitiateEpoch = _currentEpoch;
        isRebalancing = true;

        // uint256 amountToDelegate =
        //     address(this).balance -
        //     totalClaimableBalance -
        //     collectedFee;

        // _stake(amountToDelegate, false);

        emit RebalanceInitiated(
            totalRebalances++,
            delegateAddresses_,
            delegateAllocation_,
            _currentEpoch
        );
    }

    /**
     * @dev Completes the rebalance by allocation all the pending ONEs
     * to the new validator based on the fresh allocations
     * @notice Requires current epoch to be greater than epoch when the
     * rebalance was initiated 
     * @notice Requires the rebalaning state to be true
     */
    function rebalanceComplete()
        external
        onlyRebalancer
    {

        uint256 _currentEpoch = _epoch();
        require(isRebalancing == true, "Rebalance not initiated");

        require(
            _currentEpoch > rebalanceInitiateEpoch,
            "Cannot redelegate in current epoch"
        );

        require(
            rebalanceInitiateEpoch > rebalanceCompleteEpoch,
            "Already completed rebalance"
        );

        stakeRewards();

        uint256 amountToDelegate = totalStaked -
            amountStakedDuringRebalance +
            totalAccruedPendingDelegations -
            totalClaimableBalance;

        _stake(amountToDelegate, false);

        rebalanceCompleteEpoch = _currentEpoch;
        isRebalancing = false;
        amountStakedDuringRebalance = 0;

        emit RebalanceCompleted(
            totalRebalances,
            _currentEpoch
        );
    }

    /**
     * @dev Total amount to be collected by the feecollector
     * @return _toSend amount collected by the fee collecter
     */
    function collectFee()
        external
        onlyOwner
        returns (uint256)
    {
        uint256 _toSend = collectedFee;
        //set to 0 before sending to avoid re-entrancy
        collectedFee = 0;
        //send last to avoid re-entrancy
        payable(feeCollector).call {
            value: _toSend
        };

        return _toSend;
    }

    /**
     * @dev set the new redemption fee
     * @param feePct_ factor of the redemption fee (% / bps)
     */
    function setRedemptionFee(uint256 feePct_)
        external
        onlyOwner
    {
        redemptionFee = feePct_;
    }

    /**
     * @dev set the new reward fee
     * @param rewardFee_ factor of the reward fee (% / bps)
     */
    function setFee(uint256 rewardFee_)
        external
        onlyOwner
    {
        rewardFee = rewardFee_;
    }

    /**
     * @dev set the new feecollector
     * @param feeCollector_ address of the new feecollector
     */
    function setFeeCollector(address feeCollector_)
        external
        onlyOwner
    {
        feeCollector = feeCollector_;
    }

    /**
     * @dev set the new rebalancer
     * @param rebalancer_ address of the new rebalancer
     */
    function setRebalancer(address rebalancer_)
        external
        onlyOwner
    {
        rebalancer = rebalancer_;
    }

    /**
     * @dev Update the number of epochs a user has to wait for his 
     * ticket to fully unbond
     * @param endEpoch_ new END_EPOCH
     */
    function setEndEpoch(uint256 endEpoch_)
        external
        onlyOwner
    {
        END_EPOCH = endEpoch_;
    }

    /**
     * @dev Will update the MINIMUM_AMOUNT_FOR_DELEGATION when there is a 
     * change on the amount of ONEs can be delegated to a validator on the protocol level
     * @param amount_ minimum amount of one that can be delegated to a validator
     */
    function setMinimumDelegationAmount(uint256 amount_)
        external
        onlyOwner
    {
        MINIMUM_AMOUNT_FOR_DELEGATION = amount_;
    }

    /**
     * @dev Update the MINIMUM_DELEGATED_THRESHOLD when there is an change on minimum
     * amount of ONEs which be kept delegated to a validator
     * @param amount_ minimum amount of ONEs that can be kept delegated to a validator
     */
    function setMinimumDelegationThreshold(uint256 amount_)
        external
        onlyOwner
    {
        MINIMUM_DELEGATED_THRESHOLD = amount_;
    }

    /**
     * @dev Activate minDelegatedThresholdActivated if it has been activated on the 
     * protocol level
     */
    function activateMinimumDelegationThreshold()
        external
        onlyOwner
    {
        minDelegatedThresholdActivated = true;
    }

    /**
     * @dev Turn off minDelegatedThresholdActivated - by default it's off on the
     * protocol level
     */
    function turnOffMinimumDelegationThreshold()
        external
        onlyOwner
    {
        minDelegatedThresholdActivated = false;
    }

    /**
     * @dev Delegates the amount_ in ONEs to the validators based on the allocation
     * @param amount_ to be delegated to the validator 
     * @param fromRedegatableBalance if it is a redelegatable transaction
     */
    function _stake(uint256 amount_, bool fromRedegatableBalance)
        internal
    {

        _updateClaimableBalance(true);
        uint256 _validatorsLength = validatorAddresses.length;
        bool isEpochRebalance = _epoch() == rebalanceInitiateEpoch;

        for (uint256 index = 0; index < _validatorsLength; index++) {

            address validator = validatorAddresses[index];
            uint256 _toStake = (validatorPercentages[validator] * amount_) / BASE;

            if (isEpochRebalance) {
                accruedPendingDelegations[validator] += _toStake;
                totalAccruedPendingDelegations += _toStake;
                return;
            }
            else {
                if (
                    _toStake +
                    accruedPendingDelegations[validator]+
                    pendingReDelegation[validator]  <
                    MINIMUM_AMOUNT_FOR_DELEGATION
                ) {
                    if(fromRedegatableBalance){
                        pendingReDelegation[validator] += _toStake;
                        totalPendingReDelegation += _toStake;
                    }
                    else{
                        accruedPendingDelegations[validator] += _toStake;
                        totalAccruedPendingDelegations += _toStake;
                    }

                }
                else {
                    require(
                        _delegate(
                            validator,
                            (_toStake +
                                accruedPendingDelegations[validator] +
                                pendingReDelegation[validator]
                            )
                        ),
                        "Could not delegate"
                    );
                    validatorStakedAmount[validator] +=
                        _toStake +
                        accruedPendingDelegations[validator] +
                        pendingReDelegation[validator];

                    totalAccruedPendingDelegations =
                        totalAccruedPendingDelegations -
                        accruedPendingDelegations[validator];

                    totalPendingReDelegation =
                        totalPendingReDelegation -
                        pendingReDelegation[validator];

                    accruedPendingDelegations[validator] = 0;
                    pendingReDelegation[validator] = 0;

                    if (isRebalancing) {
                        amountStakedDuringRebalance += _toStake;
                    }
                }
            }
        }
    }

    /**
     * @dev Undelegates the amount_ from the validators based on the allocation
     * @param amount_ to be undelegated from the validators
     */
    function _unstake(uint256 amount_)
        internal
    {
        _updateClaimableBalance(false);
        if (isRebalancing) {} else {

            uint256 _validatorsLength = validatorAddresses.length;

            for (uint256 index = 0; index < _validatorsLength; index++) {

                address validator = validatorAddresses[index];
                uint256 _toUnstake = (validatorPercentages[validator] * amount_) / BASE;

                uint256 validatorPendingDelegation =
                    accruedPendingDelegations[validator];
                uint256 totalStakedAtValidator =
                    validatorStakedAmount[validator];

                if (_toUnstake <= validatorPendingDelegation) {
                    accruedPendingDelegations[validatorAddresses[index]] -=
                        _toUnstake;
                    totalAccruedPendingDelegations -= _toUnstake;
                }

                else if (totalStakedAtValidator == 0){}

                else {
                    uint256 amountToUndelegate =
                        _toUnstake - validatorPendingDelegation;
                    totalAccruedPendingDelegations -=
                        validatorPendingDelegation;
                    accruedPendingDelegations[validator] = 0;

                    if (
                        minDelegatedThresholdActivated &&
                        amountToUndelegate <=
                        MINIMUM_DELEGATED_THRESHOLD
                    ) {
                        require(_undelegate(validator, totalStakedAtValidator), "Could not undelegate");
                        validatorStakedAmount[validator] = 0;

                        pendingReDelegation[validator] =
                            totalStakedAtValidator -
                            amountToUndelegate;
                        totalPendingReDelegation += pendingReDelegation[validator];
                    }
                    else{
                        require(_undelegate(validator, amountToUndelegate), "Could not undelegate");
                        validatorStakedAmount[validator] -= amountToUndelegate;
                    }
                }
            }
        }
    }

    /**
     * @dev Updates the balance from pendingReDelegation to accruedPendingDelegations.
     * This is only possible whenever an undelegated balance gets unbonded and are ready to
     * be redelegated. The contract will have it on his Pending delegation list.
     * @param amount_ to be shifted from pendingReDelegation to accrued pending delegations
     */
    function _redelegationAmountTransfer(uint256 amount_)
        internal
        returns (uint256)
    {
        uint256 _validatorsLength = validatorAddresses.length;

        for (uint256 index = 0; index < _validatorsLength; index++) {

            address validator = validatorAddresses[index];
            uint256 amountTranferToValidator =
                amount_ * pendingReDelegation[validator] /
                totalPendingReDelegation;

            accruedPendingDelegations[validator] +=
                amountTranferToValidator;

            pendingReDelegation[validator] -=
                amountTranferToValidator;

        }
        totalPendingReDelegation -= amount_;
        totalAccruedPendingDelegations += amount_;
    }

    /**
     * @dev Updates the total ONEs that can be claimed by the user
     * @param stake_ if its a fresh staking or not (no redelegation)
     * @return totalClaimableBalance amount that can be claimed by the users
     */
    function _updateClaimableBalance(bool stake_)
        internal
        returns (uint256)
    {
        if (totalPendingReDelegation > 0) {

            if (
                address(this).balance -
                collectedFee -
                (stake_ ? msg.value : 0) -
                totalAccruedPendingDelegations <
                totalPendingReDelegation
            ) {
                if (
                    totalPendingReDelegation -
                    address(this).balance <
                    totalPendingReDelegation
                ) {
                    uint256 amountToTransfer =
                        totalPendingReDelegation -
                        address(this).balance;
                    _redelegationAmountTransfer(amountToTransfer);
                }
                totalClaimableBalance =
                    address(this).balance -
                    collectedFee -
                    (stake_ ? msg.value : 0) -
                    totalAccruedPendingDelegations;
            }
            else{
                _redelegationAmountTransfer(totalPendingReDelegation);

                totalClaimableBalance =
                    address(this).balance -
                    collectedFee -
                    (stake_ ? msg.value : 0) -
                    totalAccruedPendingDelegations;
            }
        }
        else {
            totalClaimableBalance =
                address(this).balance -
                collectedFee -
                (stake_ ? msg.value : 0) -
                totalAccruedPendingDelegations;
        }

        return totalClaimableBalance;
    }

    modifier onlyRebalancer() {
        require(msg.sender == rebalancer, "Not authorized to rebalance");
        _;
    }
}