# pipewire-settings
Minimal pipewire configuration menu for Gnome Shell

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](/LICENSE.md)

![pipewire-settings-menu](https://github.com/user-attachments/assets/6b364340-4fd1-4007-9cde-e4c709a0d55c)

## Installation
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
Restoring defaults or setting it to dynamic will use your system's default configuration.
