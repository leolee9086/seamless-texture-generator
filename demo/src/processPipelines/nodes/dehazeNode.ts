import type { baseOptions } from './imports'
import { applyDehazeAdjustment, DEFAULT_DEHAZE_PARAMS, gpuBufferToImageData } from './imports'
import type { NodeContext, Node } from './types'

/**
 * 去雾 - 纯 CPU 处理函数
 */
async function 去雾处理(imageData: ImageData, options: baseOptions): Promise<ImageData> {
  if (!options.dehazeParams) return imageData
  return await applyDehazeAdjustment(imageData, options.dehazeParams)
}

/**
 * 去雾调整中间件
 */
export const dehazeMiddleware: Node = {
  名称: '去雾',
  可接受输入: ['ImageData'],
  输出格式: 'ImageData',

  guard: (options: baseOptions) => {
    return options.dehazeParams && JSON.stringify(options.dehazeParams) !== JSON.stringify(DEFAULT_DEHAZE_PARAMS)
  },

  cpuProcess: 去雾处理,

  process: async (context: NodeContext) => {
    const { options, pipelineData } = context
    const device = await context.getWebGPUDevice()
    const imageData = await gpuBufferToImageData(pipelineData.buffer, pipelineData.width, pipelineData.height, device)

    try {
      const processedImageData = await 去雾处理(imageData, options)

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
      console.warn('去雾处理失败，继续使用原始图像:', error)
    }
  }
}