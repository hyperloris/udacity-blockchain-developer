const Test = require('../config/testConfig.js');
const BigNumber = require('bignumber.js');

contract('Airlines', async (accounts) => {
  let config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);
  });

  it('should register the first airline at deploy', async () => {
    const fistAirline = config.firstAirline;

    const isAirline = await config.flightSuretyData.isAirline.call(fistAirline);

    assert.equal(isAirline, true);
  });

  it('should not register an airline if the sender is not an airline', async () => {
    const newAirlineAccount = accounts[2];
    const newAirlineName = 'Airline 2';
    const sender = accounts[7];
    
    try {
      await config.flightSuretyApp.registerAirline(newAirlineAccount, newAirlineName, {
        from: sender
      });
    } catch (e) {
      // console.log(e);
    }

    const result = await config.flightSuretyData.isAirline.call(newAirlineAccount);
    assert.equal(result, false);
  });

  it('should not register an airline if it is not funded', async () => {
    const newAirlineAccount = accounts[2];
    const newAirlineName = 'Airline 2';

    try {
      await config.flightSuretyApp.registerAirline(newAirlineAccount, newAirlineName, {
        from: config.firstAirline
      });
    } catch (e) {
      // console.log(e);
    }

    const result = await config.flightSuretyData.isAirline.call(newAirlineAccount);
    assert.equal(result, false);
  });

  it('should fund and activate the first airline', async () => {
    const firstAirline = config.firstAirline;
    const tenEther = web3.utils.toWei('10', 'ether');

    await config.flightSuretyApp.fundAirline({ from: firstAirline, value: tenEther });
    const isAirlineActive = await config.flightSuretyData.isAirlineActive(firstAirline);

    assert.equal(isAirlineActive, true);
  });

  it('should register the first four airlines without multi-party consensus', async () => {
    const firstAirline = config.firstAirline;
    const secondAirline = accounts[2];
    const thirdAirline = accounts[3];
    const fourthAirline = accounts[4];

    await config.flightSuretyApp.registerAirline(secondAirline, 'Airline 2', { from: firstAirline });
    await config.flightSuretyApp.registerAirline(thirdAirline, 'Airline 3', { from: firstAirline });
    await config.flightSuretyApp.registerAirline(fourthAirline, 'Airline 4', { from: firstAirline });

    const isSecondAirlineRegistered = await config.flightSuretyData.isAirline.call(secondAirline);
    const isThirdAirlineRegistered = await config.flightSuretyData.isAirline.call(thirdAirline);
    const isFourthAirlineRegistered = await config.flightSuretyData.isAirline.call(fourthAirline);

    assert.equal(isSecondAirlineRegistered, true);
    assert.equal(isThirdAirlineRegistered, true);
    assert.equal(isFourthAirlineRegistered, true);
  });

  it('should not register the fifth airline without having at least 50% consent', async () => {
    const firstAirline = config.firstAirline;
    const fifthAirline = accounts[5];

    await config.flightSuretyApp.registerAirline(fifthAirline, 'Airline 5', { from: firstAirline });

    const isFifthAirlineRegistered = await config.flightSuretyData.isAirline.call(fifthAirline);
    assert.equal(isFifthAirlineRegistered, false);
  });

  it('should register the fifth airline with 2/4 consent', async () => {
    const secondAirline = accounts[2];
    const fifthAirline = accounts[5];
    const tenEther = web3.utils.toWei('10', 'ether');

    await config.flightSuretyApp.fundAirline({ from: secondAirline, value: tenEther });
    await config.flightSuretyApp.registerAirline(fifthAirline, 'Airline 5', { from: secondAirline });

    const isFifthAirlineRegistered = await config.flightSuretyData.isAirline.call(fifthAirline);
    assert.equal(isFifthAirlineRegistered, true);
  });

  it('should not register the sixth airline with 2/5 consent', async () => {
    const firstAirline = config.firstAirline;
    const secondAirline = accounts[2];
    const sixthAirline = accounts[6];

    await config.flightSuretyApp.registerAirline(sixthAirline, 'Airline 6', { from: firstAirline });
    await config.flightSuretyApp.registerAirline(sixthAirline, 'Airline 6', { from: secondAirline });

    const isSixthAirlineRegistered = await config.flightSuretyData.isAirline.call(sixthAirline);
    assert.equal(isSixthAirlineRegistered, false);
  });
});