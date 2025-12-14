/**
 * WebGPU Luminance Processor
 * Implements luminance-based adjustments (Shadows, Midtones, Highlights) using WebGPU
 */

import type { LuminanceAdjustmentParams, ProcessLuminanceOptions } from './luminance.types';
import { luminanceComputeShader, createLuminanceParamsBuffer } from './luminance-shaders';

export class WebGPULuminanceProcessor {
    private device: GPUDevice;
    private pipeline: GPUComputePipeline | null = null;
    private uniformBuffer: GPUBuffer | null = null;
    private bindGroup: GPUBindGroup | null = null;
    //@AITODO 这个Device本质上并不是由这个类管理的状态而是一个由外部传入的
    //不可改变的状态，所以不应该在destroy中销毁它
    //并且这个类也不应该管理它的生命周期，所以本质上它不应该是一个类的成员变量
    //也就无需在构造函数中赋值，而是应该作为每一个方法的参数传入
    //注意类的状态成员应该明确表示它们的生命周期和管理责任
    //所以需要重构这个类以更好地反映这一点
    //注意同步修改调用方代码
    constructor(device: GPUDevice) {
        this.device = device;
    }

    async initialize(): Promise<void> {
        // Create uniform buffer for parameters
        this.uniformBuffer = this.device.createBuffer({
            size: 256, // Enough space for all parameters
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });

        // Load shader module
        const shaderModule = this.device.createShaderModule({
            code: luminanceComputeShader
        });

        // Create compute pipeline
        this.pipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: shaderModule,
                entryPoint: 'main'
            }
        });
    }



    async processImage(
        inputTexture: GPUTexture,
        outputTexture: GPUTexture,
        params: LuminanceAdjustmentParams
    ): Promise<GPUCommandEncoder> {
        if (!this.pipeline || !this.uniformBuffer) {
            throw new Error('Processor not initialized');
        }

        // Update uniform buffer with parameters
        // Use the helper function from luminance-shaders to ensure correct layout
        const uniformData = createLuminanceParamsBuffer(params);

        this.device.queue.writeBuffer(this.uniformBuffer!, 0, uniformData.buffer);

        // Create bind group
        this.bindGroup = this.device.createBindGroup({
            layout: this.pipeline.getBindGroupLayout(0),
            entries: [
                {
                    binding: 0,
                    resource: inputTexture.createView()
                },
                {
                    binding: 1,
                    resource: outputTexture.createView()
                },
                {
                    binding: 2,
                    resource: { buffer: this.uniformBuffer! }
                }
            ]
        });

        // Create command encoder
        const commandEncoder = this.device.createCommandEncoder();

        // Begin compute pass
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindGroup!);

        // Calculate workgroup dimensions
        const workgroupCountX = Math.ceil(inputTexture.width / 16);
        const workgroupCountY = Math.ceil(inputTexture.height / 16);

        passEncoder.dispatchWorkgroups(workgroupCountX, workgroupCountY);
        passEncoder.end();

        return commandEncoder;
    }

    destroy(): void {
        this.uniformBuffer?.destroy();
        this.pipeline = null;
        this.uniformBuffer = null;
        this.bindGroup = null;
    }
}



// Process luminance adjustment using WebGPU
export async function processLuminanceAdjustment(
    options: ProcessLuminanceOptions
): Promise<void> {
    const { device, inputTexture, outputTexture, params } = options;
    const processor = new WebGPULuminanceProcessor(device);
    await processor.initialize();

    const commandEncoder = await processor.processImage(inputTexture, outputTexture, params);
    device.queue.submit([commandEncoder.finish()]);

    processor.destroy();
}
