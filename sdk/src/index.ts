import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import type { OTAConfig, UpdateCheckResponse } from './types';

const { HotPatchSDK } = NativeModules;
if (!HotPatchSDK) {
    console.warn('HotPatch SDK native module not found. OTA updates will be disabled.');
}

class OTAClient {
    private config: OTAConfig | null = null;

    configure(config: OTAConfig) {
        this.config = config;
        if (HotPatchSDK) {
            HotPatchSDK.setup(
                config.apiUrl,
                config.appId,
                config.channel,
                config.encryptionKey || null,
                config.signingKey || null
            );
            if (config.checkOnLaunch) {
                this.checkForUpdate();
            }
        }
    }

    async checkForUpdate(): Promise<UpdateCheckResponse | null> {
        if (!this.config || !HotPatchSDK) return null;
        try {
            const update = await HotPatchSDK.checkForUpdate();
            return update;
        } catch (e) {
            console.error('[HotPatch] Update check failed:', e);
            return null;
        }
    }

    async applyUpdate(update: UpdateCheckResponse): Promise<void> {
        if (!HotPatchSDK) return;
        try {
            await HotPatchSDK.applyUpdate(update);
        } catch (e) {
            console.error('[HotPatch] Failed to apply update:', e);
        }
    }


    async getVersion(): Promise<string> {
        if (!HotPatchSDK) return '0.0.0';
        return await HotPatchSDK.getCurrentVersion();
    }

    async markSuccess(): Promise<void> {
        if (HotPatchSDK) {
            await HotPatchSDK.markSuccess();
        }
    }
}

const client = new OTAClient();
export default client;
export * from './types';
