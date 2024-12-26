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


/* Gio.Subprocess */
Gio._promisify(Gio.Subprocess.prototype, "communicate_utf8_async");

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('My Shiny Indicator'));

        this.add_child(new St.Icon({
            icon_name: 'audio-card-symbolic',
            style_class: 'system-status-icon',
        }));

        this.sampleRate = this._getSampleRate();
        this.bufferSize = this._getBufferSize();

        // ---------- Samplerate -------------
        this.sampleRateItem = new PopupMenu.PopupSubMenuMenuItem('Sample Rate');
        this.menu.addMenuItem(this.sampleRateItem);

        // separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // ---------- Buffer size -------------
            // TODO
        this.bufferSizeItem = new PopupMenu.PopupSubMenuMenuItem('Buffer Size');
        this.menu.addMenuItem(this.bufferSizeItem);

        // separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // ---------- Populate Submenus -------------
        this._populateSamplerates();
        this._populateBuffers();

        // ---------- Current Settings -------------
        this._currentSettings = new PopupMenu.PopupMenuItem('Current Settings', {
            reactive: false
        });
        this.menu.addMenuItem(this._currentSettings);

        this._updateCurrentSettings();

    }

    _resetActions() {
        this.sampleRateItem.menu.removeAll();
        this.bufferSizeItem.menu.removeAll();
        this._populateSamplerates();
        this._populateBuffers();
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
        log(forceSize);
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
        let stdout = runCommand('pw-metadata', ['-n', 'settings', '0']);
        const forceRateMatch = stdout.match(/clock\.force-rate\'\s*value:\'(\d+)/);
        return forceRateMatch[1] !== '0';
    }

    _isForceBufferSize() {
        let stdout = runCommand('pw-metadata', ['-n', 'settings', '0']);
        const forceQuantumMatch = stdout.match(/clock\.force-quantum\'\s*value:\'(\d+)/);
        return forceQuantumMatch[1] !== '0';
    }

    /// return forced samplerate if defined, else default one
    _getSampleRate() {
        let stdout = runCommand('pw-metadata', ['-n', 'settings', '0']);
        const forceRateMatch = stdout.match(/clock\.force-rate\'\s*value:\'(\d+)/);
        if (forceRateMatch[1] !== '0') {
                return forceRateMatch[1];
        } else {
            const rateMatch = stdout.match(/clock\.rate\'\s*value:\'(\d+)/);
            return rateMatch[1];
        }
    }

    /// return forced quantum if defined, else default one
    _getBufferSize() {
        let stdout = runCommand('pw-metadata', ['-n', 'settings', '0']);
        const forceQuantumMatch = stdout.match(/clock\.force-quantum\'\s*value:\'(\d+)/);
        if (forceQuantumMatch[1] !== '0') {
                return forceQuantumMatch[1];
        } else {
            const quantumMatch = stdout.match(/clock\.quantum\'\s*value:\'(\d+)/);
            return quantumMatch[1];
        }
    }

    _setSampleRate(rate) {
        try {
            const proc = Gio.Subprocess.new(
                ['pw-metadata', '-n', 'settings', '0', 'clock.force-rate', `${rate}`],
                Gio.SubprocessFlags.NONE
            );
            this._updateCurrentSettings();
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
            this._updateCurrentSettings();
        } catch (e) {
            logError(e);
        }
    }

    _updateBufferSize() {
        runCommandAsync('pw-metadata', ['-n', 'settings', '0'])
            .then(stdout => {
                const output = stdout;
                const bufferMatch = output.match(/clock\.quantum\'\s*value:\'(\d+)/);
                
                this.bufferSize = rateMatch[1];
            })
            .catch(error => {
                logError(error);
            });
    }

    _updateCurrentSettings() {
        runCommandAsync('pw-metadata', ['-n', 'settings', '0'])
            .then(stdout => {
                this.sampleRate = this._getSampleRate();
                this.bufferSize = this._getBufferSize();

                this._currentSettings.label.text = 
                    `Current: ${this.sampleRate}Hz, ${this.bufferSize} frames`;
                log(this._currentSettings.label.text);

                this._resetActions();
            })
            .catch(error => {
                logError(error);
            });
    }
});

function logToFile(message) {
    let logfile = '/home/gael/gnome-shell-extension.log';
    let file = Gio.File.new_for_path(logfile);
    let outputStream = file.append_to(Gio.FileCreateFlags.NONE, null);
    let out = new Gio.DataOutputStream({ base_stream: outputStream });
    out.put_string(`${new Date().toISOString()} - ${message}\n`, null);
    out.close(null);
}

// Function to run an async command and wait for it to finish
function runCommandAsync(command, args) {
    return new Promise((resolve, reject) => {
        let subprocess = new Gio.Subprocess({
            argv: [command, ...args],
            flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
        });

        subprocess.init(null);

        subprocess.communicate_utf8_async(null, null, (proc, res) => {
            try {
                let [ok, stdout, stderr] = proc.communicate_utf8_finish(res);
                if (ok) {
                    resolve(stdout);
                } else {
                    reject(new Error(stderr));
                }
            } catch (e) {
                reject(e);
            }
        });
    });
}

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
