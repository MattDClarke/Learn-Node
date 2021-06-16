function reviewStars(formReview) {
  if (!formReview) return;

  const starLabels = document.querySelectorAll('.reviewer__stars label');
  const starInputs = document.querySelectorAll('.reviewer__stars input');

  starLabels.forEach((starLabel, i) => {
    starLabel.addEventListener('keydown', e => {
      if (e.code === 'Enter' || e.code === 'Space') {
        starInputs[i].checked = true;
      }
    });
  });
}

export default reviewStars;
