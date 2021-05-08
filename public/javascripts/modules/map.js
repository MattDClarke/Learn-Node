import axios from 'axios';
import { $ } from './bling';

// const currentLoc = $('.currentLoc');

const mapOptions = {
  center: { lat: -33.982841506404405, lng: 25.656983134179786 },
  zoom: 13
};

function loadPlaces(map, lat = -33.982841506404405, lng = 25.656983134179786) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`).then(res => {
    const places = res.data;
    console.log(places);
    if (!places.length) {
      alert('No places found!');
    }

    // create a bounds - for each marker - extend bounds to fit all on map nicely
    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    const markers = places.map(place => {
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
        // console.log(this);
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
        infoWindow.setContent(html);
        infoWindow.open(map, this);
      })
    );
    // console.log(markers);
    // zoom map to fit all markers perfectly
    map.setCenter(bounds.getCenter());
    map.fitBounds(bounds);
  });
}

// function getCurrentCoords() {
//   navigator.geolocation.getCurrentPosition(
//     position => {
//       loadPlaces(map, position.coords.latitude, position.coords.longitude);
//     },
//     // if there is an error - show default coords
//     err => loadPlaces(map, -26.159270707494013, 28.33199931541304)
//   );
// }

function makeMap(mapDiv) {
  // will only run on map page
  if (!mapDiv) return;
  // in layout.js - google api library loaded in script tag
  // make our map
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);
  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
}

// currentLoc.addEventListener('click', getCurrentCoords);

export default makeMap;
