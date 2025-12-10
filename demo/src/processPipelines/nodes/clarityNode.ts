import { baseOptions, gpuBufferToImageData, processClarityAdjustment } from './imports'
import type { NodeContext, Node } from './types'

/**
 * 清晰度调整中间件
 */
export const clarityMiddleware: Node = {
  guard: (options: baseOptions) => {
    // 检查是否有清晰度调整参数
    // enhancementStrength和macroEnhancement为关键参数
    return options.clarityParams &&
      (options.clarityParams.enhancementStrength !== 1.0 || 
       options.clarityParams.macroEnhancement !== 0.0)
  },
  process: async (context: NodeContext) => {
    const { options, pipelineData } = context
    
    // 获取 GPU 设备
    const device = await context.getWebGPUDevice()
    
    // 将 GPUBuffer/GPUTexture 转换为 ImageData
    const imageData = await gpuBufferToImageData(pipelineData.buffer, pipelineData.width, pipelineData.height, device)
    
    try {
      // 应用清晰度调整
      const processedImageData = await processClarityAdjustment(device, imageData, options.clarityParams!)
      
      // 转换回 GPUBuffer
      const processedBuffer = device.createBuffer({
        size: processedImageData.data.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
      })
      new Uint8Array(processedBuffer.getMappedRange()).set(processedImageData.data)
      processedBuffer.unmap()
      
      // 销毁旧的 buffer - 使用卫语句避免嵌套
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
      console.warn('清晰度处理失败，继续使用原始图像:', error)
    }
  }
}