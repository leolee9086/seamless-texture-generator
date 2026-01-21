/**
 * 水印处理管线节点
 */
import type { NodeContext, Node } from './types'
import type { WatermarkOptions } from './watermarkNode.types'
import { 应用水印 } from './imports'
import { gpuBufferToCanvas, canvasToGpuBuffer } from './watermarkNode.utils'

/**
 * @简洁函数 水印守卫函数，检查是否启用水印
 */
function isWatermarkEnabled(options: WatermarkOptions): boolean {
    return options.enableWatermark === true && options.watermarkConfig != null
}

/**
 * 水印处理中间件
 * 水印总是在管线最后应用，使用Canvas API渲染
 */
export const watermarkMiddleware: Node<WatermarkOptions> & { isWatermark: true } = {
    isWatermark: true,
    名称: '水印处理',
    可接受输入: ['GPUBuffer'],
    输出格式: 'GPUBuffer',
    cpuProcess: undefined,  // 不支持CPU批处理

    guard: isWatermarkEnabled,

    process: async (context: NodeContext<WatermarkOptions>) => {
        const { options, pipelineData } = context
        const config = options.watermarkConfig!

        const device = await context.getWebGPUDevice()

        const canvas = await gpuBufferToCanvas({
            buffer: pipelineData.buffer,
            width: pipelineData.width,
            height: pipelineData.height,
            device
        })

        应用水印(canvas, config)

        const newBuffer = await canvasToGpuBuffer({ canvas, device })

        if (pipelineData.buffer instanceof GPUBuffer) {
            pipelineData.buffer.destroy()
        }
        if (pipelineData.buffer instanceof GPUTexture) {
            pipelineData.buffer.destroy()
        }

        context.pipelineData = {
            buffer: newBuffer,
            width: pipelineData.width,
            height: pipelineData.height
        }
    }
}
