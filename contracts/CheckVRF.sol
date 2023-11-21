// SPDX-License-Identifier: GPL-3.0
// Parts copied from 2022 MerkleLabs

contract CheckVRF {

    uint256 public totalStaked = 500 ether;
    uint256 public index;
 
    constructor() {

    }

    function drawWinner() external returns (uint256) {
        index = vrf() % (totalStaked - 1);
        index = index / 1 ether;
        return index;
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

}
