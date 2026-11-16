export function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
    if (bytes >= 1024 * 1024) return `${Number((bytes / (1024 * 1024)).toFixed(1))} MB`;
    if (bytes >= 1024) return `${Number((bytes / 1024).toFixed(1))} KB`;
    return `${Math.round(bytes)} B`;
}

export function formatByteProgress(loaded: number, total: number): string {
    const unit = total >= 1024 * 1024 ? 1024 * 1024 : total >= 1024 ? 1024 : 1;
    return `${Number((loaded / unit).toFixed(1))} of ${formatBytes(total)}`;
}
