import axios from 'axios';
import storePrompt from './storePrompt';

const mapOptions = {
  center: { lat: 40.71593544140297, lng: -74.00001584342776 },
  zoom: 13
};

function loadPlaces(
  map,
  currentLoc = false,
  lat = 40.71593544140297,
  lng = -74.00001584342776
) {
  axios
    .get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      // create a bounds - for each marker - extend bounds to fit all on map nicely
      const bounds = new google.maps.LatLngBounds();
      const iconBase = 'http://maps.google.com/mapfiles/kml/paddle/';

      // create a map marker for each place
      const markers = places.map(place => {
        // coords in different order in MongoDB
        const [placeLng, placeLat] = place.location.coordinates;
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({
          map,
          position,
          optimized: false
        });
        // store place info on the marker
        marker.place = place;
        return marker;
      });

      // when someone clicks on a marker show dets of that place
      // addListener - Google Maps equiv of addEventListener
      markers.forEach(marker => {
        marker.addListener('click', () => {
          // this is the marker for a store
          storePrompt(marker);
        });
      });

      // position (current location or lat and long from map search input)
      const pos = { lat, lng };

      // if loadPlaces() called using current location coords, then add a marker for the current location
      if (currentLoc === true) {
        bounds.extend(pos);
        const marker = new google.maps.Marker({
          pos,
          map,
          optimized: false
        });
        marker.setIcon(`${iconBase}ylw-circle.png`);
        marker.setPosition(pos);
        storePrompt('<p>You are here.</p>', false);
        marker.addListener('click', () => {
          // this is the marker for a store
          storePrompt('<p>You are here.</p>', false);
        });
      }
      // no stores found nearby, not current location
      if (!markers.length && currentLoc === false) {
        map.setCenter(pos);
        const marker = new google.maps.Marker({
          pos,
          map,
          optimized: false
        });
        marker.setIcon(`${iconBase}wht-blank.png`);
        marker.setPosition(pos);
        storePrompt('<p>No stores found.</p>', false);
        marker.addListener('click', () => {
          // this is the marker for a store
          storePrompt('<p>No stores found.</p>', false);
        });
        return;
      }

      // zoom map to fit all markers perfectly
      // stores found nearby, current location
      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);

      // zoom map out if no stores found nearby
      if (markers.length === 0) {
        map.zoom = 14;
        map.setCenter(pos);
      }
    })
    .catch(console.error);
}

function handleLocationError(browserHasGeolocation) {
  if (browserHasGeolocation) {
    storePrompt('<p>Error: The Geolocation service failed.</p>', false);
  }
  if (!browserHasGeolocation) {
    storePrompt(
      "<p>Error: Your browser doesn't support geolocation.</p>",
      false
    );
  }
}

function makeMap(mapDiv) {
  // will only run on map page
  if (!mapDiv) return;
  // in layout.js - google api library loaded in script tag
  // make our map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);
  const input = document.querySelector('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(
      map,
      false,
      place.geometry.location.lat(),
      place.geometry.location.lng()
    );
  });
  // to get current location
  const locationButton = document.createElement('button');
  locationButton.textContent = 'Get my Location';
  locationButton.classList.add('custom-map-control-button');
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);
  locationButton.addEventListener('click', () => {
    // HTML5 geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          loadPlaces(map, true, pos.lat, pos.lng);
        },
        () => {
          handleLocationError(true);
        }
      );
    } else {
      // Browser does not support geolocation
      handleLocationError(false);
    }
  });
}

export default makeMap;
