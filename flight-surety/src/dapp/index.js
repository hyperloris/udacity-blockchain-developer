import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

(async () => {

  let result = null;

  let contract = new Contract('localhost', () => {
    const flights = ['DLH1', 'KAL1', 'SIA1', 'THY1', 'UAL1'];

    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error, result);
      display('Operational Status', 'Check if contract is operational', [{
        label: 'Operational Status',
        error: error,
        value: result
      }]);
    });

    populateSelect('select.account', contract.accounts);
    populateSelect('select.airline', contract.airlines);
    populateSelect('select.flight', flights);

    DOM.elid('registerAirline').addEventListener('click', () => {
      const from = getCurrentAccount();
      const airline = DOM.elid('registerAirlineAccount').value;
      const name = DOM.elid('registerAirlineName').value;
      contract.registerAirline(from, airline, name, (error, result) => {
        display('registerAirline', `From=${from}, Airline=${airline}, Name=${name}`, [{
          label: 'Result',
          error,
          value: 'Airline registered'
        }]);
      });
    });

    DOM.elid('fundAirline').addEventListener('click', () => {
      const from = getCurrentAccount();
      contract.fundAirline(from, (error, result) => {
        display('fundAirline', `From=${from}`, [{
          label: 'Result',
          error,
          value: 'Airline funded'
        }]);
      });
    });

    DOM.elid('registerFlight').addEventListener('click', () => {
      const from = getCurrentAccount();
      const flight = DOM.elid('registerFlightNumber').value;
      const timestamp = DOM.elid('registerFlightTimestamp').value;
      contract.registerFlight(from, flight, timestamp, (error, result) => {
        display('registerFlight', `From=${from}, Flight=${flight}, Timestamp=${timestamp}`, [{
          label: 'Result',
          error,
          value: 'Flight registered'
        }]);
      });
    });

    DOM.elid('buyFlightInsurance').addEventListener('click', () => {
      const from = getCurrentAccount();
      const airline = DOM.elid('buyFlightInsuranceAirline').value;
      const flight = DOM.elid('buyFlightInsuranceFlight').value;
      const timestamp = DOM.elid('buyFlightInsuranceTimestamp').value;
      contract.buyFlightInsurance(from, airline, flight, timestamp, (error, result) => {
        display('buyFlightInsurance', `From=${from}, Airline=${airline}, Flight=${flight}, Timestamp=${timestamp}`, [{
          label: 'Result',
          error,
          value: 'Insurance bought'
        }]);
      });
    });

    DOM.elid('fetchFlightStatus').addEventListener('click', () => {
      const from = getCurrentAccount();
      const airline = DOM.elid('fetchFlightStatusAirline').value;
      const flight = DOM.elid('fetchFlightStatusFlight').value;
      const timestamp = DOM.elid('fetchFlightStatusTimestamp').value;
      contract.fetchFlightStatus(from, airline, flight, timestamp, (error, result) => {
        display('fetchFlightStatus', `From=${from}, Airline=${airline}, Flight=${flight}, Timestamp=${timestamp}`, [{
          label: 'Result',
          error: error,
          value: 'Request submitted'
        }]);
      });
    });

    DOM.elid('withdrawBalance').addEventListener('click', () => {
      const from = getCurrentAccount();
      contract.withdrawBalance(from, (error, result) => {
        display('withdrawBalance', `From=${from}`, [{
          label: 'Result',
          error,
          value: 'Credits withdrawn'
        }]);
      });
    });

    DOM.elid('getBalance').addEventListener('click', () => {
      const from = getCurrentAccount();
      contract.getBalance(from, (error, result) => {
        display('getBalance', `From=${from}`, [{
          label: 'Result',
          error,
          value: result
        }]);
      });
    });
  });
})();

function getCurrentAccount() {
  return DOM.elq('.navbar select.account').value;
}

function populateSelect(q, data) {
  const elements = DOM.elQAll(q);
  console.log(elements)
  for (const el of elements) {
    for (const d of data) {
      el.appendChild(DOM.option(d));
    }
  }
}

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({
      className: 'row'
    }));
    row.appendChild(DOM.div({
      className: 'col-sm-4 field'
    }, result.label));
    row.appendChild(DOM.div({
      className: 'col-sm-8 field-value'
    }, result.error ? String(result.error) : String(result.value)));
    section.appendChild(row);
  })
  displayDiv.append(section);
}