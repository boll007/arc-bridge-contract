## DID Rollup Contract

### 前置条件

需要在 contract 目录下维护 .env 文件，并在其中维护几个变量：

```ini
INFURA_PROJECT_ID=""
RINKEBY_PRIVATE_KEY=""
```

### 合约本地开发与调试

1. 开发

在 contracts 目录下的 `ERC20Rollup.sol` 文件中进行合约编写。

2. 调试

在 test 目录下的 `did-rollup-test.js` 文件中编写相关测试逻辑，对 contract 的功能进行本地测试。

执行命令：`npx hardhat test` 即可。

> 本地测试的时候，其实是在内存中跑了一条以太坊的测试链。

### 合约在测试网络测试

首先需要在 `hardhat.config.js` 中配置我们待会要使用的测试网络，比如我们选用的是 rinkeby。

```js
module.exports = {
  //...
  networks: {
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [`0x${RINKEBY_PRIVATE_KEY}`],
    },
  },
};
```

我们可以指定一个 rinkeby RPC 的 url，并且通过配置一个私钥来指定待会进行发布合约，调用合约的以太坊账户。

配置完成之后，只需要分别执行 scripts 下面的脚本即可。

`npx hardhat run scripts/{xxx.js} --network rinkeby`
