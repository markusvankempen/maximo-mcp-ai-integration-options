# Maximo Mobile Knowledge Base

Welcome to the Maximo Mobile Knowledge Base. This documentation provides comprehensive information about Maximo Mobile development, configuration, and troubleshooting.

## Overview

Maximo Mobile is a mobile application container used to create Android and iOS application packages (binary files) for installing Maximo Anywhere apps on mobile devices. It enables field workers to access and update Maximo data while working in disconnected or intermittently connected environments.

## Table of Contents

### Core Concepts
- [Key Concepts](./key-concepts.md) - Overview and fundamental concepts of Maximo Mobile
- [Transactions](./transactions.md) - Transaction flow and error handling
- [Supporting Data](./supporting-data.md) - Lookup data information and management
- [Network Management](./network-management.md) - Network state management and connectivity

### Development
- [Mobile App Development](./mobile-app-development.md) - App development information, flags, and best practices
- [Mobile QBE Filter](./mobile-qbe-filter.md) - Data filtering in offline mobile applications
- [Debugging](./debugging.md) - Debugging and troubleshooting information

## Key Features

### Offline Capability
Maximo Mobile applications are designed to work in disconnected environments with:
- Local data storage in SQLite databases
- Transaction queuing when offline
- Synchronization when connectivity is restored
- Supporting data (lookup data) for offline reference

### Transaction Management
The transaction system handles data modifications by:
- Saving transaction data to the local database
- Syncing with the server when a connection is available
- Providing events for tracking transaction status
- Handling error conditions and conflict resolution

### Supporting Data
Supporting data (lookup data) is:
- Separate from transactional data
- Referenced by transactional data during app use
- Downloaded before an app is used for the first time
- Stored locally for offline use

### Network Management
The network management system:
- Monitors network connectivity
- Manages server authentication
- Provides network state information to applications
- Triggers events when network state changes

## Getting Started

To get started with Maximo Mobile development:

1. Set up your development environment with the required prerequisites
2. Build the application container
3. Create or modify application code
4. Build and deploy the application
5. Test on target devices

For detailed information on each topic, please refer to the specific documentation pages linked in the Table of Contents.