export interface OTAConfig {
    apiUrl: string;
    appId: string;
    channel: string;
    checkOnLaunch?: boolean;
}

export interface UpdateCheckResponse {
    updateAvailable: boolean;
    bundleUrl?: string;
    hash?: string;
    signature?: string;
    mandatory?: boolean;
    version?: string;
}

export interface InstallationReport {
    status: 'applied' | 'failed' | 'rolled_back';
    releaseId: string;
}
