pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    struct Airline {
        address account;
        string name;
        bool registered;
        bool active;
        uint256 fund;
    }

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }

    struct FlightInsurance {
        address passenger;
        uint256 amount;
    }

    address private contractOwner;
    bool private operational = true;
    mapping(address => uint256) private authorizedContracts;

    uint256 private airlinesCount = 0;
    mapping(address => Airline) private airlines;
    mapping(address => uint256) private airlineVotes;
    mapping(address => mapping(address => bool)) private airlineVoters;

    mapping(bytes32 => Flight) private flights;

    mapping(bytes32 => FlightInsurance[]) private insurances;
    mapping(address => uint256) private insureeBalances;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _;
    }

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireIsCallerAuthorized() {
        require(
            authorizedContracts[msg.sender] == 1,
            "Caller is not an authorized contract"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    constructor(address firstAirlineAccount, string memory firstAirlineName) {
        contractOwner = msg.sender;
        airlines[firstAirlineAccount] = Airline(
            firstAirlineAccount,
            firstAirlineName,
            true,
            false,
            0
        );
        airlinesCount = airlinesCount.add(1);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns (bool) {
        return operational;
    }

    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    function authorizeContract(address contractAddress)
        external
        requireContractOwner
    {
        authorizedContracts[contractAddress] = 1;
    }

    function deauthorizeContract(address contractAddress)
        external
        requireContractOwner
    {
        delete authorizedContracts[contractAddress];
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function registerAirline(address airline, string calldata name)
        external
        requireIsOperational
        requireIsCallerAuthorized
    {
        airlines[airline] = Airline(airline, name, true, false, 0);
        airlinesCount = airlinesCount.add(1);
    }

    function fundAirline(address airline)
        external
        payable
        requireIsOperational
        requireIsCallerAuthorized
    {
        airlines[airline].fund = airlines[airline].fund.add(msg.value);
    }

    function activateAirline(address airline)
        external
        requireIsOperational
        requireIsCallerAuthorized
    {
        airlines[airline].active = true;
    }

    function addVoteToAirline(address voter, address airline)
        external
        requireIsOperational
        requireIsCallerAuthorized
    {
        airlineVoters[voter][airline] = true;
        airlineVotes[airline] = airlineVotes[airline].add(1);
    }

    function isAirline(address airline) external view returns (bool) {
        return airlines[airline].registered;
    }

    function isAirlineActive(address airline) external view returns (bool) {
        return airlines[airline].active;
    }

    function hasVotedForAirline(address voter, address airline)
        external
        view
        returns (bool)
    {
        return airlineVoters[voter][airline];
    }

    function getAirlineFunds(address airline) external view returns (uint256) {
        return airlines[airline].fund;
    }

    function getAirlineVotes(address airline) external view returns (uint256) {
        return airlineVotes[airline];
    }

    function getAirlinesCount() external view returns (uint256) {
        return airlinesCount;
    }

    function registerFlight(
        address airline,
        string memory flight,
        uint8 statusCode,
        uint256 timestamp
    ) external requireIsOperational requireIsCallerAuthorized {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        flights[flightKey] = Flight(true, statusCode, timestamp, airline);
    }

    function updateFlightStatus(bytes32 flightKey, uint8 statusCode)
        external
        requireIsOperational
        requireIsCallerAuthorized
    {
        flights[flightKey].statusCode = statusCode;
    }

    function buyFlightInsurance(
        address buyer,
        address airline,
        string memory flight,
        uint256 timestamp
    ) external payable requireIsOperational requireIsCallerAuthorized {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        insurances[flightKey].push(FlightInsurance(buyer, msg.value));
        airlines[airline].fund = airlines[airline].fund.add(msg.value);
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function creditInsurees(
        bytes32 flightKey,
        address airline,
        uint16 insuranceCreditMultiplier
    ) external requireIsOperational requireIsCallerAuthorized {
        FlightInsurance[] memory flightInsurances = insurances[flightKey];
        for (uint256 i = 0; i < flightInsurances.length; i++) {
            FlightInsurance memory passengerInsurance = flightInsurances[i];
            uint256 credit = passengerInsurance.amount.mul(insuranceCreditMultiplier).div(100);
            insureeBalances[passengerInsurance.passenger] = insureeBalances[passengerInsurance.passenger].add(credit);
            airlines[airline].fund = airlines[airline].fund.sub(credit);
        }
        delete insurances[flightKey];
    }

    function payInsuree(address insuree)
        external
        requireIsOperational
        requireIsCallerAuthorized
    {
        uint256 amount = insureeBalances[insuree];
        insureeBalances[insuree] = 0;
        payable(insuree).transfer(amount);
    }

    function getBalance(address insuree)
        external
        view
        requireIsOperational
        requireIsCallerAuthorized
        returns (uint256)
    {
        return insureeBalances[insuree];
    }

    fallback() external payable {}
}
