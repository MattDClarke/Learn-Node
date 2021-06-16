import 'regenerator-runtime/runtime.js';
import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';
import deletePrompt from './modules/deletePrompt';
import countChars from './modules/countChars';
import registerValidator from './modules/registerValidator';
import accountValidator from './modules/accountValidator';
import loginValidator from './modules/loginValidator';
import forgotValidator from './modules/forgotValidator';
import resetValidator from './modules/resetValidator';
import storeValidator from './modules/storeValidator';
import reviewValidator from './modules/reviewValidator';
import reviewStars from './modules/reviewStars';
import deleteFlash from './modules/deleteFlash';

autocomplete($('#address'), $('#lat'), $('#lng'));

typeAhead($('.search'));

makeMap($('#map'));

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);
const deleteBtn = $('.delete-button');
if (deleteBtn) {
  deleteBtn.on('click', e => deletePrompt(e));
}

countChars($('form.formReview textarea'));
countChars($('form.formStore textarea'));

registerValidator($('form.formRegister'));
accountValidator($('form.formAccount'));
loginValidator($('form.formLogin'));
forgotValidator($('form.formForgot'));
resetValidator($('form.formReset'));
storeValidator($('form.formStore'));
reviewValidator($('form.formReview'));
reviewStars($('form.formReview'));
// may be more than 1
deleteFlash($$('.flash-messages'));
