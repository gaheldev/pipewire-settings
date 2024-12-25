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

const ByteArray = imports.byteArray;

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

        // ---------- Samplerate -------------
        const sampleRateItem = new PopupMenu.PopupSubMenuMenuItem('Sample Rate');
        ['44100', '48000', '88200', '96000'].forEach(rate => {
            sampleRateItem.menu.addAction(rate + ' Hz', () => {
                this._setSampleRate(parseInt(rate));
            });
        });
        sampleRateItem.setOrnament(PopupMenu.Ornament.DOT);
        this.menu.addMenuItem(sampleRateItem);


        // ---------- Buffer size -------------
        const bufferSizeItem = new PopupMenu.PopupSubMenuMenuItem('Buffer Size');
        ['32', '64', '128', '256', '512', '1024', '2048'].forEach(size => {
            bufferSizeItem.menu.addAction(size + ' frames', () => {
                this._setBufferSize(parseInt(size));
            });
        });
        this.menu.addMenuItem(bufferSizeItem);


        // ---------- Current Settings -------------
        this._currentSettings = new PopupMenu.PopupMenuItem('Current Settings', {
            reactive: false
        });
        this.menu.addMenuItem(this._currentSettings);

        this._updateCurrentSettings();

    }

    _setSampleRate(rate) {
        try {
            const proc = Gio.Subprocess.new(['pw-metadata', '-n', 'settings', '0', 'clock.force-rate', `${rate}`],
                Gio.SubprocessFlags.NONE);

            // // NOTE: triggering the cancellable passed to these functions will only
            // //       cancel the function NOT the process.
            // const cancellable = new Gio.Cancellable();
            //
            // // Strictly speaking, the only error that can be thrown by
            // // this function is Gio.IOErrorEnum.CANCELLED.
            // await proc.wait_async(cancellable);
            //
            // // The process has completed and you can check the exit status or
            // // ignore it if you just need notification the process completed.
            // if (proc.get_successful())
                this._updateCurrentSettings();
            // }
        } catch (e) {
            logError(e);
        }
    }

    _setBufferSize(size) {
        try {
            log(size);
            const proc = Gio.Subprocess.new(['pw-metadata', '-n', 'settings', '0', 'clock.force-quantum', `${size}`],
                Gio.SubprocessFlags.NONE);

            // NOTE: triggering the cancellable passed to these functions will only
            //       cancel the function NOT the process.
            // const cancellable = new Gio.Cancellable();

            // Strictly speaking, the only error that can be thrown by
            // this function is Gio.IOErrorEnum.CANCELLED.
            // await proc.wait_async(cancellable);

            // The process has completed and you can check the exit status or
            // ignore it if you just need notification the process completed.
            // if (proc.get_successful())
                this._updateCurrentSettings();
            // }
        } catch (e) {
            logError(e);
        }
    }

    _updateCurrentSettings() {
        runCommandAsync('pw-metadata', ['-n', 'settings', '0'])
            .then(stdout => {
                // log(stdout);
                // const output = ByteArray.toString(stdout); // FIXME: this fails, ByteArray is not known
                // const output = String.fromCharCode(stdout); 
                // const output = String.fromCharCode.apply(null, stdout);
                // const output = stdout.map(c => String.fromCharCode(c)).join('');
                // const output = TextDecoder.decode(stdout);
                log('---------------------------------------');
                const output = stdout;
                log(output)
                const rateMatch = output.match(/clock\.force-rate\'\s*value:\'(\d+)/);
                log(rateMatch);
                const sizeMatch = output.match(/clock\.force-quantum\'\s*value:\'(\d+)/);
                log(sizeMatch);
                
                const rate = rateMatch ? rateMatch[1] : 'default';
                const size = sizeMatch ? sizeMatch[1] : 'default';
                
                this._currentSettings.label.text = 
                    `Current: ${rate}Hz, ${size} frames`;
                log(this._currentSettings.label.text);
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

// Function to run a command and wait for it to finish
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
