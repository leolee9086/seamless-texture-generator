/**
 * @leolee9086/image-dehazing 库的类型声明
 */

declare module '@leolee9086/image-dehazing' {
  /**
   * WebGPU设备
   */
  export interface GPUDevice {
    queue: GPUQueue
    createBuffer(options: GPUBufferDescriptor): GPUBuffer
    createTexture(options: GPUTextureDescriptor): GPUTexture
    createShaderModule(options: GPUShaderModuleDescriptor): GPUShaderModule
    createComputePipeline(options: GPUComputePipelineDescriptor): GPUComputePipeline
    createCommandEncoder(): GPUCommandEncoder
  }
  
  /**
   * GPU队列
   */
  export interface GPUQueue {
    writeBuffer(buffer: GPUBuffer, offset: number, data: ArrayBufferView): void
    submit(commandBuffers: GPUCommandBuffer[]): void
    onSubmittedWorkDone(): Promise<void>
  }
  
  /**
   * GPU缓冲区
   */
  export interface GPUBuffer {
    size: number
    mapAsync(mode: GPUMapMode): Promise<void>
    getMappedRange(): ArrayBuffer
    unmap(): void
  }
  
  /**
   * GPU纹理
   */
  export interface GPUTexture {
    createView(): GPUTextureView
    destroy(): void
  }
  
  /**
   * GPU着色器模块
   */
  export interface GPUShaderModule {}
  
  /**
   * GPU计算管线
   */
  export interface GPUComputePipeline {
    getBindGroupLayout(index: number): GPUBindGroupLayout
  }
  
  /**
   * GPU命令编码器
   */
  export interface GPUCommandEncoder {
    copyBufferToBuffer(src: GPUBuffer, srcOffset: number, dst: GPUBuffer, dstOffset: number, size: number): void
    finish(): GPUCommandBuffer
  }
  
  /**
   * GPU命令缓冲区
   */
  export interface GPUCommandBuffer {}
  
  /**
   * GPU纹理视图
   */
  export interface GPUTextureView {}
  
  /**
   * GPU绑定组布局
   */
  export interface GPUBindGroupLayout {}
  
  /**
   * GPU缓冲区描述符
   */
  export interface GPUBufferDescriptor {
    label?: string
    size: number
    usage: number
  }
  
  /**
   * GPU纹理描述符
   */
  export interface GPUTextureDescriptor {
    label?: string
    size: { width: number; height: number }
    format: string
    usage: number
  }
  
  /**
   * GPU着色器模块描述符
   */
  export interface GPUShaderModuleDescriptor {
    label?: string
    code: string
  }
  
  /**
   * GPU计算管线描述符
   */
  export interface GPUComputePipelineDescriptor {
    label?: string
    layout?: string
    compute: {
      module: GPUShaderModule
      entryPoint: string
    }
  }
  
  /**
   * GPU映射模式
   */
  export const GPUMapMode: {
    READ: number
    WRITE: number
  }
  
  /**
   * 图像数据
   */
  export interface ImageData {
    width: number
    height: number
    data: Uint8ClampedArray
  }
  
  /**
   * 大气光RGB值
   */
  export interface AtmosphericLightRGB {
    r: number
    g: number
    b: number
    luminance: number
  }
  
  /**
   * 自适应信息
   */
  export interface AdaptiveInfo {
    omega: number
    t0: number
    hazeLevel: number
    recommendedPreset: string
  }
  
  /**
   * 去雾结果
   */
  export interface DehazeResult {
    imageData: ImageData
    adaptiveInfo?: AdaptiveInfo
    originalOmega: number
    finalOmega: number
    atmosphericLight: AtmosphericLightRGB
    spatialAdaptiveMode: boolean
    enhancementOptions?: any
  }
  
  /**
   * 去雾选项
   */
  export interface DehazeOptions {
    windowSize?: number
    topRatio?: number
    omega?: number
    t0?: number
    adaptiveMode?: boolean
    spatialAdaptiveMode?: boolean
    adaptiveStrength?: number
    adaptiveOptions?: {
      hazeWeight?: number
      atmosphericWeight?: number
    }
    enhancementOptions?: {
      enableEnhancement?: boolean
      saturationEnhancement?: number
      contrastEnhancement?: number
      brightnessEnhancement?: number
    }
  }
  
  /**
   * 简化版WebGPU去雾函数
   */
  export function dehazeImageWebGPUSimple(
    imageData: ImageData,
    options?: DehazeOptions
  ): Promise<DehazeResult>
  
  /**
   * 批量去雾函数
   */
  export function batchDehazeWebGPUSimple(
    imageDataArray: ImageData[],
    options?: DehazeOptions
  ): Promise<DehazeResult[]>
  
  /**
   * 预初始化WebGPU设备
   */
  export function preInitializeDevice(): Promise<GPUDevice>
  
  /**
   * 获取缓存的WebGPU设备
   */
  export function getCachedDevice(): GPUDevice | null
  
  /**
   * 检查设备是否已初始化
   */
  export function isDeviceInitialized(): boolean
  
  /**
   * 清理设备缓存
   */
  export function clearDeviceCache(): void
  
  /**
   * 清理所有缓存
   */
  export function clearAllCaches(): void
  
  /**
   * 图像数据转纹理
   */
  export function imageDataToTexture(
    device: GPUDevice,
    imageData: ImageData
  ): Promise<GPUTexture>
  
  /**
   * 缓冲区转图像数据
   */
  export function bufferToImageData(
    device: GPUDevice,
    buffer: GPUBuffer,
    width: number,
    height: number
  ): Promise<ImageData>
  
  /**
   * 生成图像哈希
   */
  export function generateImageHash(imageData: ImageData): string
  
  /**
   * 创建完整缓存键
   */
  export function createFullCacheKey(params: any, imageData: ImageData): string
}