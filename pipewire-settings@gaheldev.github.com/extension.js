/*   pipewire-settings: gnome extension to configure pipewire from the top bar
 *   Copyright (C) 2024 Gahel
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {PipewireTopBarMenu} from './menu.js';



export default class PipewireSettingsExtension extends Extension {
    enable() {
        this._topBarMenu = new PipewireTopBarMenu();
        Main.panel.addToStatusArea(this.uuid, this._topBarMenu);
    }

    disable() {
        this._topBarMenu.destroy();
        this._topBarMenu = null;
    }
}
