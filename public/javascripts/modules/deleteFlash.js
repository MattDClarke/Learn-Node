function deleteFlash(flashDiv) {
  // will only run on map page
  if (flashDiv.innerText === '') return;
  const closeBtn = flashDiv.querySelector('button');
  closeBtn.removeAttribute('onclick');
  closeBtn.addEventListener('click', function(e) {
    this.parentElement.remove();
  });
}

export default deleteFlash;
