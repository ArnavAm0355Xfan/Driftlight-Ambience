# Driftlight Ambience
[![Release](https://img.shields.io/github/v/release/ArnavAm0355Xfan/Driftlight-Ambience)](https://github.com/ArnavAm0355Xfan/Driftlight-Ambience/releases) [![Stars](https://img.shields.io/github/stars/ArnavAm0355Xfan/Driftlight-Ambience?style=social)](https://github.com/ArnavAm0355Xfan/Driftlight-Ambience/)
 
Driftlight Ambience gives Spotify a moving ambient glow that follows your cover colors across the playlist page, top bar, Now Playing panel, player bar, and library sidebar. It's an open-source extension for the Spotify desktop client, built on [Spicetify](https://spicetify.app).
 
<img width="1598" height="897" alt="preview" src="https://github.com/user-attachments/assets/45345c3f-d321-41e3-aed5-5299cdbdbce2" />
[https://github.com/user-attachments/assets/c877787c-1f98-43af-94ef-9128f8355917](https://github.com/user-attachments/assets/7c203e72-d806-448f-9907-b0e928ce1ee5)
 
## Installation
 
### 1. Install Spicetify
**Windows** (PowerShell):
```powershell
iwr -useb https://raw.githubusercontent.com/spicetify/cli/main/install.ps1 | iex
```
 
### 2. Install Driftlight-Ambience
1. Open the **Marketplace** in Spotify.
2. Go to **Extensions** and search for **Driftlight-Ambience**.
3. Select **Install**.
<details>
<summary><strong>Manual installation</strong></summary>
1. Download [`Driftlight-Ambience.js`](./Driftlight-Ambience.js).
2. Put it in your Spicetify `Extensions` folder (run `spicetify config-dir` to find it).
3. Run:
```powershell
spicetify config extensions Driftlight-Ambience.js
spicetify apply
```
</details>
## Features
- One glow behind the whole window that slowly moves and breathes
- Player bar glow that sways with the cover colors
- Library sidebar glow built from your playlist covers
- Toggle button in Spotify's top bar
## Troubleshooting
If it doesn't load after a Spotify update, run these in order:
 
```powershell
spicetify apply
spicetify backup apply
spicetify update
```
 
## Credits
- Built on [Spicetify](https://spicetify.app).
- Inspired by [Spicy Lyrics](https://github.com/Spikerko/spicy-lyrics) by Spikerko.
- Includes a workflow adapted from [Unslop](https://heydamir.design/unslop) by Damir Sokolovsky (CC BY 4.0).
 
