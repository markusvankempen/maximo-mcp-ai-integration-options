# Maximo Mobile Key Concepts

## Overview

Maximo Mobile is a mobile application container used to create Android and iOS application packages (binary files) for installing Maximo Anywhere apps on mobile devices. It enables field workers to access and update Maximo data while working in disconnected or intermittently connected environments.

The IBM Maximo Anywhere application container is used to create the Android and iOS application packages (binary files) that are used to install Maximo Anywhere apps on mobile devices.

## Core Components

### Application Container

The Maximo Mobile application container is the foundation for building mobile applications. It provides:

- Support for Android, iOS, and Windows platforms
- Offline data synchronization capabilities
- Transaction management
- Local data storage
- Network state management

### Disconnected Operation

Maximo Mobile applications are designed to work in disconnected environments:

- Data is stored locally in SQLite databases
- Transactions are queued when offline and synchronized when connectivity is restored
- Supporting data (lookup data) is downloaded for offline reference

### Transaction System

The transaction system handles data modifications:

- Saves transaction data to the local database
- Syncs with the server when a connection is available
- Provides events for tracking transaction status
- Handles error conditions and conflict resolution

### Supporting Data (Lookup Data)

Supporting data, also referred to as lookup data, is supplementary data used by apps:

- Separate from transactional data
- Referenced by transactional data during app use
- Downloaded before an app is used for the first time
- Stored locally for offline use

### Network Management

Maximo Mobile includes a network management system that:

- Monitors network connectivity
- Manages server authentication
- Provides network state information to applications
- Triggers events when network state changes

## Architecture

Maximo Mobile applications are built using the Graphite framework, which provides:

- Declarative XML-based UI definitions
- JavaScript controllers for business logic
- Data binding between UI and data sources
- Integration with the Maximo REST APIs

The application architecture includes:

1. **UI Layer** - XML-based declarative interface
2. **Controller Layer** - JavaScript business logic
3. **Data Layer** - Local storage and server synchronization
4. **Communication Layer** - REST API integration with Maximo server

## Development Workflow

The typical development workflow for Maximo Mobile applications includes:

1. Setting up the development environment
2. Building the application container
3. Creating or modifying application code
4. Building and deploying the application
5. Testing on target devices
6. Debugging using browser-based tools

## Prerequisites

To work with Maximo Mobile, you need:

- Node.js (version depends on Maximo Mobile version)
- Java SDK (version depends on Maximo Mobile version)
- Android Studio (for Android development)
- Xcode (for iOS development)
- Visual Studio (for Windows development)
- Appropriate developer certificates and provisioning profiles

## Related Documentation

For more detailed information on specific topics, refer to:
- [Transactions](./transactions.md)
- [Supporting Data](./supporting-data.md)
- [Debugging](./debugging.md)
- [Network Management](./network-management.md)
- [Mobile App Development](./mobile-app-development.md)