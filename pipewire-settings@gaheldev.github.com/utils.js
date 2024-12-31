import Gio from 'gi://Gio';



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
