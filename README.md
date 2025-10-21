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
Setting a samplerate or buffer size will incite pipewire to run with that fixed value.\
Toggling `Force Settings` will force the graph to run at the specified samplerate and buffer size unless set to dynamic.
Toggling `Persist on restart` will load the current configuration on restart. However settings can't be forced automatically on restart.

## Troubleshooting

<details>

<summary>Jack applications do not follow the specified settings</summary>

Jack applications will determine their buffer size and samplerate based on the environement variable `PIPEWIRE_QUANTUM` if it is set.

You can use `Force settings` to override it for this current session.

If you do not need it, `pipewire_quantum` is typically set in `/etc/profile.d/<some-file>.sh` or in `/etc/profile`.\
for example with ubuntu studio, you may comment out the content of `/etc/profile.d/ubuntustudio-pwjack.sh`:
```
sudo sed -i '1s/^/# /' /etc/profile.d/ubuntustudio-pwjack.sh
```

</details>
