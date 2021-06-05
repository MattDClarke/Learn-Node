import {
  setErrorFor,
  setSuccessFor,
  isEmail,
  isStrongPassword
} from './validatorUtil';

function checkInputs(formRegister, name, email, password, passwordConfirm) {
  const nameValue = name.value.trim();
  const emailValue = email.value.trim();
  const passwordValue = password.value.trim();
  const passwordConfirmValue = passwordConfirm.value.trim();

  if (nameValue === '') {
    setErrorFor(name, 'Please add your name');
  } else if (nameValue.length < 3) {
    setErrorFor(name, 'Name must be at least 3 characters long');
  } else if (nameValue.length > 50) {
    setErrorFor(name, 'Name must be less than 51 characters long');
  } else {
    setSuccessFor(name);
  }

  if (emailValue === '') {
    setErrorFor(email, 'Please add your email');
  } else if (emailValue.length > 50) {
    setErrorFor(email, 'Email must be less than 51 characters long');
  } else if (!isEmail(emailValue)) {
    setErrorFor(email, 'Please add a valid email address');
  } else {
    setSuccessFor(email);
  }

  if (passwordValue === '') {
    setErrorFor(password, 'Please add a password');
  } else if (passwordValue.length > 50) {
    setErrorFor(password, 'Password must be less than 51 characters long');
  } else if (!isStrongPassword(passwordValue)) {
    setErrorFor(
      password,
      'Password should be at least 8 characters long and contain at least 1 lowercase word, 1 uppercase word, 1 number and 1 symbol.'
    );
  } else {
    setSuccessFor(password);
  }

  if (passwordConfirmValue === '') {
    setErrorFor(passwordConfirm, 'Please confirm your password');
  } else if (passwordValue !== passwordConfirmValue) {
    setErrorFor(passwordConfirm, 'Passwords do not match.');
  } else {
    setSuccessFor(passwordConfirm);
  }

  // submit form if no errors
  if (
    !(nameValue === '') &&
    !(nameValue.length < 3) &&
    !(nameValue.length > 50) &&
    !(emailValue === '') &&
    !(emailValue.length > 50) &&
    isEmail(emailValue) &&
    !(passwordValue.length > 50) &&
    isStrongPassword(passwordValue) &&
    !(passwordConfirmValue === '') &&
    passwordValue === passwordConfirmValue
  ) {
    formRegister.submit();
  }
}

function registerValidator(formRegister) {
  if (!formRegister) return;

  const { name, email, password, passwordConfirm } = formRegister;

  formRegister.on('submit', e => {
    e.preventDefault();
    checkInputs(formRegister, name, email, password, passwordConfirm);
  });
}

export default registerValidator;
