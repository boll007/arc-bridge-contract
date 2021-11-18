const { ethers } = require('hardhat');
const { expect } = require('chai');

const { seedValidators } = require('../mock/validators');

const minSingerCount = 2;
const emptyETHAddress = '0x0000000000000000000000000000000000000000';

describe('Constructor', () => {
  it('should constructor work as expected', async () => {
    const ERC20Rollup = await ethers.getContractFactory('ERC20Rollup');
    const ERC20Token = await ethers.getContractFactory('ERC20Token');
    const token = await ERC20Token.deploy();
    await expect(ERC20Rollup.deploy(emptyETHAddress, minSingerCount, seedValidators)).to.be.revertedWith('E501');
    await expect(ERC20Rollup.deploy(token.address, 0, seedValidators)).to.be.revertedWith('E503');
    await expect(ERC20Rollup.deploy(token.address, minSingerCount, [])).to.be.revertedWith('E504');
    await expect(ERC20Rollup.deploy(token.address, 1, seedValidators)).to.be.revertedWith('E505');
    await ERC20Rollup.deploy(token.address, minSingerCount, seedValidators);
  });
});
