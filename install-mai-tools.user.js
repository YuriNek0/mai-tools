// ==UserScript==
// @name         run mai-tools on all maimaidx-net pages
// @version      0.1
// @description  run mai-tools on all maimaidx-net pages
// @author       Ming-yuen Jien
// @match        https://maimaidx.jp/*
// @match        https://maimaidx-eng.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @downloadURL  https://yurinek0.github.io/mai-tools/install-mai-tools.user.js
// @updateURL    https://yurinek0.github.io/mai-tools/install-mai-tools.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const s = document.createElement('script');
    s.src = 'https://yurinek0.github.io/mai-tools/scripts/all-in-one.js';
    document.body.append(s);
})();
