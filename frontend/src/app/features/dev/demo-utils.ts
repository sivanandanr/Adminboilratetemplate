/** Development-only cancellable mock operation. No production delay or progress simulation. */
export function abortableDemoDelay(ms: number, signal: AbortSignal): Promise<void> { return new Promise((resolve, reject) => { if (signal.aborted) {
    reject(new Error('Cancelled'));
    return;
} const abort = () => { clearTimeout(timer); reject(new Error('Cancelled')); }; const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, ms); signal.addEventListener('abort', abort, { once: true }); }); }
