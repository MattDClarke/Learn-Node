import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
  center: { lat: -33.982841506404405, lng: 25.656983134179786 },
  zoom: 13
};

function loadPlaces(
  map,
  currentLoc = false,
  lat = -33.982841506404405,
  lng = 25.656983134179786
) {
  axios
    .get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => {
      const places = res.data;
      // console.log(places);
      // create a bounds - for each marker - extend bounds to fit all on map nicely
      const bounds = new google.maps.LatLngBounds();
      const infoWindow = new google.maps.InfoWindow();

      // create a map marker for each place
      const markers = places.map(place => {
        // coords in different order in MongoDB
        const [placeLng, placeLat] = place.location.coordinates;
        //   console.log(placeLng, placeLat);
        const position = { lat: placeLat, lng: placeLng };
        bounds.extend(position);
        const marker = new google.maps.Marker({
          map,
          position
        });
        // store place info on the marker
        marker.place = place;
        return marker;
      });

      // when someone clicks on a marker show dets of that place
      // addListener - Google Maps equiv of addEventListener
      markers.forEach(marker =>
        marker.addListener('click', function() {
          console.log(this.place);
          // TODO - nested divs and <a> not displaying
          const html = `
        <div class="popup">
            <a href="/store/${this.place.slug}">
                <img src="/uploads/${this.place.photo || 'store.png'}" alt="${
            this.place.name
          }" />
                <p>${this.place.name} - ${this.place.location.address}</p>
            </a>
        </div>
        `;
          const html2 = `
            <img src="/uploads/${this.place.photo || 'store.png'}" alt="${
            this.place.name
          }" />
            <p>${this.place.name} - ${this.place.location.address}</p>     
          `;
          infoWindow.setContent(html);
          // this is the marker for a store
          infoWindow.open(map, this);
        })
      );

      // position (current location or lat and long from map search input)
      const pos = { lat, lng };

      // if loadPlaces() called using current location coords, then add a marker for the current location
      if (currentLoc === true) {
        bounds.extend(pos);
        const marker = new google.maps.Marker({
          pos,
          map
        });
        infoWindow.setPosition(pos);
        infoWindow.setContent(
          `${
            markers.length
              ? '<p>You are here.</p>'
              : '<p>You are here.</p><p>There are no stores nearby.</p>'
          }`
        );
        infoWindow.open(map, marker);
      }

      // console.log(markers);

      // no stores found nearby, not current location
      if (!places.length && currentLoc === false) {
        map.setCenter(pos);
        infoWindow.setPosition(pos);
        infoWindow.setContent('<p>No stores found.</p>');
        infoWindow.open(map);
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

function handleLocationError(browserHasGeolocation, infoWindow, pos, map) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? '<p>Error: The Geolocation service failed.</p>'
      : "<p>Error: Your browser doesn't support geolocation.</p>"
  );
  infoWindow.open(map);
}

function makeMap(mapDiv) {
  // will only run on map page
  if (!mapDiv) return;
  // in layout.js - google api library loaded in script tag
  // make our map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);
  const input = $('[name="geolocate"]');
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
  const infoWindow = new google.maps.InfoWindow();
  const locationButton = document.createElement('button');
  locationButton.textContent = 'Get my Location';
  locationButton.classList.add('button', 'custom-map-control-button');
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
          handleLocationError(true, infoWindow, map.getCenter(), map);
        }
      );
    } else {
      // Browser does not support geolocation
      handleLocationError(false, infoWindow, map.getCenter(), map);
    }
  });
}

export default makeMap;
