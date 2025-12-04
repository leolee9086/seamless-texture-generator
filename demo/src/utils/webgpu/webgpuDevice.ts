
let cachedDevice: GPUDevice | null = null;

export async function getWebGPUDevice(): Promise<GPUDevice> {
    if (cachedDevice) return cachedDevice;

    if (!navigator.gpu) {
        throw new Error('WebGPU is not supported on this browser.');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error('No appropriate GPUAdapter found.');
    }

    cachedDevice = await adapter.requestDevice();

    // Handle device loss
    cachedDevice.lost.then((info) => {
        console.error(`WebGPU device was lost: ${info.message}`);
        cachedDevice = null;
    });

    return cachedDevice;
}
