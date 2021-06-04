import { $ } from './bling';

const reviewFormCharCount = $('.reviewFormCharCount');

function countChars(textArea) {
  if (!textArea) return;
  console.log(textArea);

  textArea.on('input', () => {
    const textLength = textArea.value.length;
    reviewFormCharCount.innerText = textLength;
    reviewFormCharCount.style.color = 'black';
    if (textLength > 1000) {
      reviewFormCharCount.style.color = 'red';
    }
  });
}

export default countChars;
