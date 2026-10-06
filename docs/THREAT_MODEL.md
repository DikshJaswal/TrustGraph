# TrustGraph threat model

TrustGraph protects raw account, device, payment instrument, and transaction values by applying HMAC-SHA256 pseudonyms before graph analysis. Raw values and graph edges are never intended for blockchain storage.

Pseudonymization is not perfect anonymity: rare behavior, timing, merchant combinations, and graph structure can still enable re-identification. Production deployment needs tenant isolation, retention limits, encryption, access controls, issuer key rotation, false-positive review, and legal review.

Future privacy upgrades include rotating pseudonyms, differential privacy, secure multi-party computation, and zero-knowledge selective disclosure.
