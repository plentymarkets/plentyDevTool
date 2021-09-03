export interface CommitResult {
    plugin_compile: Array<string>;
}

export interface CommitResponse {
    executedBuilds: Array<number>;
    successful: boolean;
    result: Array<CommitResult>;
}
