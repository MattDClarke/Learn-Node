export function setErrorFor(input, message) {
  const formGroup = input.parentElement;
  const small = formGroup.querySelector('small');

  // add error message inside small
  small.innerText = message;

  // add error class
  formGroup.className = 'form-group error';
}

export function setSuccessFor(input) {
  const formGroup = input.parentElement;
  formGroup.className = 'form-group success';
}

export function isEmail(email) {
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    email
  );
}

export function isStrongPassword(password) {
  return /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*()_+=\-\{\}\[\]'":;<>./\\|]).{8,}$/.test(
    password
  );
}
