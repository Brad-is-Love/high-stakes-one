// SPDX-License-Identifier: GPL-3.0
// Parts copied from 2022 MerkleLabs

pragma solidity ^0.8.9;

contract VRF {
    Iss public iss;

    constructor(address _iss) {
        iss = Iss(_iss);
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

    function rng() external view returns (uint256) {
        uint256 num = vrf() % (iss.totalStaked()-1);
        return num;
    }

    function addressAtRng(uint256 index) external view returns (address) {
        return iss.addressAtIndex(index);
    }
}

interface Iss {
    function totalStaked() external view returns (uint256);

    function addressAtIndex(uint256 index) external view returns (address);
}