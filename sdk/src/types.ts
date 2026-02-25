export interface OTAConfig {
    apiUrl: string;
    appId: string;
    channel: string;
    checkOnLaunch?: boolean;
    encryptionKey?: string;
    signingKey?: string;
}

export interface UpdateCheckResponse {
    updateAvailable: boolean;
    bundleUrl?: string;
    hash?: string;
    signature?: string;
    mandatory?: boolean;
    version?: string;
    isEncrypted?: boolean;
    encryptionKeyId?: string;
    isPatch?: boolean;
    patchUrl?: string;
    baseVersion?: string;
    releaseNotes?: string;
    rolloutPercentage?: number;
    size?: number;
}

export interface InstallationReport {
    status: 'applied' | 'failed' | 'rolled_back';
    releaseId: string;
}
