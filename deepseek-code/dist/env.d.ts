export interface EnvironmentInfo {
    isTermux: boolean;
    termuxPrefix: string;
    terminalWidth: number;
    hasStorageAccess: boolean;
    packageManager: string;
}
export declare function detectEnvironment(): EnvironmentInfo;
export declare function isExternalStoragePath(filePath: string): boolean;
export declare function getTermuxStorageHint(): string;
export declare function getRecommendedInstallCommand(packageName: string): string;
export declare function clearEnvCache(): void;
//# sourceMappingURL=env.d.ts.map