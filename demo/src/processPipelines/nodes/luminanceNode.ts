import type { baseOptions } from './imports'
import type { NodeContext, Node } from './types'
import { applyLuminanceAdjustmentToImageData, gpuBufferToImageData } from './imports'

/**
 * 亮度调整中间件
 */
export const luminanceMiddleware: Node = {
  guard: (options: baseOptions) => {
    // 检查是否有亮度调整参数
    // 只有当亮度参数不全为0时才应用亮度调整
    return options.luminanceParams && (
      options.luminanceParams.shadows.brightness !== 0 || options.luminanceParams.shadows.contrast !== 0 ||
      options.luminanceParams.shadows.saturation !== 0 || options.luminanceParams.midtones.brightness !== 0 ||
      options.luminanceParams.midtones.contrast !== 0 || options.luminanceParams.midtones.saturation !== 0 ||
      options.luminanceParams.highlights.brightness !== 0 || options.luminanceParams.highlights.contrast !== 0 ||
      options.luminanceParams.highlights.saturation !== 0
    )
  },

  process: async (context: NodeContext) => {
    const { options, pipelineData } = context
    
    // 获取 GPU 设备
    const device = await context.getWebGPUDevice()
    
    // 将 GPUBuffer/GPUTexture 转换为 ImageData
    const imageData = await gpuBufferToImageData(pipelineData.buffer, pipelineData.width, pipelineData.height, device)
    
    try {
      // 应用亮度调整
      const processedImageData = await applyLuminanceAdjustmentToImageData(device, imageData, options.luminanceParams!)
      
      // 转换回 GPUBuffer
      const processedBuffer = device.createBuffer({
        size: processedImageData.data.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      })
      new Uint8Array(processedBuffer.getMappedRange()).set(processedImageData.data)
      processedBuffer.unmap()
      
      // 销毁旧的 buffer
      if (pipelineData.buffer instanceof GPUBuffer) {
        pipelineData.buffer.destroy()
      }
      if (pipelineData.buffer instanceof GPUTexture) {
        pipelineData.buffer.destroy()
      }
      
      // 更新上下文中的 pipelineData
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