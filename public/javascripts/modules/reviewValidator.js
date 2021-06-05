import { setErrorFor, setSuccessFor } from './validatorUtil';

function checkInputs(formReview, text) {
  const textValue = text.value.trim();

  if (textValue === '') {
    setErrorFor(text, 'Please add a review');
  } else if (textValue.length < 3) {
    setErrorFor(text, 'Review must be at least 3 characters long');
  } else if (textValue.length > 1000) {
    setErrorFor(text, 'Review max: 1000 characters');
  } else {
    setSuccessFor(text);
  }

  // submit form if no errors
  if (
    !(textValue === '') &&
    !(textValue.length < 3) &&
    !(textValue.length > 1000)
  ) {
    formReview.submit();
  }
}

function reviewValidator(formReview) {
  if (!formReview) return;

  const { text } = formReview;

  formReview.on('submit', e => {
    e.preventDefault();
    checkInputs(formReview, text);
  });
}

export default reviewValidator;
