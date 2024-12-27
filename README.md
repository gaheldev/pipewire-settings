# Pipewire top bar settings for Gnome Shell

![image](https://github.com/user-attachments/assets/c3920d2a-9f99-4a52-834c-0f8ecf4883c1)

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
