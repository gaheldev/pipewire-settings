# pipewire-settings
Minimal pipewire configuration menu for Gnome Shell

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](/LICENSE.md)

<img width="1024" height="954" alt="Screenshot From 2025-10-20 02-49-53" src="https://github.com/user-attachments/assets/c261a646-d261-4cd5-a882-1ddcf9c02a5a" />


## Installation
### Easy installation
Use your favorite extension manager or [the official website](https://extensions.gnome.org/extension/7699/pipewire-settings/).

### Manual installation
Clone the project and simply run install:
```
git clone https://github.com/gaheldev/pipewire-setting
cd pipewire-settings
chmod +x install
./install
```

You may have to log out and log back in on Wayland.\
On X11 you can also restart gnome shell with `alt+F2` and running the command `r`.

## Usage
Setting a samplerate or buffer size will force pipewire to run with that fixed value.\
Restoring defaults or setting it to dynamic will use your system's default configuration.\
Toggling `Persist Settings` will keep current configuration on restart.
