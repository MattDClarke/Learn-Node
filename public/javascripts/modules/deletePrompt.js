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
  // console.log(e.target.dataset);
  const deleteButton = e.target;
  return new Promise(async function(resolve) {
    const popup = document.createElement('form');
    popup.classList.add('popup');
    // add action and method attributes
    popup.setAttribute('method', 'POST');
    const { storeid, storename } = deleteButton.dataset;
    console.log(storeid, storename);
    popup.setAttribute('action', `/delete/${storeid}`);
    // action=`/delete/${store._id}` method="POST" class="card"
    popup.insertAdjacentHTML(
      'afterbegin',
      `
        <fieldset>
          <p class="popup--inner">
            Are you sure that you want to delete ${storename}?
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

    popup.addEventListener(
      'click',
      function(event) {
        const isOutside = !event.target.closest('.popup-inner');
        if (isOutside) {
          resolve(null);
          destroyPopup(popup);
        }
      },
      { once: true }
    );

    window.addEventListener(
      'keydown',
      event => {
        console.log(event);
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
