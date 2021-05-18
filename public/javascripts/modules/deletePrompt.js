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

function deletePrompt(e) {
  const deleteButton = e.target;
  return new Promise(async function(resolve) {
    const popup = document.createElement('form');
    popup.classList.add('popup');
    popup.setAttribute('method', 'POST');
    // check if store delete button or account delete button
    let urlParam;
    let item;
    if ('userid' in deleteButton.dataset) {
      urlParam = 'account/delete';
      item = 'your account';
    }
    if ('storeid' in deleteButton.dataset) {
      urlParam = `delete/${deleteButton.dataset.storeid}`;
      item = deleteButton.dataset.storename;
    }

    popup.setAttribute('action', `/${urlParam}`);
    popup.insertAdjacentHTML(
      'afterbegin',
      `
        <fieldset class="popup--inner">
          <p>
            Are you sure that you want to delete ${item}?
          </p>
          <button type="submit" class="button">Yes</button>
        </fieldset>
        `
    );

    const cancelButton = document.createElement('button');
    // make sure it does not trigger submit
    cancelButton.type = 'button';
    cancelButton.textContent = 'no';
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

    popup.addEventListener(
      'submit',
      function() {
        resolve();
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

export default deletePrompt;
