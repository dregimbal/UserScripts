// ==UserScript==
// @name            SteamGifts.com Giveaway Entry
// @version         1.0.1
// @author          Dillon Regimbal
// @namespace       https://dillonr.com
// @description     Easily enter all visible giveaways. Pairs well with ESGST (https://github.com/rafaelgssa/esgst)
// @match           *://www.steamgifts.com/*
// @match           *://steamgifts.com/*
// @run-at          document-idle
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @icon            https://store.steampowered.com/favicon.ico
// @noframes
// ==/UserScript==
// Since 2020-05-21
// https://greasyfork.org/scripts/
// https://github.com/dregimbal/UserScripts/blob/master/SteamGivawayEntry.user.js

(function () {
    'use strict'

    // #region Config

    let giveaway_selector = 'div.giveaway__row-outer-wrap:not(.esgst-hidden) a.giveaway__heading__name'
    let no_giveaways_text = 'Find Giveaways!'
    let button_background_colour = '#4F7A26'
    let button_foreground_colour = '#FFFFFF'
    let button_font_size = '18px'

    // #endregion

    // #region Styles

    let fira_code = window.document.createElement('link')
    fira_code.rel = 'stylesheet'
    fira_code.type = 'text/css'
    fira_code.href = 'https://cdn.jsdelivr.net/gh/tonsky/FiraCode@4/distr/fira_code.css'
    document.getElementsByTagName('HEAD')[0].appendChild(fira_code)

    GM_addStyle(`
        code { font-family: 'Fira Code', monospace; }
        @supports (font-variation-settings: normal) {
            code { font-family: 'Fira Code VF', monospace; }
        }
        @keyframes show {
            from {opacity: 0;}
            to {opacity: 1;}
        }
        @keyframes hide {
            from {opacity: 1;}
            to {opacity: 0;}
        }
        #enterAllBtn {
            background-color: ${button_background_colour};
            position: fixed;
            left: 20px;
            bottom: 20px;
            z-index: 69;
            border-radius: 2px;
            padding: 5px 10px;
            display: inline-block;
            cursor: pointer;
            text-align: center;
            visibility: hidden;
            opacity: 0;
        }
        #enterAllBtn a {
            font-family: 'Fira Code';
            text-decoration: none !important;
            cursor: pointer;
            color: ${button_foreground_colour} !important;
            font-size: ${button_font_size};
            font-weight: 400;
        }
        #enterAllBtn.visible {
            visibility: visible !important;
            animation-name: show;
            animation-delay: 1s;
            animation-duration: 2s;
            animation-iteration-count: 1;
            animation-timing-function: ease-in-out;
            animation-fill-mode: forwards;
        }
        `)

    // #endregion

    let giveawayIDs = []

    function enterGivaway() {
        if (giveawayIDs.length > 0) {
            GM_xmlhttpRequest(
                {
                    method: 'POST',
                    url: 'https://www.steamgifts.com/ajax.php',
                    data: `xsrf_token=${document.getElementsByName('xsrf_token')[0].value}&do=entry_insert&code=${giveawayIDs.pop()}`,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    onload: function (response) {
                        let e = JSON.parse(response.responseText)
                        if (e.type === 'success') {
                            console.log('Entry Count: ' + e.entry_count + ', Points: ' + e.points)
                        } else {
                            console.warn(e)
                        }
                        if (giveawayIDs.length > 0) {
                            enterGivaway()
                        } else {
                            enterBtnA.textContent = no_giveaways_text
                        }
                    }
                })
        } else {
            console.warn('Trying to enter a giveaway, but there are none to enter')
        }
    }

    function submitGiveaways() {
        enterBtnA.textContent = `Entering ${giveawayIDs.length} Giveaways!`
        divButton.addEventListener('click', findGiveaways)
        divButton.removeEventListener('click', submitGiveaways)
        enterGivaway()
    }

    function findGiveaways() {
        document.querySelectorAll(giveaway_selector)
            .forEach(giveaway => {
                let id = giveaway.href.replace('https://www.steamgifts.com', '').replace('/giveaway/', '').split('/')[0]
                if (!giveawayIDs.includes(id)) {
                    giveawayIDs.push(id)
                }
            })

        enterBtnA.textContent = `Enter ${giveawayIDs.length} Giveaways!`
        divButton.addEventListener('click', submitGiveaways)
        divButton.removeEventListener('click', findGiveaways)
    }

    let divButton = document.createElement('div')
    divButton.id = 'enterAllBtn'

    let enterBtnA = document.createElement('a')
    enterBtnA.setAttribute('onclick', 'return false;')
    enterBtnA.textContent = no_giveaways_text

    divButton.appendChild(enterBtnA)
    document.body.appendChild(divButton)
    divButton.addEventListener('click', findGiveaways)
    setTimeout(() => {
        divButton.classList.add('visible')
    }, 3000)
}())
