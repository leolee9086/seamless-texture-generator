import {
    baseNoiseFieldWGSL,
    ringDensityFieldWGSL,
    medullaryRaysWGSL,
    poresWGSL,
    structureCompositorWGSL
} from './woodNodalShaders'
import { getWebGPUDevice } from '../../utils/webgpu/deviceCache/webgpuDevice'
import type { PipelineDataMultiRecord } from '../../types/PipelineData.type'

/**
 * 节点化参数接口
 */
export interface WoodNodalParams {
    // 全局参数
    tileSize: number;

    // 节点1: 基础噪声场
    knotFrequency: number;
    knotThresholdMin: number;
    knotThresholdMax: number;
    distortionFreq: number;
    fbmOctaves: number;
    fbmAmplitude: number;

    // 节点2: 年轮
    ringScale: number;
    ringDistortion: number;
    knotIntensity: number;
    latewoodBias: number;
    ringNoiseFreq: number;

    // 节点3: 髓射线
    rayStrength: number;
    rayFrequencyX: number;
    rayFrequencyY: number;

    // 节点4: 孔隙
    poreDensity: number;
    poreScale: number;
    poreThresholdEarly: number;
    poreThresholdLate: number;
    poreThresholdRange: number;
    poreStrength: number;

    // 渲染参数 (非节点化部分)
    gradientStops: { offset: number, color: string }[];
    normalStrength: number;
    roughnessMin: number;
    roughnessMax: number;
}

export const defaultWoodNodalParams: WoodNodalParams = {
    tileSize: 1.0,

    knotFrequency: 0.8,
    knotThresholdMin: 0.4,
    knotThresholdMax: 0.8,
    distortionFreq: 1.5,
    fbmOctaves: 3,
    fbmAmplitude: 0.5,

    ringScale: 8.0,
    ringDistortion: 1.0,
    knotIntensity: 1.0,
    latewoodBias: 0.8,
    ringNoiseFreq: 5.0,

    rayStrength: 0.6,
    rayFrequencyX: 30.0,
    rayFrequencyY: 8.0,

    poreDensity: 20.0,
    poreScale: 1.0,
    poreThresholdEarly: 0.45,
    poreThresholdLate: 0.65,
    poreThresholdRange: 0.15,
    poreStrength: 0.2,

    gradientStops: [
        { offset: 0.0, color: '#734F33' },
        { offset: 1.0, color: '#DCC8A9' }
    ],
    normalStrength: 8.0,
    roughnessMin: 0.35,
    roughnessMax: 0.7,
}

/**
 * 节点输出接口
 */
interface NodeOutput {
    buffer: GPUBuffer;
    width: number;
    height: number;
}

/**
 * 创建计算管线
 */
function createComputePipeline(device: GPUDevice, shaderCode: string): GPUComputePipeline {
    const module = device.createShaderModule({ code: shaderCode });
    return device.createComputePipeline({
        layout: 'auto',
        compute: {
            module,
            entryPoint: 'main',
        },
    });
}

/**
 * 创建存储Buffer
 */
function createStorageBuffer(device: GPUDevice, size: number, usage: GPUBufferUsageFlags): GPUBuffer {
    return device.createBuffer({
        size,
        usage: usage | GPUBufferUsage.STORAGE,
    });
}

/**
 * 创建Uniform Buffer
 */
function createUniformBuffer(device: GPUDevice, data: Float32Array): GPUBuffer {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(buffer, 0, data);
    return buffer;
}

/**
 * 分发计算着色器工作组
 */
function dispatchCompute(
    device: GPUDevice,
    pipeline: GPUComputePipeline,
    bindGroup: GPUBindGroup,
    width: number,
    height: number
): void {
    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);

    // 工作组大小为 8x8
    const workgroupsX = Math.ceil(width / 8);
    const workgroupsY = Math.ceil(height / 8);
    passEncoder.dispatchWorkgroups(workgroupsX, workgroupsY);

    passEncoder.end();
    device.queue.submit([commandEncoder.finish()]);
}

// ============================================================
// 节点 1: 基础噪声场
// ============================================================

async function executeBaseNoiseField(
    device: GPUDevice,
    params: WoodNodalParams,
    width: number,
    height: number
): Promise<NodeOutput> {
    const bufferSize = width * height * 4 * 4; // vec4<f32>
    const outputBuffer = createStorageBuffer(device, bufferSize, GPUBufferUsage.COPY_SRC);

    // Uniform数据
    const uniformData = new Float32Array([
        params.tileSize,
        params.knotFrequency,
        params.knotThresholdMin,
        params.knotThresholdMax,
        params.distortionFreq,
        params.fbmOctaves,
        params.fbmAmplitude,
        0, // padding
        width,
        height,
    ]);
    const uniformBuffer = createUniformBuffer(device, uniformData);

    const pipeline = createComputePipeline(device, baseNoiseFieldWGSL);
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: outputBuffer } },
        ],
    });

    dispatchCompute(device, pipeline, bindGroup, width, height);

    return { buffer: outputBuffer, width, height };
}

// ============================================================
// 节点 2: 年轮密度场
// ============================================================

