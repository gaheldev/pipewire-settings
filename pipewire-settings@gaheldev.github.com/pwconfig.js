import {runCommand} from './utils.js';
import Gio from 'gi://Gio';



export class PipewireConfig {
    constructor() {
        this.update();
    }


    update() {
        this.config = this._getConfig();
        this.defaultRate = this._parseDefaultRate();
        this.forceRate = this._parseForceRate();
        this.defaultQuantum = this._parseDefaultQuantum();;
        this.forceQuantum = this._parseForceQuantum();
        this.sampleRate = this.forceRate === '0' ? this.defaultRate : this.forceRate;
        this.bufferSize = this.forceQuantum === '0' ? this.defaultQuantum : this.forceQuantum;
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


    setSampleRate(rate) {
        try {
            // TODO: use runCommand instead
            const proc = Gio.Subprocess.new(
                ['pw-metadata', '-n', 'settings', '0', 'clock.force-rate', `${rate}`],
                Gio.SubprocessFlags.NONE
            );
        } catch (e) {
            logError(e);
        }
    }


    setBufferSize(size) {
        try {
            // TODO: use runCommand instead
            const proc = Gio.Subprocess.new(
                ['pw-metadata', '-n', 'settings', '0', 'clock.force-quantum', `${size}`],
                Gio.SubprocessFlags.NONE
            );
        } catch (e) {
            logError(e);
        }
    }


    _getConfig() {
        return runCommand('pw-metadata', ['-n', 'settings', '0']);
    }


    _parseDefaultRate() {
        const rateMatch = this.config.match(/clock\.rate\'\s*value:\'(\d+)/);
        if (rateMatch !== null)
            return rateMatch[1];
        else {
            logError("Couldn't get pipewire's default rate");
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
            logError("Couldn't get pipewire's default quantum");
            return null;
        }
    }


    _parseForceQuantum() {
        const forceQuantumMatch = this.config.match(/clock\.force-quantum\'\s*value:\'(\d+)/);
        const forceQuantum = forceQuantumMatch===null ? '0' : forceQuantumMatch[1];
        return forceQuantum;
    }
}

