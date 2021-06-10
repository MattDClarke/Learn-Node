import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
  e.preventDefault();
  axios
    // this = the form (_storeCard.pug)
    .post(this.action)
    .then(res => {
      // this = form tag. In form, button has name of 'heart'. Can be accessed with . notation like a property on an object - the heart button
      const isHearted = this.heart.classList.toggle('heart__button--hearted');
      // heart count in nav
      $('.heart-count').textContent = res.data.hearts.length;
      if (isHearted) {
        this.heart.classList.add('heart__button--float');
        // why use arrow function? So u can use 'this' and still reference form tag (upper scope 'this')
        setTimeout(
          () => this.heart.classList.remove('heart__button--float'),
          2500
        );
      }
    })
    .catch(console.error);
}

export default ajaxHeart;
