# Baseroot Agent SDK

The official Node.js SDK for building Developer-Hosted Agents on the Baseroot Protocol.

## Features
- **Token Verification**: Verify incoming requests from Baseroot users.
- **Attestation Signing**: Generate cryptographic proof of work to get paid.
- **Dataset Access**: Helper for requesting signed URLs for datasets.

## Structure
- `index.ts`: Main entry point
- `auth.ts`: JWT verification logic
- `crypto.ts`: Ed25519 signing logic
