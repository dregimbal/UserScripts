# UserScripts

## Bundle Helper

To use this script, click the "Mark Owned" button that appears at the bottom right of the page. Games that you own will be highlighted in green.

To avoid hitting Steam's servers too often, the script caches your [steam profile information](https://store.steampowered.com/dynamicstore/userdata/) locally and refreshes it after 15 minutes. You will need to be logged in to Steam for this request to work

The [Fanatical](https://www.fanatical.com) "pick-and-mix" bundle pages may require the [React Dev Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/) addon to work correctly

This script was modified from [7-elephant's](https://steamcommunity.com/id/7-elephant/) [Bundle Helper](https://greasyfork.org/en/scripts/16105-bundle-helper)

## SteamGifts Giveaway Entry

This script allows you to easily enter all (visible) giveaways on [SteamGifts](https://www.steamgifts.com/).

To use this script, click the "Find Giveaways!" button that appears at the bottom left of the page. The button will change to let you know how many giveaways will be entered. Click the button once more to enter the giveaways.

The script should respect/ignore giveaways that were hidden by [ESGST](https://github.com/rafaelgssa/esgst).

## Free Steam Packages Redeemer

Steam rate-limits activations to 50 per hour, so this script helps you redeem bulk amounts of packages. I used it to redeem ~4000 packages.

You can find a list of packages at [SteamDB](https://steamdb.info/freepackages/), which is also where much of the code comes from. Unfortunately, only 50 packages will show, so add the following style to the page to show all the packages: `#freepackages .package { display: block; }`

Next, modify the integer array to an array of objects with id/name attributes. I recommend you use regular expressions or find/replace to get this done quickly.

Finally, set the GreaseMonkey/TamperMonkey/ViolentMonkey variable `steamPackages` to your object array by uncommenting the `GM_setValue` line at the start of the script and inserting your array.

## Return After Twitch Raid

Adds buttons to the [Twitch](https://www.twitch.tv/) sidebar that enable you to automatically return to the stream you were watching after a raid.

You can configure the time before returning in the Config section at the top of the script.

The location button shows the return page, and clicking it will set the current URL to be the new destination.

The return button will allow you to toggle on and off the redirection function. You are able to stay with the raid party by toggling the redirection off before the redirect occurs.

The timer shows you the how long until the next raid check. Clicking the timer will reset the timer.

## Itchio Show Categories

Adds a button to [itch.io](https://itch.io/) that will add category tags for games
