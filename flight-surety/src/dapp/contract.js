import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
  constructor(network, callback) {
    const config = Config[network];
    this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
    this.initialize(callback);
    this.owner = null;
    this.accounts = [];
    this.airlines = [];
    this.passengers = [];
    this.gas = 4000000;
    this.gasPrice = 100000000000;
  }

  initialize(callback) {
    this.web3.eth.getAccounts((error, accts) => {
      this.accounts = accts;
      this.owner = accts[0];
      let counter = 1;
      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }
      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }
      callback();
    });
  }

  isOperational(callback) {
    const self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({
        from: self.owner,
      }, callback);
  }

  registerAirline(from, airline, name, callback) {
    const self = this;
    self.flightSuretyApp.methods
      .registerAirline(airline, name)
      .send({
        from,
        gas: self.gas,
        gasPrice: self.gasPrice
      }, callback);
  }

  fundAirline(from, callback) {
    const self = this;
    const value = this.web3.utils.toWei('10', 'ether');
    self.flightSuretyApp.methods
      .fundAirline()
      .send({
        from,
        value,
        gas: self.gas,
        gasPrice: self.gasPrice
      }, callback);
  }

  registerFlight(from, flight, timestamp, callback) {
    const self = this;
    self.flightSuretyApp.methods
      .registerFlight(flight, timestamp)
      .send({
        from,
        gas: self.gas,
        gasPrice: self.gasPrice
      }, callback);
  }

  isFlightRegistered(airline, flight, timestamp, callback) {
    const self = this;
    self.flightSuretyApp.methods
      .isFlightRegistered(airline, flight, timestamp)
      .call({
        from: self.owner,
      }, callback);
  }

  fetchFlightStatus(from, airline, flight, timestamp, callback) {
    const self = this;
    self.flightSuretyApp.methods
      .fetchFlightStatus(airline, flight, timestamp)
      .send({
        from,
      }, callback);
  }

  buyFlightInsurance(from, airline, flight, timestamp, callback) {
    const self = this;
    const value = this.web3.utils.toWei('1', 'ether');
    self.flightSuretyApp.methods
      .buyFlightInsurance(airline, flight, timestamp)
      .send({
        from,
        value,
        gas: self.gas,
        gasPrice: self.gasPrice
      }, callback)
  }

  withdrawBalance(from, callback) {
    const self = this;
    self.flightSuretyApp.methods
      .withdrawBalance()
      .send({
        from,
      }, callback);
  }

  getBalance(from, callback) {
    const self = this;
    self.flightSuretyApp.methods
      .getBalance()
      .call({
        from,
      }, callback);
  }
}