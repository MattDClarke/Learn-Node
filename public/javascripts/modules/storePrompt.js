import { wait } from './util';

async function destroyPopup(popup) {
  popup.classList.remove('open');
  // wait for css animation
  await wait(1000);
  popup.remove();
  /* eslint-disable no-param-reassign */
  popup = null;
  /* eslint-enable no-param-reassign */
}

function storePrompt(data, store = true) {
  // const deleteButton = e.target;
  return new Promise(async function(resolve) {
    const popup = document.createElement('div');
    popup.classList.add('popup');

    popup.insertAdjacentHTML(
      'afterbegin',
      `
      <div class="popup--inner">
      ${
        store
          ? `
         <a href="/store/${data.place.slug}">
              <img src="/uploads/${data.place.photo || 'store.png'}" alt="${
              data.place.name
            }" />
              <p>${data.place.name} - ${data.place.location.address}</p>
          </a>
        `
          : `
        ${data}
        `
      }
         
      </div>
      `
    );

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Exit';
    cancelButton.type = 'button';
    cancelButton.classList.add('button');
    popup.firstElementChild.appendChild(cancelButton);

    cancelButton.addEventListener(
      'click',
      function() {
        resolve(null);
        destroyPopup(popup);
      },
      { once: true }
    );

    popup.addEventListener('click', function(event) {
      const isOutside = !event.target.closest('.popup--inner');
      if (isOutside) {
        resolve(null);
        destroyPopup(popup);
      }
    });

    window.addEventListener(
      'keydown',
      event => {
        if (event.key === 'Escape') {
          resolve(null);
          destroyPopup(popup);
        }
      },
      { once: true }
    );

    // insert popup into DOM
    document.body.appendChild(popup);
    // wait for CSS animation
    await wait(50);
    popup.classList.add('open');
  });
}

export default storePrompt;
