import { getWebGPUDevice, loadTexture, createOutputTexture, copyTextureToCanvas } from './imports'
import { createAdvancedCompositorPipeline, executeLayerBlend, createRulesBuffer, updateRulesBuffer, getBlendModeIndex } from './index'
import type { CompositorLayer } from './types'
import type { Ref } from './imports'

/**
 * 初始化资源: Device, Pipeline
 */
export async function initCompositorResources(): Promise<{
    device: GPUDevice;
    pipeline: GPUComputePipeline;
    rulesBuffer: GPUBuffer
}> {
    const device = await getWebGPUDevice()
    const pipeline = await createAdvancedCompositorPipeline(device)
    const rulesBuffer = createRulesBuffer(device)
    return { device, pipeline, rulesBuffer }
}

/**
 * 加载并缩放图片到指定尺寸
 */
export async function loadAndResizeImage(
    imageUrl: string,
    targetWidth?: number,
    targetHeight?: number
): Promise<{
    bitmap: ImageBitmap,
    width: number,
    height: number
}> {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    await img.decode()

    let finalWidth = targetWidth ?? img.width;
    let finalHeight = targetHeight ?? img.height;

    try {
        const bitmap = await createImageBitmap(img, {
            resizeWidth: finalWidth,
            resizeHeight: finalHeight,
            resizeQuality: 'high'
        });
        return { bitmap, width: finalWidth, height: finalHeight };
    } catch (e) {
        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas Context Failed');
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        const bitmap = await createImageBitmap(canvas);
        return { bitmap, width: finalWidth, height: finalHeight };
    }
}

/**
 * 将 ImageBitmap 转为 GPUTexture
 */
