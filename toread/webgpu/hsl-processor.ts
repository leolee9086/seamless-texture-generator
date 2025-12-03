/**
 * WebGPU HSL颜色处理器
 * 基于src/Algorithm/HSL.ts的原理实现GPU加速版本
 */

import { createHSLComputeShader, createHSLParams, type HSLAdjustmentParams } from './hsl-shaders';

/**
 * WebGPU HSL处理器类
 * 提供GPU加速的HSL颜色调整功能
 */
export class WebGPUHSLProcessor {
    private device: GPUDevice;
    private shaderModule: GPUShaderModule;
    private pipeline: GPUComputePipeline;
    private uniformBuffer: GPUBuffer;
    private uniformData: Float32Array;

    constructor(device: GPUDevice, highPerformance: boolean = false) {
        this.device = device;
        this.shaderModule = createHSLComputeShader(device, highPerformance);
        this.uniformData = new Float32Array(16); // HSLParams结构体有13个float32值，但需要16字节对齐
        this.uniformBuffer = device.createBuffer({
            size: this.uniformData.byteLength, // 64字节 (16 * 4)
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            label: 'HSL Uniform Buffer'
        });

        // 创建计算管线
        this.pipeline = device.createComputePipeline({
            layout: 'auto',
            label: 'HSL Compute Pipeline',
            compute: {
                module: this.shaderModule,
                entryPoint: 'main',
            },
        });
    }

    /**
     * 处理图像数据，应用HSL调整
     * @param inputTexture 输入纹理
     * @param outputTexture 输出纹理
     * @param params HSL调整参数
     * @param commandEncoder 命令编码器（可选）
     * @returns 命令编码器（如果提供了输入编码器则返回同一个，否则返回新的）
     */
    processImage(
        inputTexture: GPUTexture,
        outputTexture: GPUTexture,
        params: HSLAdjustmentParams,
        commandEncoder?: GPUCommandEncoder
    ): GPUCommandEncoder {
        // 创建或使用提供的命令编码器
        const encoder = commandEncoder ?? this.device.createCommandEncoder({
            label: 'HSL Process Encoder'
        });

        // 更新uniform数据
        const uniformData = createHSLParams(params);
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData.buffer);

        // 创建绑定组
        const bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: inputTexture.createView({ label: 'Input Texture View' }),
                },
                {
                    binding: 1,
                    resource: outputTexture.createView({ label: 'Output Texture View' }),
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.uniformBuffer,
                    },
                },
            ],
            label: 'HSL Bind Group'
        });

        // 记录计算通道
        const computePass = encoder.beginComputePass({
            label: 'HSL Compute Pass'
        });
        computePass.setPipeline(this.pipeline);
        computePass.setBindGroup(0, bindGroup);

        // 计算工作组数量
        const workgroupCount = this.calculateWorkgroupCount(
            inputTexture.width,
            inputTexture.height
        );

        computePass.dispatchWorkgroups(workgroupCount.x, workgroupCount.y);
        computePass.end();

        return encoder;
    }

    /**
     * 生成遮罩可视化
     * @param inputTexture 输入纹理
     * @param outputTexture 输出纹理
     * @param targetColor 目标颜色
     * @param precision 精确度
     * @param range 羽化范围
     * @param commandEncoder 命令编码器（可选）
     * @returns 命令编码器
     */
    generateMaskVisualization(
        inputTexture: GPUTexture,
        outputTexture: GPUTexture,
        targetColor: string,
        precision: number,
        range: number = 50,
        commandEncoder?: GPUCommandEncoder
    ): GPUCommandEncoder {
        const maskParams: HSLAdjustmentParams = {
            targetColor,
            hueOffset: 0,
            saturationOffset: 0,
            lightnessOffset: 0,
            precision,
            range,
            maskMode: 'mask'
        };

        return this.processImage(inputTexture, outputTexture, maskParams, commandEncoder);
    }

    /**
     * 生成遮罩叠加效果
     * @param inputTexture 输入纹理
     * @param outputTexture 输出纹理
     * @param targetColor 目标颜色
     * @param precision 精确度
     * @param range 羽化范围
     * @param overlayColor 叠加颜色
     * @param overlayAlpha 叠加透明度
     * @param commandEncoder 命令编码器（可选）
     * @returns 命令编码器
     */
    generateMaskOverlay(
        inputTexture: GPUTexture,
        outputTexture: GPUTexture,
        targetColor: string,
        precision: number,
        range: number = 50,
        overlayColor: [number, number, number] = [1.0, 0.0, 0.0],
        overlayAlpha: number = 0.6,
        commandEncoder?: GPUCommandEncoder
    ): GPUCommandEncoder {
        const overlayParams: HSLAdjustmentParams = {
            targetColor,
            hueOffset: 0,
            saturationOffset: 0,
            lightnessOffset: 0,
            precision,
            range,
            maskMode: 'overlay',
            overlayColor,
            overlayAlpha
        };

        return this.processImage(inputTexture, outputTexture, overlayParams, commandEncoder);
    }

    /**
     * 计算所需的工作组数量
     * @param width 纹理宽度
     * @param height 纹理高度
     * @returns 工作组数量
     */
    private calculateWorkgroupCount(width: number, height: number): { x: number; y: number } {
        // 假设工作组大小为16x16（标准模式）
        const workgroupSize = 16;
        return {
            x: Math.ceil(width / workgroupSize),
            y: Math.ceil(height / workgroupSize)
        };
    }

    /**
     * 销毁资源
     */
    destroy(): void {
        this.uniformBuffer.destroy();
        // GPUShaderModule 不需要手动销毁，由垃圾回收器处理
        // this.shaderModule.destroy();
    }

    /**
     * 获取设备引用
     */
    getDevice(): GPUDevice {
        return this.device;
    }
}

