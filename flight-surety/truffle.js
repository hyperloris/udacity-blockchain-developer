var mnemonic = "horn genre sadness pyramid start thought verify aerobic coffee assume code fresh";

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 9545,
      network_id: '*',
      gas: 4500000,
      gasPrice: 10000000000
    },
    develop: {
      accounts: 50,
      defaultEtherBalance: 50,
    },
  },
  compilers: {
    solc: {
      version: "^0.8.0"
    }
  }
};