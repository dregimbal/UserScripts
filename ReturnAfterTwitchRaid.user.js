// ==UserScript==
// @name            Return After Twitch Raid
// @version         0.0.2
// @author          Dillon Regimbal
// @namespace       https://dillonr.com
// @description     Navigates back to the streamer you were watching after a raid
// @match           https://www.twitch.tv/*
// @run-at          document-idle
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_addStyle
// @noframes
// ==/UserScript==
// Since 2020-05-22
// https://github.com/dregimbal/UserScripts/blob/master/ReturnAfterTwitchRaid.user.js

// Extending Date
/* eslint-disable no-extend-native */

(function () {
    'use strict'

    // #region Config

    // The time before returning from a raid
    let raid_return_timeout_minutes = 2
    let raid_return_timeout_seconds = 30

    // The time between checking that you have raided
    let raid_url_check_delay_minutes = 5
    let raid_url_check_delay_seconds = 30

    // The colour of the buttons when returning from raids
    let button_background_colour = '#2CB9FE'
    let button_foreground_colour = '#FFFFFF'

    // The colour of the buttons when following raids
    let button_background_colour_disabled = '#4F7A26'
    let button_foreground_colour_disabled = '#FFFFFF'

    // If the font size of the buttons is too large or small, adjust the values here
    let font_scale = 1.6
    let min_font_size = 10
    let max_font_size = 20
    let button_font_size = '16px'

    // The text displayed on the button when returning from raids
    let twitch_return_enabled_text = 'Returning From Raids'

    // The text displayed on the button when following raids
    let twitch_return_disabled_text = 'Following Twitch Raids'

    let raid_button_class = 'dr_twitchRaidBtn'
    let raid_button_container_id = 'dr_twitchRaidBtnContainer'
    let var_return_from_raid = 'dr_ReturnFromRaid'
    let var_return_location = 'dr_TwitchReturnLocation'

    // #endregion

    // #region Styles

    let fira_code = document.createElement('link')
    fira_code.rel = 'stylesheet'
    fira_code.type = 'text/css'
    fira_code.href = 'https://cdn.jsdelivr.net/gh/tonsky/FiraCode@4/distr/fira_code.css'
    document.head.appendChild(fira_code)

    let dr_styles = document.createElement('style')
    dr_styles.id = 'dr_styles'
    let container_styles = `
        code { font-family: 'Fira Code', monospace; }
        @supports (font-variation-settings: normal) {
            code { font-family: 'Fira Code VF', monospace; }
        }
        .fixedPosition {
            position: fixed;
            left: 10px;
            bottom: 60px;
            width: 240px;
        }
        #${raid_button_container_id} {
            background-color: transparent;
            z-index: 69;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: stretch;
            flex-wrap: nowrap;
            margin: auto;
            padding: 0 10px;
        }
        `
    let animation_styles = `
        @keyframes show {
            from {opacity: 0;}
            to {opacity: 1;}
        }
        @keyframes hide {
            from {opacity: 1;}
            to {opacity: 0;}
        }
        #${raid_button_container_id}.visible .${raid_button_class} {
            visibility: visible !important;
            animation-name: show;
            animation-delay: 1s;
            animation-duration: 2s;
            animation-iteration-count: 1;
            animation-timing-function: ease-in-out;
            animation-fill-mode: forwards;
        }
        `
    let button_styles = `
        #${raid_button_container_id} .${raid_button_class} {
            background-color: ${button_background_colour};
            flex-basis: 0;
            border-radius: 2px;
            padding: 5px 10px;
            display: block;
            cursor: pointer;
            text-align: center;
            visibility: hidden;
            opacity: 0;
        }
        #${raid_button_container_id} .${raid_button_class} code {
            display: inline-block;
            width: 100%;
            max-width: 100%;
            font-family: 'Fira Code';
            color: ${button_foreground_colour} !important;
            font-size: ${button_font_size};
            font-weight: 400;
        }
        #${raid_button_container_id} .${raid_button_class}:not(:last-child) {
            margin-bottom: 10px;
        }
        #${raid_button_container_id}.disabled .${raid_button_class} {
            background-color: ${button_background_colour_disabled};
        }
        #${raid_button_container_id}.disabled .${raid_button_class} code {
            color: ${button_foreground_colour_disabled} !important;
        }
        `
    let included_styles = [animation_styles, container_styles, button_styles]

    dr_styles.innerText = ''
    included_styles.forEach(style => {
        dr_styles.innerText += style
    })
    document.head.appendChild(dr_styles)

    // #endregion

    // #region Fit Text

    /**
     * @description Resizes the font size of an element and it's children
     * @param {HTMLElement} element The element to set the font-size on
     * @returns {undefined}
     */
    function fitText(element) {
        element.childNodes.forEach(childElement => fitText(childElement))
        // console.log(element.tagName)
        if (element.tagName === 'CODE'
            && typeof element.textContent !== 'undefined'
            && typeof element.style !== 'undefined') {
            let elementLength = parseFloat(element.textContent.length)

            // console.log(`Font scale: ${font_scale}, length: ${elementLength}, width: ${element.offsetWidth} -|- Setting font size to ${Math.min(Math.max((element.offsetWidth / elementLength) * font_scale, min_font_size), max_font_size)}px`)
            element.style.fontSize = `${Math.min(Math.max((element.offsetWidth / elementLength) * font_scale, min_font_size), max_font_size)}px`
        }
    }

    // #endregion

    // #region Date Functions

    Date.prototype.addHours = function (h) {
        this.setTime(this.getTime() + (h * 60 * 60 * 1000))
        return this
    }

    Date.prototype.addMinutes = function (m) {
        this.setTime(this.getTime() + (m * 60 * 1000))
        return this
    }

    Date.prototype.addSeconds = function (s) {
        this.setTime(this.getTime() + (s * 1000))
        return this
    }

    // #endregion

    let return_from_raid = GM_getValue(var_return_from_raid, true)
    let return_location = GM_getValue(var_return_location, 'https://www.twitch.tv')

    function updateRaidLocation() {
        return_location = document.location
        GM_setValue(var_return_location, return_location)
        textRaidLocation.textContent = return_location
        fitText(divButtonContainer)
    }

    function toggleRaidStatus() {
        return_from_raid = !return_from_raid
        GM_setValue(var_return_from_raid, return_from_raid)
        textRaidStatus.textContent = return_from_raid ? twitch_return_enabled_text : twitch_return_disabled_text

        divButtonContainer.classList.toggle('disabled', !return_from_raid)
        fitText(divButtonContainer)
    }


    // #region Location Button

    let divRaidLocation = document.createElement('div')
    divRaidLocation.classList = raid_button_class

    let textRaidLocation = document.createElement('code')
    textRaidLocation.textContent = return_location

    divRaidLocation.appendChild(textRaidLocation)
    divRaidLocation.addEventListener('click', updateRaidLocation)

    // #endregion

    // #region Status Button

    let divRaidStatus = document.createElement('div')
    divRaidStatus.classList = raid_button_class

    let textRaidStatus = document.createElement('code')
    textRaidStatus.textContent = return_from_raid ? twitch_return_enabled_text : twitch_return_disabled_text

    divRaidStatus.appendChild(textRaidStatus)
    divRaidStatus.addEventListener('click', toggleRaidStatus)


    // #endregion

    // #region Timer Functions

    let raid_check_timer
    let checkCountDownTime
    let raid_return_timer
    let returnCountDownTime

    let divReturnTimer = document.createElement('div')
    divReturnTimer.classList = raid_button_class

    let textReturnTimer = document.createElement('code')
    textReturnTimer.textContent = `URL check in ${raid_url_check_delay_minutes}m, ${raid_url_check_delay_seconds}s`

    divReturnTimer.appendChild(textReturnTimer)
    divReturnTimer.addEventListener('click', checkUrl)

    function updateCheckTimer() {
        // Find the difference between now and the count down date
        let difference = checkCountDownTime.getTime() - new Date().getTime()

        // Time calculations for days, hours, minutes and seconds
        let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        let seconds = Math.floor((difference % (1000 * 60)) / 1000)

        textReturnTimer.textContent = `URL check in ${minutes}min, ${seconds}sec`

        // Once the timer reaches 0, check the URL
        if (difference < 0) {
            clearInterval(raid_check_timer)
            checkUrl()
        }
    }


    function updateReturnTimer() {
        // Find the difference between now and the count down date
        let difference = returnCountDownTime.getTime() - new Date().getTime()

        // Time calculations for days, hours, minutes and seconds
        let minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        let seconds = Math.floor((difference % (1000 * 60)) / 1000)

        textReturnTimer.textContent = `Raid check in ${minutes}min, ${seconds}sec`

        // Once the timer reaches 0, check the URL
        if (difference < 0) {
            clearInterval(raid_return_timer)
            if (return_from_raid) {
                document.location.assign(return_location)
            } else {
                textReturnTimer.textContent = 'Not handling raids'
            }
        }
    }

    function checkUrl() {
        clearInterval(raid_return_timer)
        clearInterval(raid_check_timer)

        let url = document.location.href
        if (url.includes('referrer=raid')) {
            // Start the return counter
            returnCountDownTime = new Date().addMinutes(raid_return_timeout_minutes).addSeconds(raid_return_timeout_seconds)
            raid_return_timer = setInterval(updateReturnTimer, 1000)
        } else {
            // Check the URL again after a delay
            checkCountDownTime = new Date().addMinutes(raid_url_check_delay_minutes).addSeconds(raid_url_check_delay_seconds)
            raid_check_timer = setInterval(updateCheckTimer, 1000)
        }
        setTimeout(() => {
            fitText(divButtonContainer)
        }, 1500)
    }

    checkUrl()

    // #endregion

    // #region Button Container

    let divButtonContainer = document.createElement('div')
    divButtonContainer.id = raid_button_container_id
    divButtonContainer.classList.toggle('disabled', !return_from_raid)

    divButtonContainer.appendChild(divRaidLocation)
    divButtonContainer.appendChild(divRaidStatus)
    divButtonContainer.appendChild(divReturnTimer)
    let sidebar = document.querySelector('div.side-bar-contents > div')
    if (typeof sidebar !== 'undefined') {
        sidebar.appendChild(divButtonContainer)
    } else {
        divButtonContainer.classList.add('fixedPosition')
        document.body.appendChild(divButtonContainer)
    }

    setTimeout(() => {
        // Fade in the buttons after a delay
        // to allow the text to be resized and the fonts loaded
        divButtonContainer.classList.add('visible')
    }, 3000)

    fitText(divButtonContainer)

    // #endregion
}())
