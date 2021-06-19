const truffleAssert = require('truffle-assertions');
const Test = require('../config/testConfig.js');
const BigNumber = require('bignumber.js');

contract('Passengers', async (accounts) => {
  let config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);
  });

  it('should not be able to buy a flight insurance, because it is an airline', async () => {
    const airline1 = accounts[1];
    const flight0 = config.testFlights[0];
    const timestamp = new Date().getTime();

    const isSenderAirline = await config.flightSuretyData.isAirline.call(airline1);
    const result = config.flightSuretyApp.buyFlightInsurance(airline1, flight0, timestamp, { from: airline1 });

    assert.equal(isSenderAirline, true);
    await truffleAssert.reverts(result);
  });

  it('should not be able to buy a flight insurance, because it exceeds the maximum fee', async () => {
    const airline1 = accounts[1];
    const passenger = accounts[7];
    const flight0 = config.testFlights[0];
    const timestamp = new Date().getTime();
    const tenEther = web3.utils.toWei('10', 'ether');

    const isSenderAirline = await config.flightSuretyData.isAirline.call(passenger);
    const result = config.flightSuretyApp.buyFlightInsurance(airline1, flight0, timestamp, { from: passenger, value: tenEther });

    assert.equal(isSenderAirline, false);
    await truffleAssert.reverts(result);
  });

  it('should buy a flight insurance', async () => {
    const airline1 = accounts[1];
    const passenger = accounts[7];
    const flight0 = config.testFlights[0];
    const timestamp = new Date().getTime();
    const oneEther = web3.utils.toWei('1', 'ether');

    const isSenderAirline = await config.flightSuretyData.isAirline.call(passenger);
    const preAirlineFunds = await config.flightSuretyData.getAirlineFunds.call(airline1);
    await config.flightSuretyApp.buyFlightInsurance(airline1, flight0, timestamp, { from: passenger, value: oneEther });
    const postAirlineFunds = await config.flightSuretyData.getAirlineFunds.call(airline1);

    assert.equal(isSenderAirline, false);
    assert.equal(preAirlineFunds, 0);
    assert.equal(postAirlineFunds, oneEther);
  });
});