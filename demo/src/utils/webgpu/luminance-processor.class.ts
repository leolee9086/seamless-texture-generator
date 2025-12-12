/**
 * WebGPU Luminance Processor
 * Implements luminance-based adjustments (Shadows, Midtones, Highlights) using WebGPU
 */

import type { LuminanceAdjustmentParams } from './luminance.types';
import { luminanceComputeShader, createLuminanceParamsBuffer } from './luminance-shaders';

export class WebGPULuminanceProcessor {
    private device: GPUDevice;
    private pipeline: GPUComputePipeline | null = null;
    private uniformBuffer: GPUBuffer | null = null;
    private bindGroup: GPUBindGroup | null = null;

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
            code: this.getShaderCode()
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

    private getShaderCode(): string {
        // Use the imported shader code
        return luminanceComputeShader;
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
    device: GPUDevice,
    inputTexture: GPUTexture,
    outputTexture: GPUTexture,
    params: LuminanceAdjustmentParams
): Promise<void> {
    const processor = new WebGPULuminanceProcessor(device);
    await processor.initialize();

    const commandEncoder = await processor.processImage(inputTexture, outputTexture, params);
    device.queue.submit([commandEncoder.finish()]);

    processor.destroy();
}