/**
 * 创建WebGPU HSL处理器的工厂函数
 * @param device WebGPU设备
 * @param highPerformance 是否使用高性能模式
 * @returns HSL处理器实例
 */
export function createWebGPUHSLProcessor(
    device: GPUDevice, 
    highPerformance: boolean = false
): WebGPUHSLProcessor {
    return new WebGPUHSLProcessor(device, highPerformance);
}

/**
 * 便捷函数：一次性处理图像
 * @param device WebGPU设备
 * @param inputTexture 输入纹理
 * @param outputTexture 输出纹理
 * @param params HSL调整参数
 * @param highPerformance 是否使用高性能模式
 * @returns Promise，表示处理完成
 */
export async function processHSLImage(
    device: GPUDevice,
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    params: HSLAdjustmentParams,
    highPerformance: boolean = false
): Promise<void> {
    const processor = createWebGPUHSLProcessor(device, highPerformance);
    
    try {
        const encoder = processor.processImage(inputTexture, outputTexture, params);
        device.queue.submit([encoder.finish()]);
    } finally {
        processor.destroy();
    }
}

/**
 * 便捷函数：生成遮罩可视化
 * @param device WebGPU设备
 * @param inputTexture 输入纹理
 * @param outputTexture 输出纹理
 * @param targetColor 目标颜色
 * @param precision 精确度
 * @param range 羽化范围
 * @param highPerformance 是否使用高性能模式
 * @returns Promise，表示处理完成
 */
export async function generateHSLMaskVisualization(
    device: GPUDevice,
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    targetColor: string,
    precision: number,
    range: number = 50,
    highPerformance: boolean = false
): Promise<void> {
    const processor = createWebGPUHSLProcessor(device, highPerformance);
    
    try {
        const encoder = processor.generateMaskVisualization(
            inputTexture, 
            outputTexture, 
            targetColor, 
            precision, 
            range
        );
        device.queue.submit([encoder.finish()]);
    } finally {
        processor.destroy();
    }
}

/**
 * 便捷函数：生成遮罩叠加效果
 * @param device WebGPU设备
 * @param inputTexture 输入纹理
 * @param outputTexture 输出纹理
 * @param targetColor 目标颜色
 * @param precision 精确度
 * @param range 羽化范围
 * @param overlayColor 叠加颜色
 * @param overlayAlpha 叠加透明度
 * @param highPerformance 是否使用高性能模式
 * @returns Promise，表示处理完成
 */
export async function generateHSLMaskOverlay(
    device: GPUDevice,
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    targetColor: string,
    precision: number,
    range: number = 50,
    overlayColor: [number, number, number] = [1.0, 0.0, 0.0],
    overlayAlpha: number = 0.6,
    highPerformance: boolean = false
): Promise<void> {
    const processor = createWebGPUHSLProcessor(device, highPerformance);
    
    try {
        const encoder = processor.generateMaskOverlay(
            inputTexture, 
            outputTexture, 
            targetColor, 
            precision, 
            range, 
            overlayColor, 
            overlayAlpha
        );
        device.queue.submit([encoder.finish()]);
    } finally {
        processor.destroy();
    }
}