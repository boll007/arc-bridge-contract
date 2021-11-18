//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract ERC20Token is ERC20 {
    constructor() ERC20("ArcBlock", "ABT") {
        _mint(msg.sender, 186000000000000000000000000);
    }
}
