# Hunter – Student Housing App

Hunter helps students find housing on short notice with less back-and-forth. Renters filter by location, budget and lifestyle preferences, explore listings on a map, and follow a guide on what they'll need for a lease. Landlords open time slots for renters to book and chat with interested students.

[Figma prototype](https://www.figma.com/proto/hKEEZPDf8VtXo3CiHgNrNW/Hunter-App-WIP?node-id=355-551&p=f&t=YooTRhqEQOaj1aLP-1&scaling=scale-down&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=355%3A551) · [Demo video](https://marin-m-rgb.github.io/my-web-portfolio/assets/videos/hunter-demo.mp4)

## My Contribution

Hunter was built by a team of two over 3 motnhs. My role was one of the UX/UI DESIGNER AND FRONT-END DEVELOPER.

**Design:** I designed the renter experience and set the app's visual style in Figma, including onboarding, search and filtering, and the map view. The goal was a faster, more reliable housing search with less back-and-forth between students and landlords. 

**Development:** I implemented the MAP AND FILTERING FEATURES] and connected them to the DASHBOARD. This was the hardest technical part because of the sync connection between information and screens.

The project was developed collaboratively with Git and GitHub, with features built and integrated through separate branches.

## Features

### Renter

- Browse available rental properties
- Search and filter listings
- View properties on an interactive map
- View detailed property information
- Save listings
- Manage renter preferences and profile
- Submit and manage booking requests
- Receive booking and application notifications
- Communicate with landlords through in-app messaging
- Access a user guide

### Landlord

- Create and manage rental listings
- Upload and manage property images
- Edit property information
- View property details
- Manage booking requests
- Communicate with renters
- Manage landlord profile

### Authentication & Data

- Firebase Authentication
- Cloud Firestore database
- Firebase Cloud Storage for property images
- Firestore and Storage security rules
- Persistent authentication using AsyncStorage

## Technologies

- React Native
- Expo
- TypeScript
- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Storage
- Google Maps
- React Navigation
- AsyncStorage

## Architecture

The application follows a feature-based structure that separates authentication, renter functionality, landlord functionality, shared functionality, navigation, configuration, and reusable components.

```
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

## Getting Started

### Prerequisites

- Node.js
- npm
- Expo development environment
- Firebase project
- Google Maps API configuration

### Installation

Clone the repository and install the dependencies:

```
npm install
```

Create a local `.env` file and provide the Firebase and Google Maps configuration required by the application.

The environment variables used by the application include:

```
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Start the Expo development server:

```
npx expo start
```

> The application requires a properly configured Firebase project and Google Maps API key to run all functionality.

## Project Context

Hunter was developed as a collaborative mobile application project during the Mobile Application Development and Strategy program at George Brown Polytechnic.

The project combines mobile application development, cloud services, database design, authentication, location-based services, and role-based functionality into a single student housing platform.

The project combines mobile application development, cloud services, database design, authentication, location-based services, and role-based functionality into a single student housing platform.
