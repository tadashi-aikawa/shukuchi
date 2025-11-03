# Shukuchi (縮地)

[![release](https://img.shields.io/github/release/tadashi-aikawa/shukuchi.svg)](https://github.com/tadashi-aikawa/shukuchi/releases/latest)
![downloads](https://img.shields.io/github/downloads/tadashi-aikawa/shukuchi/total)

Shukuchi is an Obsidian plugin that enables you to teleport to links (URL or internal link) and jump to their destinations.

https://user-images.githubusercontent.com/9500018/235339189-70bfef2b-2425-49aa-a35b-9fe30a1a6c4a.mp4

It essentially operates like the 'Follow link under cursor' command. The only difference is that even if there is no link under the cursor, it can close the distance to a nearby link and then navigate to its destination.

The priority of choosing a link is as follows.

1. Moves to the nearest link on the same line (depends on options).
2. If no link is on the same line, it moves to the link closest to the cursor.

## ⏬ Install

You can download from `Community plugins` in Obsidian settings.

## ⚙️ Options

![direction of possible teleportation](https://raw.githubusercontent.com/tadashi-aikawa/shukuchi/master/resources/direction-of-possible-teleportation.png)

## 🎮 Commands

- Open link
- Open link in new tab
- Open link in new tab group
- Open link in new tab group horizontally
- Open link in new window
- Move to next link
- Move to previous link

## 📱 Mobile support

It both supports desktop and mobile.

## ❓ Why the plugin's name is Shukuchi (縮地)?

> The word shukuchi (縮地) is a Japanese-language term for various mythical techniques of rapid movement.  
> (referenced from [Shukuchi \- Wikipedia](https://en.wikipedia.org/wiki/Shukuchi))


## 🖥️ For developers / contributors

### Pull requests

Sorry, I would not accept the pull requests except for the following cases.

1. Fix obvious bugs
2. Fix typo or wrong documentation
3. If I ask for it in the GitHub issues or the discussions

### Development

#### Install dependencies

[Bun] is required.

```console
bun i
bun dev
```

### Release

Run [Release Action](https://github.com/tadashi-aikawa/shukuchi/actions/workflows/release.yaml) manually.

