import 'regenerator-runtime/runtime.js';
import '../sass/style.scss';

import { $, $$ } from './modules/bling';
import autocomplete from './modules/autocomplete';
import typeAhead from './modules/typeAhead';
import makeMap from './modules/map';
import ajaxHeart from './modules/heart';
import deletePrompt from './modules/deletePrompt';
import countChars from './modules/countChars';

autocomplete($('#address'), $('#lat'), $('#lng'));

typeAhead($('.search'));

makeMap($('#map'));

const heartForms = $$('form.heart');
heartForms.on('submit', ajaxHeart);
const deleteBtn = $('.delete-button');
if (deleteBtn) {
  deleteBtn.on('click', e => deletePrompt(e));
}

countChars($('form.reviewer textarea'));
