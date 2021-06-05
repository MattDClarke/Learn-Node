import {
  setErrorFor,
  setSuccessFor,
  isEmail,
  isStrongPassword
} from './validatorUtil';

function checkInputs(formLogin, email, password) {
  const emailValue = email.value.trim();
  const passwordValue = password.value.trim();

  if (emailValue === '') {
    setErrorFor(email, 'Please add your email');
  } else if (emailValue.length > 50) {
    setErrorFor(email, 'Email is less than 51 characters long');
  } else if (!isEmail(emailValue)) {
    setErrorFor(email, 'Please add a valid email address');
  } else {
    setSuccessFor(email);
  }

  if (passwordValue === '') {
    setErrorFor(password, 'Please add your password');
  } else if (passwordValue.length > 50) {
    setErrorFor(password, 'Password is less than 51 characters long');
  } else if (!isStrongPassword(passwordValue)) {
    setErrorFor(
      password,
      'Password is at least 8 characters long and contain at least 1 lowercase word, 1 uppercase word, 1 number and 1 symbol.'
    );
  } else {
    setSuccessFor(password);
  }

  // submit form if no errors
  if (
    !(emailValue === '') &&
    !(emailValue.length > 50) &&
    isEmail(emailValue) &&
    !(passwordValue.length > 50) &&
    isStrongPassword(passwordValue)
  ) {
    formLogin.submit();
  }
}

function loginValidator(formLogin) {
  if (!formLogin) return;

  const { email, password } = formLogin;

  formLogin.on('submit', e => {
    e.preventDefault();
    checkInputs(formLogin, email, password);
  });
}

export default loginValidator;
