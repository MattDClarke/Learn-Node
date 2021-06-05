import { setErrorFor, setSuccessFor, isEmail } from './validatorUtil';

function checkInputs(formForgot, email) {
  const emailValue = email.value.trim();

  if (emailValue === '') {
    setErrorFor(email, 'Please add your email');
  } else if (emailValue.length > 50) {
    setErrorFor(email, 'Email is less than 51 characters long');
  } else if (!isEmail(emailValue)) {
    setErrorFor(email, 'Please add a valid email address');
  } else {
    setSuccessFor(email);
  }

  // submit form if no errors
  if (
    !(emailValue === '') &&
    !(emailValue.length > 50) &&
    isEmail(emailValue)
  ) {
    formForgot.submit();
  }
}

function forgotValidator(formForgot) {
  if (!formForgot) return;

  const { email } = formForgot;

  formForgot.on('submit', e => {
    e.preventDefault();
    checkInputs(formForgot, email);
  });
}

export default forgotValidator;