async function executeRingDensityField(
    device: GPUDevice,
    params: WoodNodalParams,
    baseNoiseOutput: NodeOutput
): Promise<NodeOutput> {
    const { width, height } = baseNoiseOutput;
    const bufferSize = width * height * 4 * 4;
    const outputBuffer = createStorageBuffer(device, bufferSize, GPUBufferUsage.COPY_SRC);

    const uniformData = new Float32Array([
        params.tileSize,
        params.ringScale,
        params.ringDistortion,
        params.knotIntensity,
        params.latewoodBias,
        params.ringNoiseFreq,
        0, 0, // padding
        width,
        height,
    ]);
    const uniformBuffer = createUniformBuffer(device, uniformData);

    const pipeline = createComputePipeline(device, ringDensityFieldWGSL);
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: baseNoiseOutput.buffer } },
            { binding: 2, resource: { buffer: outputBuffer } },
        ],
    });

    dispatchCompute(device, pipeline, bindGroup, width, height);

    return { buffer: outputBuffer, width, height };
}

// ============================================================
// 节点 3: 髓射线
// ============================================================

async function executeMedullaryRays(
    device: GPUDevice,
    params: WoodNodalParams,
    ringOutput: NodeOutput
): Promise<NodeOutput> {
    const { width, height } = ringOutput;
    const bufferSize = width * height * 4 * 4;
    const outputBuffer = createStorageBuffer(device, bufferSize, GPUBufferUsage.COPY_SRC);

    const uniformData = new Float32Array([
        params.tileSize,
        params.rayStrength,
        params.rayFrequencyX,
        params.rayFrequencyY,
        0, 0, 0, 0, // padding
        width,
        height,
    ]);
    const uniformBuffer = createUniformBuffer(device, uniformData);

    const pipeline = createComputePipeline(device, medullaryRaysWGSL);
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: ringOutput.buffer } },
            { binding: 2, resource: { buffer: outputBuffer } },
        ],
    });

    dispatchCompute(device, pipeline, bindGroup, width, height);

    return { buffer: outputBuffer, width, height };
}

// ============================================================
// 节点 4: 孔隙
// ============================================================

async function executePores(
    device: GPUDevice,
    params: WoodNodalParams,
    ringOutput: NodeOutput
): Promise<NodeOutput> {
    const { width, height } = ringOutput;
    const bufferSize = width * height * 4 * 4;
    const outputBuffer = createStorageBuffer(device, bufferSize, GPUBufferUsage.COPY_SRC);

    const uniformData = new Float32Array([
        params.tileSize,
        params.poreDensity,
        params.poreScale,
        params.poreThresholdEarly,
        params.poreThresholdLate,
        params.poreThresholdRange,
        params.poreStrength,
        0, // padding
        width,
        height,
    ]);
    const uniformBuffer = createUniformBuffer(device, uniformData);

    const pipeline = createComputePipeline(device, poresWGSL);
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: ringOutput.buffer } },
            { binding: 2, resource: { buffer: outputBuffer } },
        ],
    });

    dispatchCompute(device, pipeline, bindGroup, width, height);

    return { buffer: outputBuffer, width, height };
}

// ============================================================
// 节点 5: 结构合成
// ============================================================

async function executeStructureCompositor(
    device: GPUDevice,
    params: WoodNodalParams,
    ringOutput: NodeOutput,
    raysOutput: NodeOutput,
    poresOutput: NodeOutput
): Promise<NodeOutput> {
    const { width, height } = ringOutput;
    const bufferSize = width * height * 4 * 4;
    const outputBuffer = createStorageBuffer(device, bufferSize, GPUBufferUsage.COPY_SRC);

    const uniformData = new Float32Array([
        params.tileSize,
        0, 0, 0, // padding
        width,
        height,
    ]);
    const uniformBuffer = createUniformBuffer(device, uniformData);

    const pipeline = createComputePipeline(device, structureCompositorWGSL);
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: ringOutput.buffer } },
            { binding: 2, resource: { buffer: raysOutput.buffer } },
            { binding: 3, resource: { buffer: poresOutput.buffer } },
            { binding: 4, resource: { buffer: outputBuffer } },
        ],
    });

    dispatchCompute(device, pipeline, bindGroup, width, height);

    return { buffer: outputBuffer, width, height };
}

// ============================================================
// 主接口：节点化管线执行
// ============================================================

/**
 * 执行节点化的木纹生成管线
 * 返回所有中间节点的输出，可用于调试和重用
 */
export async function generateWoodNodalPipeline(
    params: WoodNodalParams,
    width: number,
    height: number
): Promise<PipelineDataMultiRecord> {
    const device = await getWebGPUDevice();
    if (!device) {
        throw new Error('WebGPU not supported');
    }

    console.log('🌲 执行节点化木纹生成管线...');

    // 节点1: 基础噪声场
    console.log('  节点1: 基础噪声场');
    const baseNoise = await executeBaseNoiseField(device, params, width, height);

    // 节点2: 年轮密度场
    console.log('  节点2: 年轮密度场');
    const ring = await executeRingDensityField(device, params, baseNoise);

    // 节点3、4可以并行执行（它们都只依赖节点2）
    console.log('  节点3: 髓射线 | 节点4: 孔隙 (并行)');
    const [rays, pores] = await Promise.all([
        executeMedullaryRays(device, params, ring),
        executePores(device, params, ring)
    ]);

    // 节点5: 结构合成
    console.log('  节点5: 结构合成');
    const structure = await executeStructureCompositor(device, params, ring, rays, pores);

    console.log('✅ 节点化管线执行完成');

    return {
        baseNoise,
        ring,
        rays,
        pores,
        structure,
    };
}
