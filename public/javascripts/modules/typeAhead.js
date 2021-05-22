import axios from 'axios';
import dompurify from 'dompurify';
import debounce from './debounce';

function searchResultsHTML(stores) {
  return stores
    .map(
      store => `
            <a href="/store/${store.slug}" class="search__result">
                <strong>${store.name}</strong>
            </a>
        `
    )
    .join('');
}

function typeAhead(search) {
  if (!search) return;
  const searchInput = search.querySelector('input[name="search');
  const searchResults = search.querySelector('.search__results');

  // on is short for add event listener - from Bling.js
  searchInput.on(
    'input',
    debounce(function() {
      // console.log('search input');
      // if there is no value, quit
      if (!searchInput.value) {
        searchResults.style.display = 'none';
        return;
      }
      // console.log(this.value);
      // show search results
      searchResults.style.display = 'block';

      axios
        .get(`/api/search?q=${searchInput.value}`)
        .then(res => {
          // console.log(res.data);
          if (res.data.length) {
            searchResults.innerHTML = dompurify.sanitize(
              searchResultsHTML(res.data)
            );
            return;
          }
          // tell user - no search results
          // console.log(res.data.length);
          searchResults.innerHTML = dompurify.sanitize(
            `<div class="search__result">No results for ${dompurify.sanitize(
              searchInput.value,
              { ALLOWED_TAGS: [] }
            )}
             found!</div>`
          );
        })
        .catch(err => {
          console.error(err);
        });
    }, 600)
  );

  // handle keyboard inputs
  searchInput.on('keyup', e => {
    // if user is not pressing, up, down or enter then ignore
    if (![38, 40, 13].includes(e.keyCode)) {
      return;
    }
    console.log(e.keyCode);
    // move to next <a> on up or down
    const activeClass = 'search__result--active';
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result');
    let next;
    if (e.keyCode === 40 && current) {
      // if there is no next Element sibling - 1st item
      next = current.nextElementSibling || items[0];
      // first press down
    } else if (e.keyCode === 40) {
      next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    } else if (e.keyCode === 13 && current.href) {
      window.location = current.href;
      return;
    }
    if (current) {
      current.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
  });
}

export default typeAhead;
