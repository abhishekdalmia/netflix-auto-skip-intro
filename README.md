# Netflix Auto Skip Intro (Chrome Extension)

Automatically clicks Netflix “Skip Intro” when it appears during playback.

## Install (Load unpacked)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder: `netflix-auto-skip-intro`

## Use

- Go to `https://www.netflix.com/` and start playing an episode.
- When Netflix shows the “Skip Intro” button, it will be clicked automatically.
- Click the extension icon to toggle **Enabled** on/off.

## Notes

- Runs only on `https://www.netflix.com/`*
- Uses multiple selectors + a MutationObserver + a small interval fallback for reliability.

