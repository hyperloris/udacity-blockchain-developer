var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "horn genre sadness pyramid start thought verify aerobic coffee assume code fresh";

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:9545/", 0, 50);
      },
      network_id: '*',
      gas: 4500000
    }
  },
  compilers: {
    solc: {
      version: "^0.8.0"
    }
  }
};