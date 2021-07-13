var appRoot = require('app-root-path');
var expectFail = require('./utils/expectFail');
var SquareVerifier = artifacts.require('SquareVerifier');
var SolnSquareVerifier = artifacts.require('SolnSquareVerifier');

contract('SolnSquareVerifier', accounts => {
    const account_one = accounts[0];
    const account_two = accounts[1];

    describe('Test minting', function () {
        beforeEach(async function () {
            this.verifier = await SquareVerifier.new({
                from: account_one
            });
            this.contract = await SolnSquareVerifier.new(this.verifier.address, {
                from: account_one
            });
        })

        it('should successfully mint', async function () {
            const {
                proof,
                inputs
            } = require(`${appRoot}/zokrates/code/square/proof.json`);
            const result = await this.contract.mintNFT(account_two, 1, proof.a, proof.b, proof.c, inputs, {
                from: account_one
            });
            assert(result, true);
        })

        it('should fail for duplicate solution', async function () {
            const {
                proof,
                inputs
            } = require(`${appRoot}/zokrates/code/square/proof.json`);
            await this.contract.mintNFT(account_two, 1, proof.a, proof.b, proof.c, inputs, {
                from: account_one
            });
            const result = this.contract.mintNFT(account_two, 1, proof.a, proof.b, proof.c, inputs, {
                from: account_one
            });
            await expectFail(result);
        })

        it('should fail for wrong proof', async function () {
            const {
                proof,
                inputs
            } = require(`${appRoot}/zokrates/code/square/proof-wrong.json`);
            const result = this.contract.mintNFT(account_two, 1, proof.a, proof.b, proof.c, inputs, {
                from: account_one
            });
            await expectFail(result);
        })
    });
})