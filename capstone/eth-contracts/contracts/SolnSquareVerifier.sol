pragma solidity ^0.5.0;

import "./ERC721Mintable.sol";
import "./SquareVerifier.sol";

contract SolnSquareVerifier is PropertyToken {
    SquareVerifier private _verifier;

    struct Solution {
        uint256 index;
        address account;
    }

    Solution[] private _solutions;

    mapping(bytes32 => Solution) private _uniqueSolutions;

    event SolutionAdded(uint256 index, address account);

    constructor(address verifierAddress) public {
        _verifier = SquareVerifier(verifierAddress);
    }

    function mintNFT(
        address to,
        uint256 tokenId,
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[2] memory input
    ) public {
        bytes32 hash = keccak256(abi.encodePacked(a, b, c, input));
        require(_uniqueSolutions[hash].account == address(0), "Solution must be unique");
        bool isVerified = _verifier.verifyTx(a, b, c, input);
        require(isVerified, "Solution must be verified");
        _addSolution(hash, tokenId, to);
        mint(to, tokenId);
    }

    function _addSolution(
        bytes32 hash,
        uint256 index,
        address account
    ) internal {
        Solution memory solution = Solution(index, account);
        _solutions.push(solution);
        _uniqueSolutions[hash] = solution;
        emit SolutionAdded(index, account);
    }
}