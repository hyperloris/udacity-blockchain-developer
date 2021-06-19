const truffleAssert = require('truffle-assertions');
const Test = require('../config/testConfig.js');
const BigNumber = require('bignumber.js');
BigNumber.config({ EXPONENTIAL_AT: 25 })

contract('Refund flow', async (accounts) => {
  const airline1 = accounts[1];
  const airline2 = accounts[2];
  const airline3 = accounts[3];
  const airline4 = accounts[4];
  const oracle1 = accounts[11];
  const oracle2 = accounts[12];
  const oracle3 = accounts[13];
  const flight = 'ND1309';
  const timestamp = 1624103191959;
  const passenger = accounts[7];
  const STATUS_CODE_LATE_AIRLINE = 20;
  let config;

  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeContract(config.flightSuretyApp.address);
  });

  it('should register three more airlines', async () => {
    const fee = await config.flightSuretyApp.MINIMUM_AIRLINE_PARTECIPATION_FEE.call();
    await config.flightSuretyApp.fundAirline({ from: airline1, value: fee });
    await config.flightSuretyApp.registerAirline(airline2, 'Airline 2', { from: airline1 });
    await config.flightSuretyApp.registerAirline(airline3, 'Airline 3', { from: airline1 });
    await config.flightSuretyApp.registerAirline(airline4, 'Airline 4', { from: airline1 });
    const isAirline2Registered = await config.flightSuretyData.isAirline.call(airline2);
    const isAirline3Registered = await config.flightSuretyData.isAirline.call(airline3);
    const isAirline4Registered = await config.flightSuretyData.isAirline.call(airline4);
    assert.equal(isAirline2Registered, true);
    assert.equal(isAirline3Registered, true);
    assert.equal(isAirline4Registered, true);
  });

  it('should activate the first two airlines', async () => {
    const fee = await config.flightSuretyApp.MINIMUM_AIRLINE_PARTECIPATION_FEE.call();
    await config.flightSuretyApp.fundAirline({ from: airline1, value: fee });
    await config.flightSuretyApp.fundAirline({ from: airline2, value: fee });
    const isAirline1Active = await config.flightSuretyData.isAirlineActive.call(airline1);
    const isAirline2Active = await config.flightSuretyData.isAirlineActive.call(airline2);
    assert(isAirline1Active, true);
    assert(isAirline2Active, true);
  });

  it('should register a flight', async () => {
    await config.flightSuretyApp.registerFlight(flight, timestamp, { from: airline1 });
    const isFlightRegistered = await config.flightSuretyApp.isFlightRegistered(airline1, flight, timestamp);
    assert(isFlightRegistered, true);
  });

  it('should register oracles', async () => {
    const fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
    await config.flightSuretyApp.registerOracleWithIndexes(oracle1, [1, 2, 3], { from: config.owner, value: fee });
    await config.flightSuretyApp.registerOracleWithIndexes(oracle2, [1, 2, 3], { from: config.owner, value: fee });
    await config.flightSuretyApp.registerOracleWithIndexes(oracle3, [1, 2, 3], { from: config.owner, value: fee });
    const isOracle1Registered = await config.flightSuretyApp.isOracleRegistered(oracle1);
    const isOracle2Registered = await config.flightSuretyApp.isOracleRegistered(oracle2);
    const isOracle3Registered = await config.flightSuretyApp.isOracleRegistered(oracle3);
    assert.equal(isOracle1Registered, true);
    assert.equal(isOracle2Registered, true);
    assert.equal(isOracle3Registered, true);
  });

  it('should buy a flight insurance', async () => {
    const zeroPointFiveEther = web3.utils.toWei('0.5', 'ether');
    await config.flightSuretyApp.buyFlightInsurance(airline1, flight, timestamp, { from: passenger, value: zeroPointFiveEther });
  });

  it('should credit passenger for flight delay', async () => {
    const zeroPointSevenFiveEther = web3.utils.toWei('0.75', 'ether');
    await config.flightSuretyApp.fetchFlightStatus(airline1, flight, timestamp, { from: passenger });
    await config.flightSuretyApp.submitOracleResponse(1, airline1, flight, timestamp, STATUS_CODE_LATE_AIRLINE, { from: oracle1 });
    await config.flightSuretyApp.submitOracleResponse(1, airline1, flight, timestamp, STATUS_CODE_LATE_AIRLINE, { from: oracle2 });
    await config.flightSuretyApp.submitOracleResponse(1, airline1, flight, timestamp, STATUS_CODE_LATE_AIRLINE, { from: oracle3 });
    const passengerBalance = await config.flightSuretyApp.getBalance.call({ from: passenger });
    assert.equal(passengerBalance, zeroPointSevenFiveEther);
  });

  it('should be able to withdraw credits', async () => {
    const zeroPointSevenFiveEther = web3.utils.toWei('0.75', 'ether');
    const initialPassengerWalletBalance = await web3.eth.getBalance(passenger);

    const txInfo = await config.flightSuretyApp.withdrawBalance({ from: passenger });
    const tx = await web3.eth.getTransaction(txInfo.tx);
    const gasCost = BigNumber(txInfo.receipt.gasUsed).multipliedBy(BigNumber(tx.gasPrice));
    const finalPassengerWalletBalance = await web3.eth.getBalance(passenger);

    const correctFinalPassengerWalletBalance = BigNumber(initialPassengerWalletBalance).plus(BigNumber(zeroPointSevenFiveEther)).minus(BigNumber(gasCost));
    const finalPassengerContractBalance = await config.flightSuretyApp.getBalance.call({ from: passenger });

    assert.equal(finalPassengerWalletBalance, correctFinalPassengerWalletBalance.toString());
    assert.equal(finalPassengerContractBalance, 0);
  });
});