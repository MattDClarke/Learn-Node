function autocomplete(input, latInput, lngInput) {
  if (!input) return; // skip this fn if there is not input on the page
  // in layout.js - google api library loaded in script tag
  const dropdown = new google.maps.places.Autocomplete(input);

  // google maps method - addListener
  dropdown.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();
  });

  // if someone hits enter on address field, dnt submit
  // on defined in bling.js
  input.on('keydown', e => {
    if (e.keyCode === 13) e.preventDefault();
  });
}

export default autocomplete;
