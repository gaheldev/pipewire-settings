/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';



const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.5, _('Pipewire settings menu'));

        // custom icon
        let pipewireIcon = 'pipewire-condensed-symbolic.svg' // alternative: pipewire-condensed-rings-symbolic.svg
        const Me = Extension.lookupByURL(import.meta.url);
        let iconPath = `${Me.path}/icons/${pipewireIcon}`;
        let gicon = Gio.icon_new_for_string(`${iconPath}`);
        let icon = new St.Icon({ gicon: gicon, style_class: 'system-status-icon', icon_size: 16 });

        this.add_child(icon);

        this.sampleRate = this._getSampleRate();
        this.bufferSize = this._getBufferSize();

        // ---------- Samplerate -------------
        this.sampleRateItem = new PopupMenu.PopupSubMenuMenuItem('Samplerate');
        this.menu.addMenuItem(this.sampleRateItem);

        // separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // ---------- Buffer size -------------
        this.bufferSizeItem = new PopupMenu.PopupSubMenuMenuItem('Buffer size');
        this.menu.addMenuItem(this.bufferSizeItem);

        // separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // ---------- Populate Submenus -------------
        this._populateSamplerates();
        this._populateBuffers();

        // ---------- Restore defaults -------------
        this.restoreItem = new PopupMenu.PopupMenuItem('Restore defaults');
        this.restoreItem.connect('activate', () => {this._restoreDefaults();});
        this.menu.addMenuItem(this.restoreItem);

        // update samplerates and buffer sizes when the menu opens
        // workaround to avoid segmentation faults when using _resetActions
        this.menu.connect('open-state-changed', (menu, open) => { if (open) this._updateMenu(); });
    }

    _resetActions() {
        this.sampleRateItem.menu.removeAll();
        this.bufferSizeItem.menu.removeAll();
        this._populateSamplerates();
        this._populateBuffers();
    }

    _restoreDefaults() {
        this._setSampleRate(0);
        this._setBufferSize(0);
    }

    _getSampleRateIcon(forceRate) {
        let ok = 'emblem-ok-symbolic';
        let nope = 'goa-account-symbolic'; // goa is an empty icon -> probably a hack?

        if (!this._isForceSampleRate())
            if (forceRate === '0') return ok;
            else return nope;

        if (forceRate === this.sampleRate) return ok;
        else return nope;
    }

    _populateSamplerates() {
        this._allowedForceRates().forEach(rate => {
            let display = rate === '0' ? 'Dynamic (default)' : rate + ' Hz';
            this.sampleRateItem.menu.addAction(display, () => {
                this._setSampleRate(parseInt(rate));
            }, this._getSampleRateIcon(rate))
        });
    }

    _getBufferSizeIcon(forceSize) {
        let ok = 'emblem-ok-symbolic';
        let nope = 'goa-account-symbolic'; // goa is an empty icon -> probably a hack?

        if (!this._isForceBufferSize())
            if (forceSize === '0') return ok;
            else return nope;

        if (forceSize === this.bufferSize) return ok;
        else return nope;
    }

    _populateBuffers() {
        this._allowedForceQuantums().forEach(size => {
            let display = size === '0' ? 'Dynamic (default)' : size;
            this.bufferSizeItem.menu.addAction(display, () => {
                this._setBufferSize(parseInt(size));
            }, this._getBufferSizeIcon(size))
        });
    }

    // TODO: get actual allowed ones?
    _allowedForceRates() {
        return ['0', '44100', '48000', '88200', '96000'];
    }

    // TODO: get actual allowed ones?
    _allowedForceQuantums() {
        return ['0', '32', '64', '128', '256', '512', '1024', '2048'];
    }

    _isForceSampleRate() {
        return this._getForceRate() !== '0';
    }

    _isForceBufferSize() {
        return this._getForceQuantum() !== '0';
    }

    _getForceRate() {
        let stdout = runCommand('pw-metadata', ['-n', 'settings', '0']);
        const forceRateMatch = stdout.match(/clock\.force-rate\'\s*value:\'(\d+)/);
        const forceRate = forceRateMatch===null ? '0' : forceRateMatch[1];
        return forceRate;
    }

    _getDefaultRate() {
        let stdout = runCommand('pw-metadata', ['-n', 'settings', '0']);
        const rateMatch = stdout.match(/clock\.rate\'\s*value:\'(\d+)/);
        if (rateMatch !== null)
            return rateMatch[1];
        else
            logError("Couldn't get pipewire's default rate");
    }

    /// return forced samplerate if defined, else default one
    _getSampleRate() {
        const forceRate = this._getForceRate();
        if (forceRate !== '0')
            return forceRate;
        else
            return this._getDefaultRate();
    }

    _getForceQuantum() {
        let stdout = runCommand('pw-metadata', ['-n', 'settings', '0']);
        const forceQuantumMatch = stdout.match(/clock\.force-quantum\'\s*value:\'(\d+)/);
        const forceQuantum = forceQuantumMatch===null ? '0' : forceQuantumMatch[1];
        return forceQuantum;
    }

    _getDefaultQuantum() {
        let stdout = runCommand('pw-metadata', ['-n', 'settings', '0']);
        const quantumMatch = stdout.match(/clock\.quantum\'\s*value:\'(\d+)/);
        if (quantumMatch !== null)
            return quantumMatch[1];
        else
            logError("Couldn't get pipewire's default quantum");
    }

    /// return forced quantum if defined, else default one
    _getBufferSize() {
        const forceQuantum = this._getForceQuantum();
        if (forceQuantum !== '0')
            return forceQuantum;
        else
            return this._getDefaultQuantum();
    }

    _setSampleRate(rate) {
        try {
            const proc = Gio.Subprocess.new(
                ['pw-metadata', '-n', 'settings', '0', 'clock.force-rate', `${rate}`],
                Gio.SubprocessFlags.NONE
            );
        } catch (e) {
            logError(e);
        }
    }

    _setBufferSize(size) {
        try {
            const proc = Gio.Subprocess.new(
                ['pw-metadata', '-n', 'settings', '0', 'clock.force-quantum', `${size}`],
                Gio.SubprocessFlags.NONE
            );
        } catch (e) {
            logError(e);
        }
    }

    _updateMenu() {
        this.sampleRate = this._getSampleRate();
        this.bufferSize = this._getBufferSize();

        let suffix = this._isForceSampleRate() ? '' : ' (dyn)';
        this.sampleRateItem.label.text = `Samplerate：${this.sampleRate} Hz` + suffix;

        suffix = this._isForceBufferSize() ? '' : ' (dyn)';
        this.bufferSizeItem.label.text = `Buffer size：${this.bufferSize}` + suffix;

        // only make restore button clickable when not in default settings
        this.restoreItem.reactive = this._isForceSampleRate() || this._isForceBufferSize();

        this._resetActions();
    }
});



// Function to run a command synchronously and wait for it to finish
function runCommand(command, args) {
    let subprocess = new Gio.Subprocess({
        argv: [command, ...args],
        flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
    });

    subprocess.init(null);

    let [ok, stdout, stderr] = subprocess.communicate_utf8(null, null);
    if (ok) {
        return stdout;
    } else {
        throw (new Error(stderr));
    }
}



export default class IndicatorExampleExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}
