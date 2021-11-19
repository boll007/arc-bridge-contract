const fs = require('fs');
const path = require('path');

(() => {
  const source = fs.readFileSync(path.join(__dirname, '../artifacts/contracts/ERC20Rollup.sol/ERC20Rollup.json'));
  const json = JSON.parse(source);

  fs.writeFileSync(path.join(__dirname, '../lib/rollup.json'), JSON.stringify(json, null, 2));
  // eslint-disable-next-line no-console
  console.log('Rollup contract compiled result copied');
})();

(() => {
  const source = fs.readFileSync(path.join(__dirname, '../artifacts/contracts/ERC20Token.sol/ERC20Token.json'));
  const json = JSON.parse(source);

  fs.writeFileSync(path.join(__dirname, '../lib/erc20.json'), JSON.stringify(json, null, 2));
  // eslint-disable-next-line no-console
  console.log('ERC20Token contract compiled result copied');
})();
