import { plainWeaveAdvancedShaderWGSL } from './plainWeaveAdvanced.code';
import { PlainWeaveAdvancedParams, PlainWeaveAdvancedResources } from "./plainWeaveAdvanced.types";

function hexToRgb(hex: string): [number, number, number, number] {
    const red = parseInt(hex.slice(1, 3), 16) / 255;
    const green = parseInt(hex.slice(3, 5), 16) / 255;
    const blue = parseInt(hex.slice(5, 7), 16) / 255;
    return [red, green, blue, 1.0];
}

export function createPlainWeaveAdvancedUniformBuffer(device: GPUDevice, params: PlainWeaveAdvancedParams): GPUBuffer {
    // 64 floats (256 bytes) to be safe and aligned
    const uniformData = new Float32Array(64);

    // Matrix (0-15)
    uniformData[0] = 1; uniformData[5] = 1; uniformData[10] = 1; uniformData[15] = 1;

    // Params
    uniformData[16] = params.tileSize;
    uniformData[17] = params.warpDensity;
    uniformData[18] = params.weftDensity;

    uniformData[19] = params.threadThickness;
    uniformData[20] = params.threadTwist;
    uniformData[21] = params.fiberDetail;
    uniformData[22] = params.fuzziness;

    uniformData[23] = params.weaveTightness;
    uniformData[24] = params.threadUnevenness;
    uniformData[25] = params.weaveImperfection;

    // Padding/Spacer to align vec4?
    // WGSL layout:
    // ...
    // weaveImperfection : f32
    // padding1 : f32
    // padding2 : f32 (Wait, check struct alignment)

    // Struct in shader:
    // ...
    // weaveImperfection : f32 (offset 25 * 4 = 100)

    // warpColor : vec4<f32>; (Must be 16-byte aligned)
    // 100 is not divisible by 16. Next 16-byte boundary is 112 (28 * 4).
    // So we need padding at 26, 27.

    // In Shader Struct:
    // weaveImperfection : f32; // Offset 100
    // padding1 : f32;          // Offset 104 (26)
    // padding2 : f32;          // Offset 108 (27)
    // warpColor : vec4<f32>;   // Offset 112 (28) -> 128

    // So:
    uniformData[26] = 0; // padding1
    uniformData[27] = 0; // padding2 (Wait, I put them at end of shader struct? No, I need them BEFORE vec4)

    // Let's re-check the Shader Struct I wrote:
    /*
    padding1 : f32, // I put it at END of struct in shader code...
    padding2: f32,
    */

    // Wait, let's look at the shader I WROTE in Step 60.
    /*
    struct Uniforms {
        ...
        weaveImperfection : f32,
        
        warpColor : vec4<f32>, <--- This will force alignment!
        weftColor : vec4<f32>,
        ...
    */

    // Detailed layout:
    // 0-15: mat4 (64 bytes)
    // 16: tileSize
    // 17: warpDensity
    // 18: weftDensity
    // 19: threadThickness
    // 20: threadTwist
    // 21: fiberDetail
    // 22: fuzziness
    // 23: weaveTightness
    // 24: threadUnevenness
    // 25: weaveImperfection (100 bytes so far)

    // warpColor (vec4) requires 16-byte alignment.
    // Current offset 104 (after weaveImperfection). 104 is NOT divisible by 16 (104/16 = 6.5).
    // Next aligned offset is 112 (7 * 16).
    // So there is implicit padding of 8 bytes (2 floats) between weaveImperfection and warpColor.

    const warpColor = hexToRgb(params.warpColor);
    uniformData[28] = warpColor[0];
    uniformData[29] = warpColor[1];
    uniformData[30] = warpColor[2];
    uniformData[31] = warpColor[3];

    const weftColor = hexToRgb(params.weftColor);
    uniformData[32] = weftColor[0];
    uniformData[33] = weftColor[1];
    uniformData[34] = weftColor[2];
    uniformData[35] = weftColor[3];

    // Next: fbmOctaves (f32) - Offset 144 (36 * 4) -> Aligned.
    uniformData[36] = params.fbmOctaves;
    uniformData[37] = params.fbmAmplitude;
    uniformData[38] = params.noiseFrequency;
    uniformData[39] = params.colorVariation;

    uniformData[40] = params.warpSheen;
    uniformData[41] = params.weftSheen;
    uniformData[42] = params.roughnessMin;
    uniformData[43] = params.roughnessMax;
    uniformData[44] = params.normalStrength;

    uniformData[45] = params.threadHeightScale;
    uniformData[46] = params.threadShadowStrength;

    const uniformBuffer = device.createBuffer({
        size: uniformData.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    return uniformBuffer;
}

export function createPlainWeaveAdvancedPipeline(device: GPUDevice): GPURenderPipeline {
    const module = device.createShaderModule({
        code: plainWeaveAdvancedShaderWGSL,
    });

    return device.createRenderPipeline({
        layout: 'auto',
        vertex: {
            module,
            entryPoint: 'vs_main',
            buffers: [
                {
                    arrayStride: 20,
                    attributes: [
                        { shaderLocation: 0, offset: 0, format: 'float32x3' },
                        { shaderLocation: 1, offset: 12, format: 'float32x2' },
                    ],
                },
            ],
        },
        fragment: {
            module,
            entryPoint: 'fs_main',
            targets: [{ format: 'bgra8unorm' }],
        },
        primitive: {
            topology: 'triangle-list',
        },
    });
}

export function createPlainWeaveAdvancedResources(device: GPUDevice, params: PlainWeaveAdvancedParams): PlainWeaveAdvancedResources {
    const uniformBuffer = createPlainWeaveAdvancedUniformBuffer(device, params);

    // Create a dummy sampler just in case, though we removed texture bindings?
    // Wait, my shader removed bindings 1 and 2 (texture and sampler).
    // "@group(0) @binding(0) var<uniform> u : Uniforms;"
    // So bind group only needs binding 0.

    const pipeline = createPlainWeaveAdvancedPipeline(device);

    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
        ],
    });

    return { pipeline, bindGroup };
}
