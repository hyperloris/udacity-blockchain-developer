var ERC721MintableComplete = artifacts.require('PropertyToken');

contract('TestERC721Mintable', accounts => {
    const account_one = accounts[0];
    const account_two = accounts[1];
    const account_three = accounts[2];
    const numberOfTokensPerAccount = 20;

    describe('match erc721 spec', function () {
        beforeEach(async function () { 
            this.contract = await ERC721MintableComplete.new({from: account_one});
            for (let i = 1; i <= numberOfTokensPerAccount; i++) {
                await this.contract.mint(account_two, i, { from: account_one });
                await this.contract.mint(account_three, i + numberOfTokensPerAccount, { from: account_one });
            }
        })

        it('should return total supply', async function () {
            const totalSupply = await this.contract.totalSupply();
            assert.equal(totalSupply, numberOfTokensPerAccount * 2);  
        })

        it('should get token balance', async function () {
            const accountTwoBalance = await this.contract.balanceOf(account_two);
            const accountThreeBalance = await this.contract.balanceOf(account_three);
            assert.equal(accountTwoBalance, numberOfTokensPerAccount);
            assert.equal(accountThreeBalance, numberOfTokensPerAccount);
        })

        // token uri should be complete i.e: https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1
        it('should return token uri', async function () {
            const tokenURI = await this.contract.tokenURI(30);
            assert.equal(tokenURI, 'https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/30');
        })

        it('should transfer token from one owner to another', async function () {
            const initialOwner = await this.contract.ownerOf(30);
            await this.contract.transferFrom(account_three, account_two, 30, { from: account_three });
            const finalOwner = await this.contract.ownerOf(30);
            assert.equal(initialOwner, account_three);
            assert.equal(finalOwner, account_two);
        })
    });

    describe('have ownership properties', function () {
        beforeEach(async function () {
            this.contract = await ERC721MintableComplete.new({from: account_one});
        })

        it('should fail when minting when address is not contract owner', async function () {
            try {
                await this.contract.mint(account_two, i, { from: account_one });
            } catch (error) {
                assert.exists(error);
                return;
            }
            assert.equal(true, false, 'This test should have failed');
        })

        it('should return contract owner', async function () {
            const contractOwner = await this.contract.getOwner();
            assert.equal(contractOwner, account_one);
        })
    });
})