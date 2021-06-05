import { setErrorFor, setSuccessFor, isEmail } from './validatorUtil';

function checkInputs(formAccount, name, email) {
  const nameValue = name.value.trim();
  const emailValue = email.value.trim();

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

  // submit form if no errors
  if (
    !(nameValue === '') &&
    !(nameValue.length < 3) &&
    !(nameValue.length > 50) &&
    !(emailValue === '') &&
    !(emailValue.length > 50) &&
    isEmail(emailValue)
  ) {
    formAccount.submit();
  }
}

function accountValidator(formAccount) {
  if (!formAccount) return;

  const { name, email } = formAccount;

  formAccount.on('submit', e => {
    e.preventDefault();
    checkInputs(formAccount, name, email);
  });
}

export default accountValidator;
