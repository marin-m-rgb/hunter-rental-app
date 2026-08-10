# Hunter – Student Housing Coordination Platform

Hunter is a mobile platform designed to simplify the process of finding and managing student housing. The application connects renters and landlords through a centralized platform where users can browse properties, manage listings, communicate, and handle booking related activities.

## Features

### Renter

* Browse available rental properties
* Search and filter listings
* View properties on an interactive map
* View detailed property information
* Save listings
* Manage renter preferences and profile
* Submit and manage booking requests
* Receive booking and application notifications
* Communicate with landlords through in-app messaging
* Access a user guide

### Landlord

* Create and manage rental listings
* Upload and manage property images
* Edit property information
* View property details
* Manage booking requests
* Communicate with renters
* Manage landlord profile

### Authentication & Data

* Firebase Authentication
* Cloud Firestore database
* Firebase Cloud Storage for property images
* Firestore and Storage security rules
* Persistent authentication using AsyncStorage

## Technologies

* React Native
* Expo
* TypeScript
* Firebase Authentication
* Cloud Firestore
* Firebase Cloud Storage
* Google Maps
* React Navigation
* AsyncStorage

## Architecture

The application follows a feature-based structure that separates authentication, renter functionality, landlord functionality, shared functionality, navigation, configuration, and reusable components.

```text
src/
├── config/
├── features/
│   ├── auth/
│   ├── chat/
│   ├── landlord/
│   ├── renter/
│   └── shared/
├── navigation/
└── styles/
```

Firebase provides the application's authentication, database, and storage services, while Google Maps is used for location-based property functionality.

## Security

Environment variables are used for Firebase and Google Maps configuration. API credentials and local environment files are excluded from version control through `.gitignore`.

The repository includes Firestore and Firebase Storage security rules used to control access to application data.

## My Contribution

As part of the development team, I contributed to the design and implementation of the Hunter mobile application, including work across renter and landlord functionality, UI improvements, property management, search and filtering, maps, booking flows, notifications, and application integration.

The project was developed collaboratively using Git and GitHub, with features developed and integrated through separate branches.

## Getting Started

### Prerequisites

* Node.js
* npm
* Expo development environment
* Firebase project
* Google Maps API configuration

### Installation

Clone the repository and install the dependencies:

```bash
npm install
```

Create a local `.env` file and provide the Firebase and Google Maps configuration required by the application.

The environment variables used by the application include:

```text
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Start the Expo development server:

```bash
npx expo start
```

> The application requires a properly configured Firebase project and Google Maps API key to run all functionality.

## Project Context

Hunter was developed as a collaborative mobile application project during the Mobile Application Development and Strategy program at George Brown College.

The project combines mobile application development, cloud services, database design, authentication, location-based services, and role-based functionality into a single student housing platform.
