# Location Service

This web app is a single page application that integrates Mapbox to provide a user-friendly interface for managing and displaying locations on a map of Berlin. The application doesn't use a ui framework, but dynamically updates the user interface through direct DOM manipulations. It uses Express.js in combination with MongoDB on the server-side.

## Demo

### [➡️ Live Demo (without backend)](https://location-service-berlin.netlify.app/)

Login credentials:

```  
[  
  {  
    "username": "admin",  
    "password": "password",  
    "role": "admin"  
  },  
  {  
    "username": "normalo",  
    "password": "password",  
    "role": "non-admin"  
  }  
]  
``` 

## Screenshots

### Places
![Places or Locations List](/screenshots/places.png)
*A list view of all the places*

### Location Details 
![Location Details View](/screenshots/detail.png)
*Detailed information for each location can be viewed and edited*

### Main Map View
![Main Map View](/screenshots/map.png)
*The main map view showcases the interactive map with markers for each location*

### Add Location Screen
![Add Location Screen](/screenshots/add.png)
*Screen for adding new locations*

### Login Screen
![Login Screen](/screenshots/login.png)
*The login screen*


## Key Features

- User Authentication: login and logout functionality.
- Location Management: Admin users can add, delete, and update location details.
- Interactive Map: Uses Mapbox for displaying and interacting with location data.
- Address to Geocoordinate Conversion: Dynamically generates geocoordinates from addresses using Mapbox

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6)
- Mapbox GL JS API
- Express.js
- MongoFB

## Setup

1. Clone the repository

```
git clone https://github.com/robert-berg/location-service
```

2. Connect your own MongoDB database in `src/db/mongoCRUDs.js`

3. Run `npm i` and `npm start`

## Usage 

- Login/Logout: The application supports different roles with varying levels of access
- Viewing Locations: Navigate to the "Map" to view locations marked on the map.
- Adding Locations: Admin users can add new locations using the "Add" option, providing details like name, street, city, etc.
- Editing and Deleting Locations: Admin users can also edit or remove existing locations.
