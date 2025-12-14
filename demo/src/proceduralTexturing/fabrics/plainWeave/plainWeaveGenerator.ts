import { getWebGPUDevice } from '../../../utils/webgpu/deviceCache/webgpuDevice'

import type { PlainWeaveParams } from "./plainWeave.types";
import {
    createPlainWeaveResources,
    createFullscreenQuadBuffer,
    runPlainWeaveRenderPass,
    convertTextureToBase64
} from "./plainWeave.utils";

export const defaultPlainWeaveParams: PlainWeaveParams = {
    tileSize: 1.0,
    threadDensity: 20.0,        // 每单位长度20根纱线
    threadThickness: 0.45,      // 中等粗细
    warpWeftRatio: 1.0,         // 经纬线密度相等

    // 纱线结构
    threadTwist: 0.5,           // 中等捻度
    fiberDetail: 0.3,           // 适度的纤维细节
    fuzziness: 0.2,             // 少量毛绒

    // 织造特征
    weaveTightness: 0.7,        // 较紧密的织造
    threadUnevenness: 0.15,     // 轻微的不均匀
    weaveImperfection: 0.1,     // 轻微的不完美

    // 颜色渐变 - 默认为浅米色织物
    gradientStops: [
        { offset: 0.0, color: '#D4C8B8' }, // 较暗的纱线部分
        { offset: 1.0, color: '#F0E8DC' }  // 较亮的纱线部分
    ],

    // 高级参数默认值
    fbmOctaves: 3,
    fbmAmplitude: 0.3,
    noiseFrequency: 2.0,
    colorVariation: 0.05,

    // 光泽和材质
    warpSheen: 0.3,             // 经线有一定光泽
    weftSheen: 0.25,            // 纬线光泽稍弱
    roughnessMin: 0.4,
    roughnessMax: 0.8,
    normalStrength: 5.0,

    // 纱线厚度调节
    threadHeightScale: 1.0,
    threadShadowStrength: 0.3,
}



export async function generatePlainWeaveTexture(params: PlainWeaveParams, width: number, height: number): Promise<string> {
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

    const { pipeline, bindGroup } = createPlainWeaveResources(device, params);
    const vertexBuffer = createFullscreenQuadBuffer(device);

    runPlainWeaveRenderPass(device, { texture, pipeline, bindGroup, vertexBuffer });

    return await convertTextureToBase64({ device, texture, width, height });
}
