import type { baseOptions } from './imports'
import { gpuBufferToImageData, processClarityAdjustment } from './imports'
import type { NodeContext, Node } from './types'

/** @简洁函数 清晰度处理需要 device 参数，这里获取并传递 */
async function 清晰度处理(imageData: ImageData, options: baseOptions, device: GPUDevice): Promise<ImageData> {
  if (!options.clarityParams) return imageData
  return await processClarityAdjustment(device, imageData, options.clarityParams)
}

/**
 * 清晰度调整中间件
 * 虽然内部使用GPU处理，但需要ImageData作为中间格式
 * 设置为GPU节点模式以避免被错误放入CPU批处理组
 */
export const clarityMiddleware: Node = {
  名称: '清晰度调整',
  可接受输入: ['GPUBuffer'],
  输出格式: 'GPUBuffer',

  guard: (options: baseOptions) => {
    return options.clarityParams &&
      (options.clarityParams.enhancementStrength !== 1.0 ||
        options.clarityParams.macroEnhancement !== 0.0)
  },

  // 不提供 cpuProcess，调度器会识别为 GPU 节点并调用 process
  cpuProcess: undefined,

  process: async (context: NodeContext) => {
    const { options, pipelineData } = context
    const device = await context.getWebGPUDevice()
    const imageData = await gpuBufferToImageData(pipelineData.buffer, pipelineData.width, pipelineData.height, device)

    try {
      const processedImageData = await 清晰度处理(imageData, options, device)

      const processedBuffer = device.createBuffer({
        size: processedImageData.data.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      })
      new Uint8Array(processedBuffer.getMappedRange()).set(processedImageData.data)
      processedBuffer.unmap()

      if (pipelineData.buffer instanceof GPUBuffer) {
        pipelineData.buffer.destroy()
      }

      context.pipelineData = {
        buffer: processedBuffer,
        width: processedImageData.width,
        height: processedImageData.height
      }
    } catch (error) {
      console.warn('清晰度处理失败，继续使用原始图像:', error)
    }
  }
}