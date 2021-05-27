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

    struct FlightInsurance {
        address passenger;
        uint256 amount;
    }

    address private contractOwner;
    bool private operational = true;
    mapping(address => uint256) private authorizedContracts;

    mapping(address => Airline) private airlines;
    mapping(bytes32 => FlightInsurance[]) private insurances;

    uint256 private airlinesCount = 0;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
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
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
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
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
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

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address account, string calldata name)
        external
        requireIsCallerAuthorized
    {
        airlines[account] = Airline(account, name, true, false, 0);
        airlinesCount = airlinesCount.add(1);
    }

    function fundAirline(address account)
        external
        payable
        requireIsCallerAuthorized
    {
        airlines[account].fund = airlines[account].fund.add(msg.value);
    }

    function activateAirline(address account)
        external
        requireIsCallerAuthorized
    {
        airlines[account].active = true;
    }

    function isAirline(address account) external view returns (bool) {
        return airlines[account].registered;
    }

    function isAirlineActive(address account) external view returns (bool) {
        return airlines[account].active;
    }

    function getAirlineFunds(address account) external view returns (uint256) {
        return airlines[account].fund;
    }

    function getAirlinesCount() external view returns (uint256) {
        return airlinesCount;
    }

    function buyFlightInsurance(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external payable requireIsOperational requireIsCallerAuthorized {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        insurances[flightKey].push(FlightInsurance(msg.sender, msg.value));
        airlines[airline].fund = airlines[airline].fund.add(msg.value);
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees() external pure {}

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay() external pure {}

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund() public payable {}

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    fallback() external payable {
        fund();
    }
}
