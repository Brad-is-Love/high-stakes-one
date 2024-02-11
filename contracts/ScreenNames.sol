// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

contract ScreenNames {
    mapping(address => string) public screenNames;
    mapping(string => bool) public screenNameExists;
    mapping(address => bool) public isAdmin;
    address public owner;
    constructor() {
        owner = msg.sender;
        isAdmin[msg.sender] = true;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender], "Only admin can call this function");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function addAdmin(address _admin) public onlyOwner {
        isAdmin[_admin] = true;
    }

    function removeAdmin(address _admin) public onlyOwner {
        isAdmin[_admin] = false;
    }

    function setScreenName(string memory _screenName) public {
        require(!screenNameExists[_screenName], "Screen name already exists");
        require(bytes(_screenName).length > 0, "Screen name cannot be empty");
        require(bytes(_screenName).length <= 32, "Screen name cannot be longer than 32 characters");
        screenNames[msg.sender] = _screenName;
        screenNameExists[_screenName] = true;
    }

    // admin function in case someone adds an offensive screen name
    function removeScreenName(address _addressToRemove) public onlyAdmin {
        string memory _screenName = screenNames[_addressToRemove];
        screenNameExists[_screenName] = false;
        delete screenNames[_addressToRemove];
    }

    function changeOwner(address _newOwner) public onlyOwner {
        owner = _newOwner;
    }

}