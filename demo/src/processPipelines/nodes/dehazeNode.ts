import { PipelineData, baseOptions } from '../../types/PipelineData.type'
import { MiddlewareContext, Middleware } from './types'
import { applyDehazeAdjustment, DEFAULT_DEHAZE_PARAMS } from '../../adjustments/dehaze/dehazeAdjustment'
import { gpuBufferToImageData } from '../../utils/webgpu/convert/gpuBufferToImageData'

/**
 * 去雾调整中间件
 */
export const dehazeMiddleware: Middleware = {
  guard: (options: baseOptions) => {
    return options.dehazeParams && JSON.stringify(options.dehazeParams) !== JSON.stringify(DEFAULT_DEHAZE_PARAMS)
  },

  process: async (context: MiddlewareContext) => {
    const { options, pipelineData } = context
    
    // 获取 GPU 设备
    if (!navigator.gpu) {
      throw new Error('WebGPU 不支持')
    }
    
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('无法获取 GPU 适配器')
    }
    
    const device = await adapter.requestDevice()
    
    // 将 GPUBuffer/GPUTexture 转换为 ImageData
    const imageData = await gpuBufferToImageData(pipelineData.buffer, pipelineData.width, pipelineData.height, device)
    
    try {
      // 应用去雾调整
      const processedImageData = await applyDehazeAdjustment(imageData, options.dehazeParams!)
      
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
      } else if (pipelineData.buffer instanceof GPUTexture) {
        pipelineData.buffer.destroy()
      }
      
      // 更新上下文中的 pipelineData
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