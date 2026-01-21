import type { baseOptions } from './imports'
import type { NodeContext, Node } from './types'
import { applyLuminanceAdjustmentToImageData, gpuBufferToImageData } from './imports'

/** @简洁函数 亮度处理需要 device 参数 */
async function 亮度处理(imageData: ImageData, options: baseOptions, device: GPUDevice): Promise<ImageData> {
  if (!options.luminanceParams) return imageData
  return await applyLuminanceAdjustmentToImageData(device, imageData, options.luminanceParams)
}

/**
 * 亮度调整中间件
 */
export const luminanceMiddleware: Node = {
  名称: '亮度调整',
  可接受输入: ['ImageData'],
  输出格式: 'ImageData',

  guard: (options: baseOptions) => {
    return options.luminanceParams && (
      options.luminanceParams.shadows.brightness !== 0 || options.luminanceParams.shadows.contrast !== 0 ||
      options.luminanceParams.shadows.saturation !== 0 || options.luminanceParams.midtones.brightness !== 0 ||
      options.luminanceParams.midtones.contrast !== 0 || options.luminanceParams.midtones.saturation !== 0 ||
      options.luminanceParams.highlights.brightness !== 0 || options.luminanceParams.highlights.contrast !== 0 ||
      options.luminanceParams.highlights.saturation !== 0
    )
  },

  cpuProcess: async (imageData: ImageData, options: baseOptions): Promise<ImageData> => {
    console.warn('亮度节点需要 GPU device，应使用 process 方法')
    return imageData
  },

  process: async (context: NodeContext) => {
    const { options, pipelineData } = context
    const device = await context.getWebGPUDevice()
    const imageData = await gpuBufferToImageData(pipelineData.buffer, pipelineData.width, pipelineData.height, device)

    try {
      const processedImageData = await 亮度处理(imageData, options, device)

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
      console.warn('亮度调整处理失败，继续使用原始图像:', error)
    }
  }
}