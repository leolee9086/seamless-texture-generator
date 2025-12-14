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
    'replace': 0 // fallback or special case? In multi-pass, replace is just normal blend with high opacity?
    // Or we can treat 'replace' as a mode where we ignore base? 
    // Whatever our shader implements. Our shader treats 0 as normal/replace based on simplified blend.
};

// Shader uses: 0=normal, 1=add, 2=multiply, 3=screen, 4=overlay, 5=max, 6=min
// We need to map correctly. 
// Note: 'replace' in standard composition usually means "Source Over" without blending? Or "Copy"?
// If we want "Replace" (dst = src), we can use Normal with 100% opacity usually.
// Let's assume our shader 'Normal' is mix(base, layer, alpha).
// If alpha is 1, it replaces base.

/**
 * 将 HSLRule 数据打包到 Float32Array
 */
function packRulesData(rules: HSLRule[]): Float32Array {
    const count = Math.min(rules.length, MAX_RULES_PER_LAYER);
    // HSL_RULE_STRUCT_SIZE = 32 bytes = 8 floats
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
        // bufferData[offset + 7] is invert (float)
        bufferData[offset + 7] = rule.invert ? 1.0 : 0.0;
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
        width, height
    } = params;

    // 1. 更新 Layer Params Uniform Buffer
    // struct LayerParams { ruleCount, opacity, blendMode, padding }
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
    // @group(0) @binding(0) var baseTexture
    // @group(0) @binding(1) var layerTexture
    // @group(0) @binding(2) var dstTexture
    // @group(0) @binding(3) var rules
    // @group(0) @binding(4) var params
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: baseTexture.createView() },
            { binding: 1, resource: layerTexture.createView() },
            { binding: 2, resource: outputTexture.createView() },
            { binding: 3, resource: { buffer: rulesBuffer } },
            { binding: 4, resource: { buffer: uniformBuffer } }
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
