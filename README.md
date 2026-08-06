## ⚠️ Notice: Limited Maintenance

Jul 11, 2025

This project is no longer actively developed. Features may break at any time and may or may not receive fixes. 

# Tools for maimai

## Install the bookmarklet

The generated site and scripts are available at https://yurinek0.github.io/mai-tools.

### Userscript

Install [install-mai-tools.user.js](https://github.com/YuriNek0/mai-tools/blob/gh-pages/install-mai-tools.user.js) with Tampermonkey or another userscript manager. The tools will then load automatically on maimai DX NET pages.

### Desktop

1. Bookmark any page and name the bookmark **MMBL**.
2. Edit the bookmark and replace its URL with:

       javascript:(function(d){var s=d.createElement('script');s.src='https://yurinek0.github.io/mai-tools/scripts/all-in-one.js';d.body.append(s)})(document)

3. Log in to maimai DX NET and open the page on which you want to use a tool.
4. Select the **MMBL** bookmark.

### Mobile

The easiest option is to create the bookmarklet on desktop and synchronize it to your mobile browser. Otherwise:

1. Copy the `javascript:` URL from the desktop instructions.
2. Bookmark any page and edit the new bookmark.
3. Replace its URL with the copied link and name it **MMBL**.
4. Log in to maimai DX NET and open the page on which you want to use a tool.
5. Enter `MMBL` in the address bar and select the bookmark whose URL starts with `javascript:`.

## Build

    npm ci
    npm run build

## Run

    npm start

## Develop

    npm run watch
    npm start
