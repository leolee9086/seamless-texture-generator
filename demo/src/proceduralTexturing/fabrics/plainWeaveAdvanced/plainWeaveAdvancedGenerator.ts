import type { PlainWeaveAdvancedParams } from "./plainWeaveAdvanced.types";
import {
    createPlainWeaveAdvancedResources
} from "./plainWeaveAdvanced.utils";

import {
    getWebGPUDevice,
    createFullscreenQuadBuffer,
    runPlainWeaveRenderPass,
    convertTextureToBase64,
    RenderPlainWeaveParams
} from "./imports";

export const defaultPlainWeaveAdvancedParams: PlainWeaveAdvancedParams = {
    tileSize: 1.0,

    // 独立的密度控制
    warpDensity: 20.0,
    weftDensity: 20.0,

    // 纱线物理属性
    threadThickness: 0.45,
    threadTwist: 0.5,
    fiberDetail: 0.3,
    fuzziness: 0.2,

    // 织造特征
    weaveTightness: 0.7,
    threadUnevenness: 0.15,
    weaveImperfection: 0.1,

    // 独立的颜色控制
    warpColor: '#D4C8B8', // 经线颜色
    weftColor: '#F0E8DC', // 纬线颜色

    // 高级噪声控制
    fbmOctaves: 3,
    fbmAmplitude: 0.3,
    noiseFrequency: 2.0,
    colorVariation: 0.05,

    // 材质属性
    warpSheen: 0.3,
    weftSheen: 0.25,
    roughnessMin: 0.4,
    roughnessMax: 0.8,
    normalStrength: 5.0,

    // 几何属性
    threadHeightScale: 1.0,
    threadShadowStrength: 0.3,
}

export async function generatePlainWeaveAdvancedTexture(params: PlainWeaveAdvancedParams, width: number, height: number): Promise<string> {
    const device = await getWebGPUDevice()
    if (!device) {
        throw new Error('WebGPU not supported')
    }

    // 1. Create Texture
    const texture = device.createTexture({
        size: [width, height],
        format: 'bgra8unorm',
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
    })

    const { pipeline, bindGroup } = createPlainWeaveAdvancedResources(device, params);
    const vertexBuffer = createFullscreenQuadBuffer(device);

    // Cast params to satisfy the generic signature if needed, or rely on structural compatibility
    // RenderPlainWeaveParams expects { texture, pipeline, bindGroup, vertexBuffer }
    const renderParams: RenderPlainWeaveParams = { texture, pipeline, bindGroup, vertexBuffer };
    runPlainWeaveRenderPass(device, renderParams);

    return await convertTextureToBase64({ device, texture, width, height });
}
