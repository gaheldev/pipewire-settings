import {runCommand} from './utils.js';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';



export class PipewireConfig {
    constructor() {
        this.sourceId = null;

        this.waitForPipewire(
            (config) => {
                this.update();
            },
            () => {
                logError("[pipewire-settings] PipeWire did not respond after waiting. The extension may not work correctly.");
            }
        );


        this.force = false;
        // delete former conf file that's now been moved to pipewire.conf.d
        this._deleteLegacyConfig();
    }

    removeTimeoutSource() {
        if (this.sourceId) {
            GLib.Source.remove(this.sourceId);
            this.sourceId = null;
        }
    }

    // Check if pipewire config can be read, wait 1s of not
    waitForPipewire(onSuccess, onFailure) {
        var maxAttempts = 10;
        var attempt = 0;
        const delayMs = 1000;

        // make sure potential preexisting loop source is removed
        this.removeTimeoutSource();

        this.sourceId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, delayMs, () => {
            const config = this._getConfig();

            // pipewire is ready
            if (config !== '') {
                if (onSuccess) onSuccess(config);
                return GLib.SOURCE_REMOVE;
            }

            attempt += 1
            if (attempt >= maxAttempts) {
                if (onFailure) onFailure();
                return GLib.SOURCE_REMOVE;
            }

            return GLib.SOURCE_CONTINUE;
        });
    }


    isPipewireMetadataAvailable() {
        if (!this.config)
            return false;
        return this.config !== '';
    }


    update() {
        //FIXME: use only getters, to avoid side effects
        this.config = this._getConfig();
        if (this.config === '')
            return;

        this.defaultRate = this._parseDefaultRate();
        this.forceRate = this._parseForceRate();
        this.defaultQuantum = this._parseDefaultQuantum();
        this.forceQuantum = this._parseForceQuantum();
        this.sampleRate = this.forceRate === '0' ? this.defaultRate : this.forceRate;
        this.bufferSize = this.forceQuantum === '0' ? this.defaultQuantum : this.forceQuantum;

        this.customConfigDir = GLib.build_filenamev([
            GLib.get_user_config_dir(),
            'pipewire',
            'pipewire.conf.d'
        ]);
        this.customConfigPath = GLib.build_filenamev([
            this.customConfigDir,
            "pwsettings-gnome-extension.conf"
        ]);
        this.persistence = this._customConfigExists();
    }


    isForceSampleRate() {
        return this.forceRate !== '0';
    }


    isForceQuantum() {
        return this.forceQuantum !== '0';
    }


    // TODO: get actual allowed ones?
    allowedForceRates() {
        return ['0', '44100', '48000', '88200', '96000', '176000', '192000', '352800', '384000'];
    }


    // TODO: get actual allowed ones?
    allowedForceQuantums() {
        return ['0', '32', '48', '64', '96', '128', '256', '512', '1024', '2048'];
    }


    setForce(force) {
        this.force = force
        this.setSampleRate(this.defaultRate)
        this.setBufferSize(this.defaultQuantum)
    }


    setSampleRate(rate) {
        try {
            // TODO: use runCommand instead

            var proc;
            if (rate !== '0' && rate !== 0) {
                // set min rate
                proc = Gio.Subprocess.new(
                    ['pw-metadata', '-n', 'settings', '0', 'clock.min-rate', `${rate}`],
                    Gio.SubprocessFlags.NONE
                );

                // set max rate
                proc = Gio.Subprocess.new(
                    ['pw-metadata', '-n', 'settings', '0', 'clock.max-rate', `${rate}`],
                    Gio.SubprocessFlags.NONE
                );

                // set default rate
                proc = Gio.Subprocess.new(
                    ['pw-metadata', '-n', 'settings', '0', 'clock.rate', `${rate}`],
                    Gio.SubprocessFlags.NONE
                );
            }

            // force/unforce rate
            const forcedRate = this.force ? rate : '0';
            proc = Gio.Subprocess.new(
                ['pw-metadata', '-n', 'settings', '0', 'clock.force-rate', `${forcedRate}`],
                Gio.SubprocessFlags.NONE
            );

            if (this.persistence) { this._writeConfigFile() };
        } catch (e) {
            logError("[pipewire-settings] " + e);
        }
    }


    setBufferSize(size) {
        try {
            // TODO: use runCommand instead

            var proc;
            if (size !== '0' && size !== 0) {
                // set min quantum
                proc = Gio.Subprocess.new(
                    ['pw-metadata', '-n', 'settings', '0', 'clock.min-quantum', `${size}`],
                    Gio.SubprocessFlags.NONE
                );

                // set max quantum
                proc = Gio.Subprocess.new(
                    ['pw-metadata', '-n', 'settings', '0', 'clock.max-quantum', `${size}`],
                    Gio.SubprocessFlags.NONE
                );

                // set default quantum
                proc = Gio.Subprocess.new(
                    ['pw-metadata', '-n', 'settings', '0', 'clock.quantum', `${size}`],
                    Gio.SubprocessFlags.NONE
                );
            }

            // force/unforce quantum
            const forcedSize = this.force ? size : '0';
            proc = Gio.Subprocess.new(
                ['pw-metadata', '-n', 'settings', '0', 'clock.force-quantum', `${forcedSize}`],
                Gio.SubprocessFlags.NONE
            );

            if (this.persistence) { this._writeConfigFile() };
        } catch (e) {
            logError("[pipewire-settings] " + e);
        }
    }


    setPersistence(persist) {
        if (persist) {
            this._writeConfigFile();
        } else {
            this._deleteConfigFile();
        }
    }


    _getConfig() {
        let config = '';
        try {
            config = runCommand('pw-metadata', ['-n', 'settings', '0']);
        } catch(e) {
            logError("[pipewire-settings] attempt to get pipewire metadata failed: " + e);
        }
        return config;
    }


    _parseDefaultRate() {
        const rateMatch = this.config.match(/clock\.rate\'\s*value:\'(\d+)/);
        if (rateMatch !== null)
            return rateMatch[1];
        else {
            logError("[pipewire-settings] Couldn't get pipewire's default rate");
            return null;
        }
    }


    _parseForceRate() {
        const forceRateMatch = this.config.match(/clock\.force-rate\'\s*value:\'(\d+)/);
        const forceRate = forceRateMatch===null ? '0' : forceRateMatch[1];
        return forceRate;
    }


    _parseDefaultQuantum() {
        const quantumMatch = this.config.match(/clock\.quantum\'\s*value:\'(\d+)/);
        if (quantumMatch !== null)
            return quantumMatch[1];
        else {
            logError("[pipewire-settings] Couldn't get pipewire's default quantum");
            return null;
        }
    }


    _parseForceQuantum() {
        const forceQuantumMatch = this.config.match(/clock\.force-quantum\'\s*value:\'(\d+)/);
        const forceQuantum = forceQuantumMatch===null ? '0' : forceQuantumMatch[1];
        return forceQuantum;
    }


    _customConfigExists() {
        const file = Gio.File.new_for_path(this.customConfigPath);
        return file.query_exists(null)
    }


    _writeConfigFile() {
        this.update();
        const dir = Gio.File.new_for_path(this.customConfigDir);
        if (!dir.query_exists(null)) {
            dir.make_directory_with_parents(null);
        }

        // when persisting changes, we constrain quantum rate by setting min and max to the value we want
        // setting force-quantum in a config file is not supported
        // setting default quantum only will not be respected whenever an application asks for more
        const configContent = `# Generated by pipewire-settings gnome extension - Do not edit.
context.properties = {
    default.clock.min-rate = ${this.sampleRate}
    default.clock.rate = ${this.sampleRate}
    default.clock.max-rate = ${this.sampleRate}
    default.clock.min-quantum = ${this.bufferSize}
    default.clock.quantum = ${this.bufferSize}
    default.clock.max-quantum = ${this.bufferSize}
}
`;

        try {
            const file = Gio.File.new_for_path(this.customConfigPath);
            const [success] = file.replace_contents(
                configContent,
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null
            );

            if (!success) {
                logError(`[pipewire-settings] Failed to write config: ${this.customConfigPath}`);
            }
        } catch (e) {
            logError('[pipewire-settings] Failed to write config: ' + e);
        }
    }


    _deleteConfigFile() {
        try {
            const file = Gio.File.new_for_path(this.customConfigPath);

            if (file.query_exists(null)) {
                file.delete(null);
            }
        } catch (e) {
            logError('[pipewire-settings] Failed to delete config: ' + e);
        }
    }


    _deleteLegacyConfig() {
        try {
            const oldCustomConfigPath = GLib.build_filenamev([
                GLib.get_user_config_dir(),
                'pipewire',
                "pwsettings-gnome-extension.conf"
            ]);
            const file = Gio.File.new_for_path(oldCustomConfigPath);

            if (file.query_exists(null)) {
                file.delete(null);
            }
        } catch (e) {
            logError('[pipewire-settings] Failed to delete legacy config: ' + e);
        }
    }
}

