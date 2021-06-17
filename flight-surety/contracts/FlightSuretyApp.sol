pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";

import "./FlightSuretyData.sol";

contract FlightSuretyApp {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    uint8 private constant MAX_AIRLINES_WITHOUT_CONSENSUS = 4;
    uint256 private constant MINIMUM_AIRLINE_PARTECIPATION_FEE = 10 ether;
    uint256 private constant MAX_INSURANCE_FEE = 1 ether;
    uint16 private constant INSURANCE_CREDIT_MULTIPLIER = 150;

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;

    FlightSuretyData private flightSuretyData;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event FlightRegistered(address airline, string flight, uint256 timestamp);

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    modifier requireIsOperational() {
        require(
            flightSuretyData.isOperational(),
            "Contract is currently not operational"
        );
        _;
    }

    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireIsAirline() {
        require(
            flightSuretyData.isAirline(msg.sender),
            "Caller is not a registered airline"
        );
        _;
    }

    modifier requireIsNotAirline() {
        require(
            !flightSuretyData.isAirline(msg.sender),
            "Caller is a registered airline"
        );
        _;
    }

    modifier requireIsAirlineActive() {
        require(
            flightSuretyData.isAirlineActive(msg.sender),
            "Caller is not an active airline"
        );
        _;
    }

    modifier requireNotExceedMaxInsuranceFee() {
        require(
            msg.value <= MAX_INSURANCE_FEE,
            "Value is higher than the maximum spendable for insurance"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    constructor(address payable dataContract) {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(dataContract);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns (bool) {
        return flightSuretyData.isOperational();
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function registerAirline(address airline, string calldata name)
        external
        requireIsOperational
        requireIsAirline
        requireIsAirlineActive
        returns (bool success, uint256 votes)
    {
        require(
            !flightSuretyData.isAirline(airline),
            "This airline is already registered"
        );
        success = false;
        votes = flightSuretyData.getAirlineVotes(airline);
        uint256 airlinesCount = flightSuretyData.getAirlinesCount();
        if (airlinesCount >= MAX_AIRLINES_WITHOUT_CONSENSUS) {
            voteAirline(airline);
            votes = flightSuretyData.getAirlineVotes(airline);
            uint256 votesRequired = airlinesCount.mul(100).div(2);
            if (votes.mul(100) >= votesRequired) {
                flightSuretyData.registerAirline(airline, name);
                success = true;
            }
        } else {
            flightSuretyData.registerAirline(airline, name);
            success = true;
        }
    }

    function voteAirline(address airline) internal {
        bool alreadyVoted =
            flightSuretyData.hasVotedForAirline(msg.sender, airline);
        require(!alreadyVoted, "You already voted for this airline");
        flightSuretyData.addVoteToAirline(msg.sender, airline);
    }

    function fundAirline()
        external
        payable
        requireIsOperational
        requireIsAirline
    {
        flightSuretyData.fundAirline{value: msg.value}(msg.sender);
        uint256 fund = flightSuretyData.getAirlineFunds(msg.sender);
        if (fund >= MINIMUM_AIRLINE_PARTECIPATION_FEE) {
            flightSuretyData.activateAirline(msg.sender);
        }
    }

    function registerFlight(string calldata flight, uint256 timestamp)
        external
        requireIsOperational
        requireIsAirline
        requireIsAirlineActive
    {
        flightSuretyData.registerFlight(
            msg.sender,
            flight,
            STATUS_CODE_UNKNOWN,
            timestamp
        );
        emit FlightRegistered(msg.sender, flight, timestamp);
    }

    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) internal {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        flightSuretyData.updateFlightStatus(flightKey, statusCode);
        if (statusCode == STATUS_CODE_LATE_AIRLINE) {
            flightSuretyData.creditInsurees(
                flightKey,
                airline,
                INSURANCE_CREDIT_MULTIPLIER
            );
        }
    }

    function fetchFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external {
        uint8 index = getRandomIndex(msg.sender);
        bytes32 key =
            keccak256(abi.encodePacked(index, airline, flight, timestamp));
        ResponseInfo storage responseInfo = oracleResponses[key];
        responseInfo.isOpen = true;
        responseInfo.requester = msg.sender;

        emit OracleRequest(index, airline, flight, timestamp);
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function buyFlightInsurance(
        address airline,
        string memory flight,
        uint256 timestamp
    )
        external
        payable
        requireIsOperational
        requireIsNotAirline
        requireNotExceedMaxInsuranceFee
    {
        flightSuretyData.buyFlightInsurance{value: msg.value}(
            msg.sender,
            airline,
            flight,
            timestamp
        );
    }

    function withdrawBalance() external requireIsOperational {
        flightSuretyData.payInsuree(msg.sender);
    }

    /********************************************************************************************/
    /*                                       ORACLES                                            */
    /********************************************************************************************/

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    struct ResponseInfo {
        address requester;
        bool isOpen;
        mapping(uint8 => address[]) responses;
    }

    uint8 private nonce = 0;
    uint256 public constant REGISTRATION_FEE = 1 ether;
    uint256 private constant MIN_RESPONSES = 3;

    mapping(address => Oracle) private oracles;
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    function registerOracle() external payable {
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");
        uint8[3] memory indexes = generateIndexes(msg.sender);
        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes() external view returns (uint8[3] memory) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );
        return oracles[msg.sender].indexes;
    }

    function submitOracleResponse(
        uint8 index,
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) external {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key =
            keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        emit OracleReport(airline, flight, timestamp, statusCode);

        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function generateIndexes(address account)
        internal
        returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;
        uint8 random =
            uint8(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            blockhash(block.number - nonce++),
                            account
                        )
                    )
                ) % maxValue
            );

        if (nonce > 250) {
            nonce = 0;
        }

        return random;
    }
}
