import { ref, onUnmounted, shallowRef } from './imports'
import { ADVANCED_COMPOSITOR_CONSTANTS } from './useAdvancedCompositor.constants'
import { initCompositorResources, loadAndResizeImage, createTextureFromBitmap, runMultiLayerCompositor, generateId, executeWithLoading } from './useAdvancedCompositor.utils'
import type { CompositorLayer, HSLRule, AdvancedCompositorParams } from './types'

export function useAdvancedCompositor(): {
    init: () => Promise<void>;

    // State
    baseImage: import("vue").Ref<string | null>;
    basePalette: import("vue").Ref<{ h: number, s: number, l: number }[]>;
    layers: import("vue").Ref<CompositorLayer[]>;
    isProcessing: import("vue").Ref<boolean>;
    error: import("vue").Ref<string | null>;

    // Actions
    setBaseImage: (url: string) => Promise<void>;
    addLayer: (url: string) => Promise<void>;
    removeLayer: (id: string) => void;
    replaceLayerImage: (layerId: string, url: string) => Promise<void>;
    duplicateLayer: (layerId: string) => Promise<void>; // New Action
    moveLayer: (layerId: string, direction: 'up' | 'down') => void; // New Action
    updateLayerRule: (layerId: string, rule: HSLRule) => void; // Add/Update rule
    removeLayerRule: (layerId: string, ruleId: string) => void;

    forceUpdate: (canvas?: HTMLCanvasElement) => Promise<void>;
} {
    // GPU Resources
    const device = shallowRef<GPUDevice | null>(null)
    const pipeline = shallowRef<GPUComputePipeline | null>(null)
    const rulesBuffer = shallowRef<GPUBuffer | null>(null)

    // Textures
    const baseTexture = shallowRef<GPUTexture | null>(null)

    // State
    const baseImage = ref<string | null>(null)
    const basePalette = ref<{ h: number, s: number, l: number }[]>([])
    const layers = ref<CompositorLayer[]>([])
    const isProcessing = ref(false)
    const error = ref<string | null>(null)

    const outputSize = ref({ width: 1024, height: 1024 })

    const init = async () => {
        if (device.value) return;
        try {
            const res = await initCompositorResources()
            device.value = res.device
            pipeline.value = res.pipeline
            rulesBuffer.value = res.rulesBuffer
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e)
            error.value = `${ADVANCED_COMPOSITOR_CONSTANTS.ERRORS.WEBGPU_INIT_FAILED}: ${msg}`
            console.error(e)
        }
    }

    // 设置底图 (Base Layer)
    const setBaseImage = async (url: string) => {
        await init();
        if (!device.value) return;

        await executeWithLoading(isProcessing, error, 'Set Base Image Failed', async () => {
            // Load Base Image (determine size)
            const res = await loadAndResizeImage(url); // use original size
            outputSize.value = { width: res.width, height: res.height };
            baseImage.value = url;

            // Analyze Colors (Client-side)
            try {
                // Dynamically import and call analyzeImageColors
                basePalette.value = await import('./useAdvancedCompositor.utils').then(m => m.analyzeImageColors(url));
            } catch (e) {
                console.warn("Base color analysis failed", e);
                basePalette.value = [];
            }

            // Create Base Texture
            if (baseTexture.value) baseTexture.value.destroy();
            baseTexture.value = createTextureFromBitmap(device.value!, res.bitmap);

            // Re-process all existing layers to match new size?
            // Yes, need to resize all layers if base size changes.
            // For simplicity, we might assume layers are re-uploaded or we blindly stretch stored textures?
            // Stored textures are fixed size. We need to reload from source?
            // To support resizing, we need to keep source URL in layer.
            for (const layer of layers.value) {
                if (layer.imageSource) {
                    await reloadLayerTexture(layer);
                }
            }
        });
    }

    const reloadLayerTexture = async (layer: CompositorLayer) => {
        if (!device.value || !layer.imageSource) return;
        const res = await loadAndResizeImage(layer.imageSource, outputSize.value.width, outputSize.value.height);
        if (layer.imageTexture) layer.imageTexture.destroy();
        layer.imageTexture = createTextureFromBitmap(device.value!, res.bitmap);
    }

    const addLayer = async (url: string) => {
        await init();
        if (!device.value) return;

        await executeWithLoading(isProcessing, error, 'Add Layer Failed', async () => {
            if (!baseImage.value) {
                throw new Error("Please set Base Image first");
            }

            const newLayer = await import('./useAdvancedCompositor.utils').then(m => m.createNewLayer(
                device.value!,
                url,
                layers.value.length,
                outputSize.value.width,
                outputSize.value.height
            ));

            layers.value.push(newLayer);
        });
    }

    const removeLayer = (id: string) => {
        const index = layers.value.findIndex(l => l.id === id);
        if (index > -1) {
            const layer = layers.value[index];
            if (layer.imageTexture) layer.imageTexture.destroy();
            layers.value.splice(index, 1);
        }
    }

    // Rules Management
    const updateLayerRule = (layerId: string, rule: HSLRule) => {
        const layer = layers.value.find(l => l.id === layerId);
        if (layer) {
            const idx = layer.maskRules.findIndex(r => r.id === rule.id);
            if (idx > -1) {
                layer.maskRules[idx] = rule;
            } else {
                layer.maskRules.push(rule);
            }
        }
    }

    const removeLayerRule = (layerId: string, ruleId: string) => {
        const layer = layers.value.find(l => l.id === layerId);
        if (layer) {
            const idx = layer.maskRules.findIndex(r => r.id === ruleId);
            if (idx > -1) layer.maskRules.splice(idx, 1);
        }
    }

    const replaceLayerImage = async (layerId: string, url: string) => {
        await init();
        if (!device.value) return;

        await executeWithLoading(isProcessing, error, 'Replace Layer Image Failed', async () => {
            const layer = layers.value.find(l => l.id === layerId);
            if (!layer) return;

            // Update Source
            layer.imageSource = url;

            // Reload Texture
            const res = await loadAndResizeImage(url, outputSize.value.width, outputSize.value.height);
            if (layer.imageTexture) layer.imageTexture.destroy();
            layer.imageTexture = createTextureFromBitmap(device.value!, res.bitmap);

            // Re-analyze Colors
            try {
                layer.layerPalette = await import('./useAdvancedCompositor.utils').then(m => m.analyzeImageColors(url));
            } catch (e) {
                console.warn("Color analysis failed during replacement", e);
            }
        });
    }

    const moveLayer = (layerId: string, direction: 'up' | 'down') => {
        const index = layers.value.findIndex(l => l.id === layerId);
        if (index === -1) return;

        if (direction === 'up') {
            if (index > 0) {
                // Swap with previous
                const temp = layers.value[index];
                layers.value[index] = layers.value[index - 1];
                layers.value[index - 1] = temp;
            }
        } else {
            if (index < layers.value.length - 1) {
                // Swap with next
                const temp = layers.value[index];
                layers.value[index] = layers.value[index + 1];
                layers.value[index + 1] = temp;
            }
        }
    }

    const duplicateLayer = async (layerId: string) => {
        if (!device.value) return;

        await executeWithLoading(isProcessing, error, 'Duplicate Layer Failed', async () => {
            const originalLayer = layers.value.find(l => l.id === layerId);
            if (!originalLayer) return;

            // Deep copy layer properties (except texture)
            const newLayer: CompositorLayer = {
                ...originalLayer,
                id: generateId(),
                imageTexture: null, // Will be created
                // Deep copy mask rules to ensure new IDs
                maskRules: originalLayer.maskRules.map(rule => ({ ...rule, id: generateId() }))
            };

            // Clone texture (re-create from source to ensure independent lifecycle)
            if (originalLayer.imageSource) {
                const res = await loadAndResizeImage(originalLayer.imageSource, outputSize.value.width, outputSize.value.height);
                newLayer.imageTexture = createTextureFromBitmap(device.value!, res.bitmap);
            }

            // Insert after original
            const index = layers.value.findIndex(l => l.id === layerId);
            layers.value.splice(index + 1, 0, newLayer);
        });
    }

    // Render Loop
    const forceUpdate = async (canvas?: HTMLCanvasElement) => {
        if (!device.value || !pipeline.value || !rulesBuffer.value || !baseTexture.value) return;
        if (isProcessing.value) return;

        await executeWithLoading(isProcessing, error, 'Render Failed', async () => {
            await runMultiLayerCompositor(
                { device: device.value!, pipeline: pipeline.value!, rulesBuffer: rulesBuffer.value! },
                {
                    baseTexture: baseTexture.value!,
                    layers: layers.value,
                    width: outputSize.value.width,
                    height: outputSize.value.height
                },
                canvas
            );
        });
    }

    onUnmounted(() => {
        baseTexture.value?.destroy();
        rulesBuffer.value?.destroy();
        layers.value.forEach(l => l.imageTexture?.destroy());
    });

    return {
        init,
        baseImage, basePalette, layers, isProcessing, error,
        setBaseImage, addLayer, removeLayer,
        replaceLayerImage,
        duplicateLayer,
        moveLayer,
        updateLayerRule,
        removeLayerRule,
        forceUpdate
    }
}
