// debounce function
// it returns a function
const debounce = (callback, wait = 300) => {
  // timeoutID var is only executed once.
  // debounce() is only called once at the beginning. Wrapped function will be called many times
  let timeoutId = null;
  // when the wrapped function is called:
  // 1. cancel pre-existing timeout
  // 2. schedule a new timeout
  // array of args needed for apply(), which calls passed in function after timeout
  return (...args) => {
    // cancel previous set timeout execution
    // there will be a continous loop of cancelling old, and making new timeout, until the user stops typing (in search input case) long enough for callback.apply to run... then API call will occur
    window.clearTimeout(timeoutId);
    // setTimeout returns a timeoutID, which is a positive integer that ids the timer created by the call to setTimeOut()
    timeoutId = window.setTimeout(() => {
      // apply() calls a function with a given 'this' value and arguments provided as an array
      callback.apply(null, args);
    }, wait);
  };
};

export default debounce;
