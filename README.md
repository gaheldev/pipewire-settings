# pipewire-settings
Minimal pipewire configuration menu for Gnome Shell

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](/LICENSE.md)

<img width="835" height="657" alt="image" src="https://github.com/user-attachments/assets/b854e7ca-999a-4623-926b-3247d0fc93d2" />


## Installation
### Easy installation
Use your favorite extension manager or [the official website](https://extensions.gnome.org/extension/7699/pipewire-settings/).

### Manual installation
Clone the project and simply run install:
```
git clone https://github.com/gaheldev/pipewire-settings
cd pipewire-settings
chmod +x install
./install
```

You may have to log out and log back in on Wayland.\
On X11 you can also restart gnome shell with `alt+F2` and running the command `r`.

## Usage
Setting a samplerate or buffer size will incite pipewire to run with that fixed value.\
Toggling `Force Settings` will force the graph to run at the specified samplerate and buffer size unless set to dynamic.\
Toggling `Persist on restart` will load the current configuration on restart. However settings can't be forced automatically on restart.

## Troubleshooting

<details>

<summary>Jack applications do not follow the specified settings</summary>
<br>

Jack applications will determine their buffer size and samplerate based on the environement variable `PIPEWIRE_QUANTUM` if it is set.

You can use `Force settings` to override it for this current session.

If you do not need it, `PIPEWIRE_QUAANTUM` is typically set in `/etc/profile.d/<some-file>.sh` or in `/etc/profile`.\
for example with ubuntu studio, you may comment out the content of `/etc/profile.d/ubuntustudio-pwjack.sh`:
```
sudo sed -i '1s/^/# /' /etc/profile.d/ubuntustudio-pwjack.sh
```

</details>
