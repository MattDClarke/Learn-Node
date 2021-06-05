import { setErrorFor, setSuccessFor, isStrongPassword } from './validatorUtil';

function checkInputs(formReset, password, passwordConfirm) {
  const passwordValue = password.value.trim();
  const passwordConfirmValue = passwordConfirm.value.trim();

  if (passwordValue === '') {
    setErrorFor(password, 'Please add a password');
  } else if (passwordValue.length > 50) {
    setErrorFor(password, 'Password must be less than 50 characters long');
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
    !(passwordValue.length > 50) &&
    isStrongPassword(passwordValue) &&
    !(passwordConfirmValue === '') &&
    passwordValue === passwordConfirmValue
  ) {
    formReset.submit();
  }
}

function resetValidator(formReset) {
  if (!formReset) return;

  const { password, passwordConfirm } = formReset;

  formReset.on('submit', e => {
    e.preventDefault();
    checkInputs(formReset, password, passwordConfirm);
  });
}

export default resetValidator;
