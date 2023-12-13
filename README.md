# Standortdienst - Location Service

"Standortdienst" is a single page application that integrates Mapbox to provide a user-friendly interface for managing and displaying locations on a map of Berlin. The application doesn't use a framework, but dynamically updates the user interface through direct DOM manipulations.

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

## Setup

1. Clone the repository

```
git clone https://github.com/robert-berg/location-service
```

2. Open the `index.html` file in a modern web browser.

## Usage 

- Login/Logout: Use predefined user credentials to login. The application supports different roles with varying levels of access:

```  
[  
  {  
    "username": "admina",  
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

- Viewing Locations: Navigate to the "Map" to view locations marked on the map.
- Adding Locations: Admin users can add new locations using the "Add" option, providing details like name, street, city, etc.
- Editing and Deleting Locations: Admin users can also edit or remove existing locations.
