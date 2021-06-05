import { setErrorFor, setSuccessFor } from './validatorUtil';

function checkInputs(formStore, name, description, lng, lat) {
  const nameValue = name.value.trim();
  const descriptionValue = description.value.trim();
  const lngValue = lng.value.trim();
  const latValue = lat.value.trim();

  if (nameValue === '') {
    setErrorFor(name, 'Please add a store name');
  } else if (nameValue.length < 3) {
    setErrorFor(name, 'Store name must be at least 3 characters long');
  } else if (nameValue.length > 50) {
    setErrorFor(name, 'Store name must be less than 50 characters long');
  } else {
    setSuccessFor(name);
  }

  if (descriptionValue === '') {
    setErrorFor(description, 'Please add a description');
  } else if (descriptionValue.length < 3) {
    setErrorFor(description, 'Description must be at least 3 characters long');
  } else if (descriptionValue.length > 1000) {
    setErrorFor(description, 'Description max: 1000 characters');
  } else {
    setSuccessFor(description);
  }

  if (lngValue === '') {
    setErrorFor(lng, 'Please add longitude.');
  } else if (lngValue < -180 || lngValue > 180) {
    console.log(typeof lngValue);
    setErrorFor(lng, 'Invalid logitude');
  } else {
    setSuccessFor(lng);
  }

  if (latValue === '') {
    setErrorFor(lat, 'Please add latitude.');
  } else if (latValue < -90 || latValue > 90) {
    setErrorFor(lat, 'Invalid latitude');
  } else {
    setSuccessFor(lat);
  }

  // submit form if no errors
  if (
    !(nameValue === '') &&
    !(nameValue.length < 3) &&
    !(nameValue.length > 50) &&
    !(descriptionValue === '') &&
    !(descriptionValue.length < 3) &&
    !(descriptionValue.length > 1000) &&
    !(lngValue === '') &&
    !(lngValue < -180 || lngValue > 180) &&
    !(latValue === '') &&
    !(latValue < -90 || latValue > 90)
  ) {
    formStore.submit();
  }
}

function storeValidator(formStore) {
  if (!formStore) return;

  const { name, description } = formStore;
  const lng = formStore.querySelector('#lng');
  const lat = formStore.querySelector('#lat');

  formStore.on('submit', e => {
    e.preventDefault();
    checkInputs(formStore, name, description, lng, lat);
  });
}

export default storeValidator;
