var appRoot = require('app-root-path');
var expectFail = require('./utils/expectFail');
var SquareVerifier = artifacts.require('SquareVerifier');

contract('SquareVerifier', accounts => {
    const account_one = accounts[0];

    describe('Test verification', function () {
        beforeEach(async function () {
            this.verifier = await SquareVerifier.new({
                from: account_one
            });
        })

        it('should successfully verify with correct proof', async function () {
            const {
                proof,
                inputs
            } = require(`${appRoot}/zokrates/code/square/proof.json`);
            const result = await this.verifier.verifyTx(proof.a, proof.b, proof.c, inputs, {
                from: account_one
            });
            assert(result, true);
        })

        it('should fail verification with incorrect proof', async function () {
            const {
                proof,
                inputs
            } = require(`${appRoot}/zokrates/code/square/proof-wrong.json`);
            const result = this.verifier.verifyTx(proof.a, proof.b, proof.c, inputs, {
                from: account_one
            });
            await expectFail(result);
        })
    });
})