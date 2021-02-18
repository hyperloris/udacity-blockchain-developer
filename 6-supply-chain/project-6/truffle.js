const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraKey = "f534e9ec8b504e55a2a5a144caa4dc08";

const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${infuraKey}`),
      network_id: 4,
      gas: 4500000,
      confirmations: 2,
      timeoutBlocks: 200,
    } 
  }
};