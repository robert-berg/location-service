mapboxgl.accessToken =
  'pk.eyJ1IjoidXNlcjAxODUiLCJhIjoiY2xudTluNWRiMDkxZjJrcWNwNTd4amt4aSJ9.dMTfke1tz6q8MIBjLK3wJA';

// Define global variables, enums, and constants

const UserRole = {
  ADMIN: 'admin',
  NON_ADMIN: 'non-admin',
  NONE: 'none',
};

// Define classes

class User {
  constructor() {
    this.name = null;
    this._id = null;
    this.firstname = null;
    this.role = UserRole.NONE;
    this.observers = [];
  }

  addObserver(observer) {
    this.observers.push(observer);
  }

  removeObserver(observer) {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  notifyObservers() {
    this.observers.forEach((observer) => observer.update());
  }

  logUserInfo() {
    console.log(`User: ${this.name}`);
    console.log(`User Role: ${this.role}`);
  }

  async logIn(username, password) {
    try {
      const response = await fetch('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({username, password}),
      });

      if (response.ok) {
        const user = (await response.json()).user;
        this._id = user._id;
        this.name = user.username;
        this.firstname = user.firstname;
        this.role = user.role;
        this.applyUserRoleToUI(this.role);
        locationsController.mapController.update();
        this.logUserInfo();
        this.clearLoginForm();
        this.notifyObservers();
        return this;
      } else {
        console.log('Invalid username or password');
        return null;
      }
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  }

  logOut() {
    document.body.className = '';
    locationsController.mapController.clearMarkers();
  }

  applyUserRoleToUI(userRole) {
    document.body.className = ''; // Reset any existing roles
    switch (userRole) {
      case UserRole.ADMIN:
        document.body.classList.add('admin');
        break;
      case UserRole.NON_ADMIN:
        document.body.classList.add('non-admin');
        break;
    }
  }

  clearLoginForm() {
    document.querySelector('#usernameInput').value = '';
    document.querySelector('#passwordInput').value = '';
  }
}

class LocationsController {
  constructor() {
    this._locations = [];
    this.observers = [];
    this.updateLocations();
    this.currentLocationId = null;

    this.mapController = new MapController(
      new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [13.405, 52.52], // Coordinates of Berlin
        zoom: 10, // Set zoom level to show both Berlin and surrounding areas
        minZoom: 3, // Minimum zoom level
      }),
      this
    );
  }

  async fetchLocations() {
    try {
      const response = await fetch('/loc');
      if (response.ok) {
        this._locations = await response.json();
        this.updateLocations();
        this.notifyObservers();
      } else {
        throw new Error('Failed to fetch locations');
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      this.handleError(error.message);
    }
  }

  getLocations() {
    return loggedInUser ? this._locations : [];
  }

  addObserver(observer) {
    this.observers.push(observer);
  }

  removeObserver(observer) {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  notifyObservers() {
    this.observers.forEach((observer) => observer.update());
  }

  handleError(message) {
    alert(message);
  }

  getCoordinatesFromText(query, callback) {
    const apiUrl =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/` +
      encodeURIComponent(query) +
      `.json?proximity=ip&access_token=` +
      mapboxgl.accessToken;

    console.log(apiUrl);

    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {
      if (request.readyState == 4 && request.status == 200) {
        try {
          console.log(JSON.parse(request.responseText));
          callback(JSON.parse(request.responseText).features[0].center);
        } catch {
          return this.handleError('Fehler beim Erzeugen der Koordinaten');
        }
      }
    };

    request.open('GET', apiUrl, false);
    request.send(null);
  }

  updateLocations() {
    if (!document.body.classList.contains('none')) {
      const ul = document.querySelector('#main-screen > .locations');
      ul.innerHTML = '';
      this._locations.forEach((location, index) => {
        const li = document.createElement('li');

        li.onclick = () => {
          this.showDetailScreen(index);
        };

        li.appendChild(document.createTextNode(location.title));
        ul.appendChild(li);
      });
    }
  }

  async deleteLocation(index) {
    if (document.body.classList.contains('admin')) {
      if (index >= 0 && index < this._locations.length) {
        const locationId = this._locations[index]._id; // Assuming _id is the identifier
        try {
          const response = await fetch(`/loc/${locationId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            this.fetchLocations(); // Refresh locations list
          } else {
            throw new Error('Failed to delete location');
          }
        } catch (error) {
          console.error('Error deleting location:', error);
          this.handleError(error.message);
        }
      } else {
        console.error(`Invalid index: ${index}`);
      }
    }
  }

  deleteCurrentLocation() {
    if (document.body.classList.contains('admin')) {
      this.currentLocationId !== null && this.currentLocationId !== undefined
        ? (() => {
            this.deleteLocation(this.currentLocationId);
            this.hideDetailScreen();
          })()
        : undefined;
    }
  }

  async addLocation() {
    if (document.body.classList.contains('admin')) {
      const name = document.getElementById('add-name').value;
      const street = document.getElementById('add-street').value;
      const plz = document.getElementById('add-plz').value;
      const city = document.getElementById('add-city').value;

      if (!name || !street || !plz || !city) {
        return this.handleError('Alle Felder müssen ausgefüllt sein');
      }

      try {
        this.getCoordinatesFromText(
          street + ' ' + plz + ' ' + city,
          async (coordinates) => {
            const location = {
              title: name,
              description: '',
              street: street,
              zip: plz,
              city: city,
              state: '',
              lat: coordinates[1],
              lon: coordinates[0],
            };

            try {
              const response = await fetch('/loc', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(location),
              });

              if (response.ok) {
                const newLocationId = await response.text();
                this.fetchLocations(); // Refresh locations list
                document.querySelector('#home-radio').click();
              } else {
                throw new Error('Failed to add location');
              }
            } catch (error) {
              console.error('Error adding location:', error);
              this.handleError(error.message);
            }
          }
        );
      } catch {
        return this.handleError('Fehler beim Erzeugen der Koordinaten');
      }
    }
  }

  getLocation(index) {
    if (!document.body.classList.contains('none')) {
      if (index >= 0 && index < this._locations.length) {
        return this._locations[index];
      } else {
        console.error(`Location with index ${index} does not exist.`);
        return null;
      }
    }
  }

  showAddScreen(id) {
    if (document.body.classList.contains('admin')) {
      this.renderDetailsForm(this.getLocation(id));
      document.querySelector('.detail-panel').classList.add('show');
      document.querySelector('body').classList.add('showing-detail-screen');

      this.currentLocationId = id;
    }
  }

  hideAddScreen() {
    console.log('Detail panel closed');
    document.querySelector('.detail-panel').classList.remove('show');
    document.querySelector('body').classList.remove('showing-detail-screen');

    this.currentLocationId = null;
  }

  showDetailScreen(id) {
    if (!document.body.classList.contains('none')) {
      this.renderDetailsForm(this.getLocation(id));
      document.querySelector('.detail-panel').classList.add('show');
      document.querySelector('body').classList.add('showing-detail-screen');

      this.currentLocationId = id;
    }
  }

  hideDetailScreen() {
    console.log('Detail panel closed');
    document.querySelector('.detail-panel').classList.remove('show');
    document.querySelector('body').classList.remove('showing-detail-screen');

    this.currentLocationId = null;
  }

  renderDetailsForm(location) {
    const detailsFormElement = document.querySelector(
      '.detail-panel .screen form'
    );
    detailsFormElement.innerHTML = '';

    const isReadOnly = loggedInUser.role !== UserRole.ADMIN;

    const createInputField = (name, value, placeholder) => {
      const input = document.createElement('input');
      input.type = 'text';
      input.name = name;
      input.value = value || '';
      input.placeholder = placeholder;
      if (isReadOnly) {
        input.readOnly = true;
      }
      return input;
    };

    const createButton = (text, className, onClick) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.className = className;
      button.type = 'button';
      button.onclick = onClick;
      return button;
    };

    const heading = document.createElement('h2');
    heading.textContent = 'Standort ändern';

    const nameInput = createInputField('name', location.title, 'Name');
    const streetInput = createInputField('straße', location.street, 'Straße');
    const plzInput = createInputField('plz', location.zip, 'PLZ');
    const cityInput = createInputField('stadt', location.city, 'Stadt');

    const updateButton = createButton('Update', 'primary', () => {
      const updatedName = nameInput.value;
      const updatedStreet = streetInput.value;
      const updatedPlz = plzInput.value;
      const updatedCity = cityInput.value;

      this.updateLocation(
        this.currentLocationId,
        updatedName,
        updatedStreet,
        updatedPlz,
        updatedCity
      );
    });

    const deleteButton = createButton('Delete', '', () =>
      this.deleteCurrentLocation()
    );

    const cancelButton = createButton('Cancel', '', () =>
      this.hideDetailScreen()
    );

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'actions';

    if (!isReadOnly) {
      actionsDiv.appendChild(updateButton);
      actionsDiv.appendChild(deleteButton);
    }
    actionsDiv.appendChild(cancelButton);

    detailsFormElement.appendChild(heading);
    detailsFormElement.appendChild(nameInput);
    detailsFormElement.appendChild(streetInput);
    detailsFormElement.appendChild(plzInput);
    detailsFormElement.appendChild(cityInput);
    detailsFormElement.appendChild(actionsDiv);
  }

  updateLocation(index, name, street, plz, city) {
    if (document.body.classList.contains('admin')) {
      const applyLocationUpdate = async (
        index,
        name,
        street,
        plz,
        city,
        coordinates
      ) => {
        const location = this._locations[index];
        location.title = name;
        location.street = street;
        location.zip = plz;
        location.city = city;
        location.lon = coordinates[0];
        location.lat = coordinates[1];

        try {
          const response = await fetch(`/loc/${location._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(location),
          });

          if (response.ok) {
            this.fetchLocations();
          } else {
            throw new Error('Failed to update location');
          }
        } catch (error) {
          console.error('Error updating location:', error);
          this.handleError(error.message);
        }
      };

      if (index >= 0 && index < this._locations.length) {
        const location = this.getLocation(index);

        // Check if address-related fields have changed
        if (
          location.street !== street ||
          location.zip !== plz ||
          location.city !== city
        ) {
          this.getCoordinatesFromText(
            `${street} ${plz} ${city}`,
            (newCoordinates) => {
              applyLocationUpdate(
                index,
                name,
                street,
                plz,
                city,
                newCoordinates
              );
            }
          );
        } else {
          applyLocationUpdate(index, name, street, plz, city, [
            location.lon,
            location.lat,
          ]);
        }
      }
    }
  }
}

class MapController {
  constructor(map, locationsController) {
    this.map = map;
    this.locationsController = locationsController;
    this.locationsController.addObserver(this);

    const throttledResize = () =>
      setTimeout(() => {
        let outerWidth = document
          .getElementById('map')
          .getBoundingClientRect().width;
        let innerWidth = document
          .querySelector(
            '#map > div.mapboxgl-canvas-container.mapboxgl-interactive.mapboxgl-touch-drag-pan.mapboxgl-touch-zoom-rotate > canvas'
          )
          .getBoundingClientRect().width;
        if (outerWidth > innerWidth) {
          let preResizeBounds = this.map.getBounds();

          this.map.once('resize', () => {
            let postResizeWidth = outerWidth;
            let preResizeWidth = innerWidth;
            let rightPadding = postResizeWidth - preResizeWidth;

            // Apply the padding and maintain the current zoom level
            this.map.fitBounds(preResizeBounds, {
              padding: {top: 0, bottom: 0, left: 0, right: rightPadding},
              duration: 0, // Optional: Set to 0 for immediate repositioning without animation
            });
          });
          this.map.resize();
        }
      }, 0);

    new ResizeObserver(([_]) => {
      throttledResize();
    }).observe(this.map.getContainer());

    this.map.on('load', () => {
      this.update();
      this.bounds = this.map.getBounds();
      this.width = this.map.getContainer().offsetWidth;
    });

    this.markers = [];
  }

  _addMarker(location) {
    var el = document.createElement('div');
    el.innerHTML =
      '<svg height="30" width="20"><path d="M10,0 C4.486,0 0,4.486 0,10 C0,16.908 10,30 10,30 C10,30 20,16.908 20,10 C20,4.486 15.514,0 10,0 Z" fill="#FE795D"></svg>';

    this.markers.push(
      new mapboxgl.Marker(el)
        .setLngLat([location.lon, location.lat])
        .setPopup(
          new mapboxgl.Popup({offset: 25}) // add popups
            .setHTML('<strong>' + location.title + '</strong>')
        )
        .addTo(this.map)
    );
  }

  clearMarkers() {
    this.markers.forEach((marker) => marker.remove());
    this.markers = [];
  }

  update() {
    this.clearMarkers();
    let locations = this.locationsController.getLocations();
    if (!(locations === undefined)) {
      locations.forEach((location) => {
        this._addMarker(location);
      });
    }
  }
}

const locationsController = new LocationsController();

// Functions, Events and Listeners

let loggedInUser;

document.addEventListener('DOMContentLoaded', () => {
  const homeRadio = document.getElementById('home-radio');
  const navRadios = document.querySelectorAll('input[name="screen-toggle"]');
  const welcomeMessageElement = document.getElementById('welcome-message');
  navRadios.forEach((radio) => {
    radio.addEventListener('change', function () {
      if (
        !homeRadio.checked &&
        locationsController.currentLocationId !== null
      ) {
        locationsController.hideDetailScreen();
      }
    });
  });

  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn.addEventListener('click', () => {
    loggedInUser.logOut();
    loggedInUser = null;
  });

  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = document.getElementById('usernameInput').value;
    const password = document.getElementById('passwordInput').value;

    const user = await new User().logIn(username, password);
    if (user) {
      loggedInUser = user;
      welcomeMessageElement.textContent = `Willkommen ${loggedInUser.firstname}!`;
      locationsController.fetchLocations();
      homeRadio.click();
    } else {
      alert('Invalid username or password');
    }
  });
});