export function createTextureFromBitmap(device: GPUDevice, bitmap: ImageBitmap): GPUTexture {
    const texture = device.createTexture({
        size: [bitmap.width, bitmap.height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC
    });
    device.queue.copyExternalImageToTexture(
        { source: bitmap },
        { texture: texture },
        [bitmap.width, bitmap.height]
    );
    return texture;
}

/**
 * 运行多层合成器 (Ping-Pong)
 */
export async function runMultiLayerCompositor(
    ctx: {
        device: GPUDevice
        pipeline: GPUComputePipeline
        rulesBuffer: GPUBuffer
    },
    params: {
        baseTexture: GPUTexture,
        layers: CompositorLayer[],
        width: number,
        height: number
    },
    canvas?: HTMLCanvasElement
): Promise<void> {
    const { device, pipeline, rulesBuffer } = ctx;
    const { baseTexture, layers, width, height } = params;

    const textureDesc: GPUTextureDescriptor = {
        size: [width, height],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC
    };

    let accum = device.createTexture(textureDesc);
    let temp = device.createTexture(textureDesc);
    let originalBaseTexture = device.createTexture(textureDesc); // Store the initial base texture

    const commandEncoder = device.createCommandEncoder();
    commandEncoder.copyTextureToTexture(
        { texture: baseTexture },
        { texture: accum },
        [width, height]
    );
    commandEncoder.copyTextureToTexture(
        { texture: baseTexture },
        { texture: originalBaseTexture },
        [width, height]
    );
    device.queue.submit([commandEncoder.finish()]);

    for (const layer of layers) {
        if (!layer.visible || !layer.imageTexture) continue;

        updateRulesBuffer(device, rulesBuffer, layer.maskRules);

        executeLayerBlend({
            device,
            baseTexture: accum,
            layerTexture: layer.imageTexture,
            originalBaseTexture: params.baseTexture, // Pass original base
            outputTexture: temp,
            rulesBuffer: rulesBuffer,
            ruleCount: layer.maskRules.length,
            layerOpacity: layer.opacity,
            layerBlendMode: getBlendModeIndex(layer.blendMode),
            width, height,
            originalBaseTexture: originalBaseTexture // Pass the original base texture
        }, pipeline);

        const t = accum;
        accum = temp;
        temp = t;
    }

    if (canvas) {
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        await copyTextureToCanvas(device, accum, canvas);
    }

    accum.destroy();
    temp.destroy();
    originalBaseTexture.destroy();
}

/**
 * 创建并初始化新图层
 */
export async function createNewLayer(
    device: GPUDevice,
    url: string,
    layerCount: number,
    targetWidth: number,
    targetHeight: number
): Promise<CompositorLayer> {
    const newLayer: CompositorLayer = {
        id: generateId(),
        visible: true,
        name: `Layer ${layerCount + 1}`,
        imageSource: url,
        maskRules: [],
        blendMode: 'normal',
        opacity: 1.0,
        imageTexture: undefined
    };

    // Load and Resize
    const res = await loadAndResizeImage(url, targetWidth, targetHeight);
    newLayer.imageTexture = createTextureFromBitmap(device, res.bitmap);

    // Analyze Colors (Client-side)
    try {
        newLayer.layerPalette = await analyzeImageColors(url);
    } catch (e) {
        console.warn("Color analysis failed", e);
        newLayer.layerPalette = [];
    }

    return newLayer;
}

/**
 * 简单的 RGB -> HSL 转换
 */
function rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * 分析图像颜色，提取主色调 (简化版 K-Means)
 */
export async function analyzeImageColors(imageUrl: string, count: number = 6): Promise<{ h: number, s: number, l: number }[]> {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    await img.decode();

    // Downsample for speed
    const canvas = document.createElement('canvas');
    const w = 64, h = 64;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h).data;
    const pixels: number[][] = [];

    for (let i = 0; i < imageData.length; i += 4) {
        // Ignore transparent pixels
        if (imageData[i + 3] < 128) continue;
        pixels.push([imageData[i], imageData[i + 1], imageData[i + 2]]);
    }

    if (pixels.length === 0) return [];

    // Simple quantization: Use largest boxes or simple histogram?
    // Let's use simplified K-Means.

    // Initialize centroids randomly
    let centroids = [];
    for (let i = 0; i < count; i++) {
        centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
    }

    // Iterate (just a few times for speed)
    for (let iter = 0; iter < 5; iter++) {
        const clusters: number[][][] = Array(count).fill(0).map(() => []);

        // Assign pixels
        for (const p of pixels) {
            let minDist = Infinity;
            let clusterIdx = 0;
            for (let c = 0; c < count; c++) {
                const d = Math.sqrt(
                    Math.pow(p[0] - centroids[c][0], 2) +
                    Math.pow(p[1] - centroids[c][1], 2) +
                    Math.pow(p[2] - centroids[c][2], 2)
                );
                if (d < minDist) {
                    minDist = d;
                    clusterIdx = c;
                }
            }
            clusters[clusterIdx].push(p);
        }

        // Recalculate centroids
        for (let c = 0; c < count; c++) {
            if (clusters[c].length === 0) continue;
            let sumR = 0, sumG = 0, sumB = 0;
            for (const p of clusters[c]) {
                sumR += p[0]; sumG += p[1]; sumB += p[2];
            }
            centroids[c] = [
                sumR / clusters[c].length,
                sumG / clusters[c].length,
                sumB / clusters[c].length
            ];
        }
    }

    // Convert centroids to HSL
    const colors = centroids.map(c => rgbToHsl(c[0], c[1], c[2]));
    // Deduplicate similar colors
    const uniqueColors: { h: number, s: number, l: number }[] = [];
    for (const c of colors) {
        if (!uniqueColors.some(uc => Math.abs(uc.h - c.h) < 10 && Math.abs(uc.s - c.s) < 10 && Math.abs(uc.l - c.l) < 10)) {
            uniqueColors.push(c);
        }
    }

    return uniqueColors.sort((a, b) => b.s - a.s); // Sort by saturation (more interesting colors first)
}

export function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

export async function executeWithLoading(
    isProcessing: Ref<boolean>,
    error: Ref<string | null>,
    errorPrefix: string,
    operation: () => Promise<void>
): Promise<void> {
    try {
        isProcessing.value = true
        await operation()
    } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        error.value = `${errorPrefix}: ${errorMessage}`
        console.error(err)
    } finally {
        isProcessing.value = false
    }
}
