import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';

import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {PipewireConfig} from './pwconfig.js';



export const PipewireTopBarMenu = GObject.registerClass(
class PipewireTopBarMenu extends PanelMenu.Button {
    _init(extensionPath) {
        super._init(0.5, _('Pipewire settings menu'));

        this.path = extensionPath;
        this._addIcon();

        // pipewire config from command line
        this.config = new PipewireConfig();

        // Samplerate submenu
        this.sampleRateItem = new PopupMenu.PopupSubMenuMenuItem('Samplerate');
        this.menu.addMenuItem(this.sampleRateItem);
        this._populateSamplerates();

        // separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Buffer size submenu
        this.bufferSizeItem = new PopupMenu.PopupSubMenuMenuItem('Buffer size');
        this.menu.addMenuItem(this.bufferSizeItem);
        this._populateBuffers();

        // separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Restore defaults button
        this.restoreItem = new PopupMenu.PopupMenuItem('Restore defaults');
        this.restoreItem.connect('activate', () => {this._restoreDefaults();});
        this.menu.addMenuItem(this.restoreItem);

        // update samplerates and buffer sizes when the menu opens
        // workaround to avoid segmentation faults when using _resetActions
        this.menu.connect('open-state-changed', (menu, open) => { if (open) this._updateMenu(); });
    }


    // custom icon to click in top bar
    _addIcon() {
        const iconPath = `${this.path}/icons/pipewire-condensed-symbolic.svg`;
        let icon = new St.Icon({
            gicon: Gio.icon_new_for_string(iconPath),
            style_class: 'system-status-icon',
            icon_size: 16
        });
        this.add_child(icon);
    }


    _resetActions() {
        this.sampleRateItem.menu.removeAll();
        this.bufferSizeItem.menu.removeAll();
        this._populateSamplerates();
        this._populateBuffers();
    }


    _restoreDefaults() {
        this.config.setSampleRate(0);
        this.config.setBufferSize(0);
    }


    _getSampleRateIcon(forceRate) {
        let ok = 'check-plain-symbolic';
        let nope = 'goa-account-symbolic'; // goa is an empty icon -> probably a hack?

        if (!this.config.isForceSampleRate())
            if (forceRate === '0') return ok;
            else return nope;

        if (forceRate === this.config.sampleRate) return ok;
        else return nope;
    }


    _populateSamplerates() {
        this.config.allowedForceRates().forEach(rate => {
            let display = rate === '0' ? 'Dynamic (default)' : rate + ' Hz';
            this.sampleRateItem.menu.addAction(display, () => {
                this.config.setSampleRate(parseInt(rate));
            }, this._getSampleRateIcon(rate))
        });
    }


    _getBufferSizeIcon(forceSize) {
        let ok = 'check-plain-symbolic';
        let nope = 'goa-account-symbolic'; // goa is an empty icon -> probably a hack?

        if (!this.config.isForceQuantum())
            if (forceSize === '0') return ok;
            else return nope;

        if (forceSize === this.config.bufferSize) return ok;
        else return nope;
    }


    _populateBuffers() {
        this.config.allowedForceQuantums().forEach(size => {
            let display = size === '0' ? 'Dynamic (default)' : size;
            this.bufferSizeItem.menu.addAction(display, () => {
                this.config.setBufferSize(parseInt(size));
            }, this._getBufferSizeIcon(size))
        });
    }


    _updateMenu() {
        this.config.update();

        let suffix = this.config.isForceSampleRate() ? '' : ' (dyn)';
        this.sampleRateItem.label.text = `Samplerate：${this.config.sampleRate} Hz` + suffix;

        suffix = this.config.isForceQuantum() ? '' : ' (dyn)';
        this.bufferSizeItem.label.text = `Buffer size：${this.config.bufferSize}` + suffix;

        // only make restore button clickable when not in default settings
        this.restoreItem.reactive = this.config.isForceSampleRate() || this.config.isForceQuantum();

        this._resetActions();
    }
});

