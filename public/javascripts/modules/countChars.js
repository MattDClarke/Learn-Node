import { $ } from './bling';

const textAreaCharCount = $('.textAreaCharCount');

function countChars(textArea) {
  if (!textArea) return;
  // set initial length
  textAreaCharCount.innerText = textArea.value.length;
  textArea.on('input', () => {
    const textLength = textArea.value.length;
    textAreaCharCount.innerText = textLength;
    textAreaCharCount.style.color = 'black';
    if (textLength > 1000) {
      textAreaCharCount.style.color = 'red';
    }
  });
}

export default countChars;
