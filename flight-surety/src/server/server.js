import 'babel-polyfill';

import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

const config = Config['localhost'];
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
const flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
const flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
const app = express();

const START_ORACLE_INDEX = 10;
const END_ORACLE_INDEX = 20;
const FLIGHT_STATUSES = [0, 10, 20, 30, 40, 50];
const gasInput = {
  gas: 4000000,
  gasPrice: 100000000000
};

let accounts = [];

async function setup() {
  accounts = await web3.eth.getAccounts();
  await flightSuretyData.methods.authorizeContract(config.appAddress).send({ from: accounts[0] });
}

async function registerOracles() {
  const registrationFee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
  for (let i = START_ORACLE_INDEX; i < END_ORACLE_INDEX; i++) {
    await flightSuretyApp.methods.registerOracle().send({
      from: accounts[i],
      value: registrationFee,
      ...gasInput
    });
  }
}

async function printOracleIndexes() {
  for (let i = START_ORACLE_INDEX; i < END_ORACLE_INDEX; i++) {
    const account = accounts[i];
    const indexes = await flightSuretyApp.methods.getMyIndexes().call({
      from: account,
      ...gasInput
    });
    console.log(`${account} - `, indexes);
  }
}

async function subscribeToEvents() {
  flightSuretyApp.events.OracleRequest({
    fromBlock: 0
  }, function (error, event) {
    if (error) {
      console.log(error);
      return;
    }
    processOracleRequest(event);
  });
}

async function processOracleRequest(event) {
  const reqIndex = event.returnValues.index;
  const reqAirline = event.returnValues.airline;
  const reqFlight = event.returnValues.flight;
  const reqTimestamp = event.returnValues.timestamp;
  console.log(`Oracle Request:\nIndex=${reqIndex}\nAirline=${reqAirline}\nFlight=${reqFlight}\nTimestamp=${reqTimestamp}`);

  for (let i = START_ORACLE_INDEX; i < END_ORACLE_INDEX; i++) {
    const oracleAccount = accounts[i];
    const oracleIndexes = await flightSuretyApp.methods.getMyIndexes().call({
      from: oracleAccount,
      ...gasInput
    });
    if (oracleIndexes.includes(reqIndex)) {
      console.log(`Selected Oracle=${oracleAccount}`);
      const newFlightStatus = FLIGHT_STATUSES[Math.floor(Math.random() * FLIGHT_STATUSES.length)];
      flightSuretyApp.methods.submitOracleResponse(reqIndex, reqAirline, reqFlight, reqTimestamp, newFlightStatus).send({
        from: oracleAccount,
        ...gasInput
      })
    }
  }
}

async function attachApiEndpoints() {
  app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    });
  });
}

async function run() {
  await setup();
  await registerOracles();
  printOracleIndexes();
  subscribeToEvents();
  attachApiEndpoints();
}

run();

export default app;