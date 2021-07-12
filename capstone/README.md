# Capstone: Real Estate Marketplace

# Objective

In this project you will be minting your own tokens to represent your title to the properties. Before you mint a token, you need to verify you own the property. You will use zk-SNARKs to create a verification system which can prove you have title to the property without revealing that specific information on the property.

Once the token has been verified you will place it on a blockchain market place (OpenSea) for others to purchase.

# Installation

Install the required dependencies
```
$ npm install
```

Install [Truffle](https://www.trufflesuite.com)
```
$ npm install -g truffle
```

# Quick Usage

As first thing, move inside the `eth-contracts` folder and run the following command to spawn a local development blockchain:
```
$ truffle develop
```
From there, you can run `truffle compile`, `truffle migrate` and `truffle test` to compile the contracts, deploy those contracts to the network, and run their associated tests.

## ZoKrates
In order to run [ZoKrates](https://zokrates.github.io/introduction.html) move inside the `zokrates/code/square` folder and execute this Docker command:
```
$ docker run -v $(pwd):/home/zokrates/code -ti zokrates/zokrates /bin/bash
```

You can now generate the proof by following these steps:
1. Move inside the mounted directory

    `cd code`

2. Compile the code

    `zokrates compile -i square.code`

3. Perform the setup phase

    `zokrates setup`

4. Execute the program

    `zokrates compute-witness -a <number> <square>`

5. Generate a proof of computation

    `zokrates generate-proof`

6. (optional) Export a solidity verifier

   `zokrates export-verifier`

# Deployment information

The following contracts are deployed on the Rinkeby network:

## Migrations
```
Transaction Hash: 0x6b07bb809bf38c11cab5281fccdd30e677f09320a7255473574822df2dba1f49
Contract Address: 0xFed03683EC7C683F3091a29626874CbF0a9963A8
```

## SquareVerifier
```
Transaction Hash: 0x068129cac998d840dfdd921fb2fa257eb7cd4a14901ab0e2c9a1bcd12f3348c0
Contract Address: 0x24E3220B1B80f20D904690839Ca85C12E4C6A164
```

## SolnSquareVerifier
```
Transaction Hash: 0xd1d2859b444b4935e00f52d9613035a6f7912f0341735a923907cf74dc0da29b
Contract Address: 0xD307B13EDb7Ba05b7D1A3D36c673055520fcC963
```

# OpenSea Marketplace

Seller: https://rinkeby.opensea.io/accounts/0xf1ff9bb3e2929515c4b43abe937cbf0c6c7d9d23

Buyer: https://rinkeby.opensea.io/accounts/0x25c6E5A1Beaa0eF5003994A908A004ec72910950

# Project Resources

* [Remix - Solidity IDE](https://remix.ethereum.org/)
* [Visual Studio Code](https://code.visualstudio.com/)
* [Truffle Framework](https://truffleframework.com/)
* [Ganache - One Click Blockchain](https://truffleframework.com/ganache)
* [Open Zeppelin ](https://openzeppelin.org/)
* [Interactive zero knowledge 3-colorability demonstration](http://web.mit.edu/~ezyang/Public/graph/svg.html)
* [Docker](https://docs.docker.com/install/)
* [ZoKrates](https://github.com/Zokrates/ZoKrates)
