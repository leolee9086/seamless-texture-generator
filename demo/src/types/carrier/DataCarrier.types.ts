/**
 * DataCarrier 类型体系 - 类型定义
 * 
 * 提供统一的数据载体接口，支持多种数据格式：
 * - GPUBuffer: GPU 缓冲区，用于计算着色器
 * - GPUTexture: GPU 纹理，用于纹理采样和渲染
 * - ImageData: CPU ImageData，用于 CPU 处理
 * - Canvas: Canvas 元素，用于 2D 渲染和显示
 * - Blob: Blob 对象，用于文件导出
 * - BlobURL: Blob URL 字符串，用于图像显示和下载
 * 
 * 采用 ECS 设计原则，数据与行为分离：
 * - State: 纯数据接口
 * - Actions: 纯行为接口
 * - Carrier: 包装器接口 { state, actions }
 */

/**
 * 数据格式类型
 * 用于标识 DataCarrier 中携带的数据类型
 */
export type DataFormat =
  | 'GPUBuffer'      // GPU 缓冲区 - 用于 GPU 计算
  | 'GPUTexture'     // GPU 纹理 - 用于纹理采样和渲染
  | 'ImageData'      // CPU ImageData - 用于 CPU 处理
  | 'Canvas'         // Canvas 元素 - 用于 2D 渲染和显示
  | 'Blob'           // Blob 对象 - 用于文件导出
  | 'BlobURL'        // Blob URL 字符串 - 用于图像显示和下载

// ============================================================================
// 基础状态接口
// ============================================================================

/**
 * 数据载体基础状态接口
 * 所有具体载体类型的状态都必须实现此接口
 */
export interface DataCarrierState<TFormat extends DataFormat = DataFormat> {
  /** 数据宽度（像素） */
  readonly width: number
  
  /** 数据高度（像素） */
  readonly height: number
  
  /** 数据格式标识符 */
  readonly format: TFormat
}

/**
 * 数据载体行为类型
 * 定义销毁资源的函数类型
 */
export type DataCarrierDestroy = () => void

/**
 * 数据载体包装器接口
 * 包含状态和销毁函数
 */
export interface DataCarrier<TState extends DataCarrierState = DataCarrierState> {
  /** 载体状态数据 */
  readonly state: TState
  
  /**
   * 销毁载体，释放相关资源
   * 对于 GPU 资源，会调用 destroy() 方法
   * 对于 BlobURL，会调用 URL.revokeObjectURL()
   */
  readonly destroy: DataCarrierDestroy
}

// ============================================================================
// GPU 载体状态类型
// ============================================================================

/**
 * GPU 缓冲区载体状态
 * 用于 GPU 计算着色器处理
 */
export interface GPUBufferCarrierState extends DataCarrierState<'GPUBuffer'> {
  readonly format: 'GPUBuffer'
  
  /** GPU 缓冲区对象 */
  readonly buffer: GPUBuffer
  
  /**
   * 缓冲区用途标志
   * 通常为 GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST
   */
  readonly usage: GPUBufferUsageFlags
  
  /**
   * 每像素字节数
   * RGBA 格式为 4，用于计算缓冲区大小
   */
  readonly bytesPerPixel: number
}

/**
 * GPU 纹理载体状态
 * 用于纹理采样和渲染管线
 */
export interface GPUTextureCarrierState extends DataCarrierState<'GPUTexture'> {
  readonly format: 'GPUTexture'
  
  /** GPU 纹理对象 */
  readonly texture: GPUTexture
  
  /**
   * 纹理格式
   * 如 'rgba8unorm', 'bgra8unorm', 'rgba16float' 等
   */
  readonly textureFormat: GPUTextureFormat
  
  /**
   * 纹理用途标志
   */
  readonly usage: GPUTextureUsageFlags
}

// ============================================================================
// CPU 载体状态类型
// ============================================================================

/**
 * ImageData 载体状态
 * 用于 CPU 端图像处理
 */
export interface ImageDataCarrierState extends DataCarrierState<'ImageData'> {
  readonly format: 'ImageData'
  
  /** ImageData 对象 */
  readonly imageData: ImageData
}

/**
 * Canvas 载体状态
 * 用于 2D 渲染和显示
 */
export interface CanvasCarrierState extends DataCarrierState<'Canvas'> {
  readonly format: 'Canvas'
  
  /** Canvas 元素 */
  readonly canvas: HTMLCanvasElement | OffscreenCanvas
  
  /** 2D 渲染上下文（可选） */
  readonly context?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
}

// ============================================================================
// 输出载体状态类型
// ============================================================================

/**
 * Blob 载体状态
 * 用于文件导出
 */
export interface BlobCarrierState extends DataCarrierState<'Blob'> {
  readonly format: 'Blob'
  
  /** Blob 对象 */
  readonly blob: Blob
  
  /** MIME 类型 */
  readonly mimeType: string
}

// ============================================================================
// 具体载体类型（包装器）
// ============================================================================

/** GPU 缓冲区载体 */
export type GPUBufferCarrier = DataCarrier<GPUBufferCarrierState>

/** GPU 纹理载体 */
export type GPUTextureCarrier = DataCarrier<GPUTextureCarrierState>

/** ImageData 载体 */
export type ImageDataCarrier = DataCarrier<ImageDataCarrierState>

/** Canvas 载体 */
export type CanvasCarrier = DataCarrier<CanvasCarrierState>

/** Blob 载体 */
export type BlobCarrier = DataCarrier<BlobCarrierState>

/** Blob URL 载体 */
export type BlobURLCarrier = DataCarrier<BlobURLCarrierState>

// ============================================================================
// 状态联合类型
// ============================================================================

/** 所有载体状态的联合 */
export type AnyDataCarrierState =
  | GPUBufferCarrierState
  | GPUTextureCarrierState
  | ImageDataCarrierState
  | CanvasCarrierState
  | BlobCarrierState
  | BlobURLCarrierState

/** GPU 相关载体状态联合 */
export type GPUCarrierState = GPUBufferCarrierState | GPUTextureCarrierState

/** CPU 相关载体状态联合 */
export type CPUCarrierState = ImageDataCarrierState | CanvasCarrierState

/** 输出相关载体状态联合 */
export type OutputCarrierState = BlobCarrierState | BlobURLCarrierState

/** 管线载体状态 */
export type PipelineCarrierState = GPUBufferCarrierState | GPUTextureCarrierState

// ============================================================================
// 载体联合类型
// ============================================================================

/** 所有载体类型的联合 */
export type AnyDataCarrier = DataCarrier<AnyDataCarrierState>

/** GPU 相关载体类型联合 */
export type GPUCarrier = DataCarrier<GPUCarrierState>

/** CPU 相关载体类型联合 */
export type CPUCarrier = DataCarrier<CPUCarrierState>

/** 输出相关载体类型联合 */
export type OutputCarrier = DataCarrier<OutputCarrierState>

/** 管线载体类型 */
export type PipelineCarrier = DataCarrier<PipelineCarrierState>

// ============================================================================
// 多记录类型
// ============================================================================

/** 新版多记录类型 */
export type DataCarrierMultiRecord = Record<string, AnyDataCarrier>

/** 管线多记录类型（仅包含 GPU 载体） */
export type PipelineCarrierMultiRecord = Record<string, PipelineCarrier>

/**
 * Blob URL 载体状态
 * 用于图像显示和下载
 */
export interface BlobURLCarrierState extends DataCarrierState<'BlobURL'> {
  readonly format: 'BlobURL'
  
  /** Blob URL 字符串 */
  readonly url: string
  
  /** MIME 类型 */
  readonly mimeType: string
}