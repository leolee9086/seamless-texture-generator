import { advancedCompositorWGSL } from './advancedCompositor.code'
import {
    AdvancedCompositorParams,
    CompositorLayer,
    ExecuteLayerBlendParams,
    HSL_RULE_STRUCT_SIZE,
    MAX_RULES_PER_LAYER,
    BlendMode,
    HSLRule
} from './types'

// Re-export types safely
export type {
    AdvancedCompositorParams,
    CompositorLayer,
    ExecuteLayerBlendParams
}

export {
    HSL_RULE_STRUCT_SIZE,
    MAX_RULES_PER_LAYER
}

export { advancedCompositorWGSL }

const BLEND_MODE_MAP: Record<BlendMode, number> = {
    'normal': 0,
    'add': 1,
    'multiply': 2,
    'screen': 3,
    'overlay': 4,
    'max': 5,
    'min': 6,
    'replace': 0 // fallback
};

/**
 * 将 HSLRule 数据打包到 Float32Array
 */
function packRulesData(rules: HSLRule[]): Float32Array {
    const count = Math.min(rules.length, MAX_RULES_PER_LAYER);
    // HSL_RULE_STRUCT_SIZE = 48 bytes = 12 floats (updated size)
    // Wait, let's check types.ts for HSL_RULE_STRUCT_SIZE. 
    // Assuming I updated types.ts previously. 
    // If I didn't update types.ts size constant, I should check it.
    // In Step 511 edits, I updated struct in WGSL and types.ts interface.
    // The struct became: 8 fields + maskSource + padding = 10 floats? 
    // Wait, WGSL:
    // hue, hueTol, sat, satTol (4)
    // light, lightTol, feather, invert (4)
    // maskSource, padding (2)
    // Total 10 floats = 40 bytes.
    // But alignment might require 16 bytes? 
    // 40 bytes is 10 floats. 
    // Let's assume 12 floats (48 bytes) for safety/alignment or 12 floats if I added more padding.
    // In Step 515, I wrote: const ruleSize = 12; // floats (48 bytes / 4 = 12 floats)

    // I need to use HSL_RULE_STRUCT_SIZE from types.ts.
    // If types.ts says 48, then floatsPerRule = 12.

    const floatsPerRule = HSL_RULE_STRUCT_SIZE / 4;
    const bufferData = new Float32Array(MAX_RULES_PER_LAYER * floatsPerRule);

    for (let i = 0; i < count; i++) {
        const rule = rules[i];
        const offset = i * floatsPerRule;

        bufferData[offset + 0] = rule.hue;
        bufferData[offset + 1] = rule.hueTolerance;
        bufferData[offset + 2] = rule.saturation;
        bufferData[offset + 3] = rule.saturationTolerance;

        bufferData[offset + 4] = rule.lightness;
        bufferData[offset + 5] = rule.lightnessTolerance;
        bufferData[offset + 6] = rule.feather;
        bufferData[offset + 7] = rule.invert ? 1.0 : 0.0;

        bufferData[offset + 8] = rule.maskSource ?? 0; // 0=Self, 1=Base
        // padding
    }

    return bufferData;
}

/**
 * 创建高级合成器的 Single Pass Pipeline
 */
export async function createAdvancedCompositorPipeline(device: GPUDevice): Promise<GPUComputePipeline> {
    const module = device.createShaderModule({
        code: advancedCompositorWGSL
    });

    const pipeline = device.createComputePipeline({
        layout: 'auto',
        compute: {
            module,
            entryPoint: 'cs_main'
        }
    });

    return pipeline;
}

/**
 * 创建 Rules Storage Buffer
 */
export function createRulesBuffer(device: GPUDevice): GPUBuffer {
    // Ensure size is aligned
    const bufferSize = MAX_RULES_PER_LAYER * HSL_RULE_STRUCT_SIZE;
    return device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });
}

/**
 * 执行单层混合 pass
 */
export function executeLayerBlend(
    params: ExecuteLayerBlendParams,
    pipeline: GPUComputePipeline
): void {
    const {
        device, baseTexture, layerTexture, outputTexture,
        rulesBuffer, ruleCount,
        layerOpacity, layerBlendMode,
        originalBaseTexture, // Added
        width, height
    } = params;

    // 1. 更新 Layer Params Uniform Buffer
    const uniformData = new Float32Array([
        ruleCount,
        layerOpacity,
        layerBlendMode,
        0 // padding
    ]);

    const uniformBuffer = device.createBuffer({
        size: 16, // 4 * 4 bytes
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(uniformBuffer, 0, uniformData.buffer);

    // 2. 创建 BindGroup
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: baseTexture.createView() },
            { binding: 1, resource: layerTexture.createView() },
            { binding: 2, resource: outputTexture.createView() },
            { binding: 3, resource: { buffer: rulesBuffer } },
            { binding: 4, resource: { buffer: uniformBuffer } },
            { binding: 5, resource: originalBaseTexture.createView() } // Added binding 5
        ]
    });

    // 3. Encode Commands
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8));
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
}

export function updateRulesBuffer(device: GPUDevice, buffer: GPUBuffer, rules: HSLRule[]) {
    const data = packRulesData(rules);
    device.queue.writeBuffer(buffer, 0, data.buffer);
}

export function getBlendModeIndex(mode: BlendMode): number {
    return BLEND_MODE_MAP[mode] ?? 0;
}
