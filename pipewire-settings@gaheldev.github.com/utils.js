import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';




export function getGIcon(iconFile) {
    const scriptPath = import.meta.url;
    const scriptDir = scriptPath.substring(0, scriptPath.lastIndexOf('/'));
    let iconPath = `${scriptDir}/icons/${iconFile}`;
    return Gio.icon_new_for_string(`${iconPath}`);
}


// Run a command synchronously and wait for it to finish
export function runCommand(command, args) {
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
