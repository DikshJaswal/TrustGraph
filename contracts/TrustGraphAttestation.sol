// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TrustGraphAttestation {
    struct Attestation {
        bytes32 clusterHash;
        uint256 riskScore;
        address issuer;
        uint256 createdAt;
        bool revoked;
    }

    mapping(bytes32 => Attestation) public attestations;

    event AttestationIssued(
        bytes32 indexed id,
        bytes32 indexed clusterHash,
        uint256 riskScore,
        address indexed issuer
    );
    event AttestationRevoked(bytes32 indexed id);

    function issue(bytes32 id, bytes32 clusterHash, uint256 riskScore) external {
        require(attestations[id].createdAt == 0, 'already exists');
        attestations[id] = Attestation(clusterHash, riskScore, msg.sender, block.timestamp, false);
        emit AttestationIssued(id, clusterHash, riskScore, msg.sender);
    }

    function revoke(bytes32 id) external {
        require(attestations[id].issuer == msg.sender, 'only issuer');
        attestations[id].revoked = true;
        emit AttestationRevoked(id);
    }
}
