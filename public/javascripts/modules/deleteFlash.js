function deleteFlash(flashDivs) {
  // will only run on map page
  if (flashDivs[0].innerText === '') return;
  const closeBtns = document.querySelectorAll('.flash-messages button');
  const numFlashes = closeBtns.length;

  for (let i = 0; i < numFlashes; i += 1) {
    closeBtns[i].removeAttribute('onclick');
    closeBtns[i].addEventListener('click', function() {
      this.parentElement.remove();
    });
  }
}

export default deleteFlash;
