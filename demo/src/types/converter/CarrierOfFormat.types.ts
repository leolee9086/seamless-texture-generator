/**
 * CarrierOfFormat 条件类型映射
 *
 * 提供 DataFormat 到对应 Carrier 类型的映射
 */

import type {
  DataFormat,
  GPUBufferCarrier,
  GPUTextureCarrier,
  ImageDataCarrier,
  CanvasCarrier,
  BlobCarrier,
  BlobURLCarrier
} from './imports'

/**
 * 格式到载体类型的条件映射
 *
 * 根据 DataFormat 类型参数返回对应的 Carrier 类型
 *
 * @template T - DataFormat 类型
 *
 * @example
 * ```typescript
 * // 类型推断为 GPUBufferCarrier
 * type BufferCarrier = CarrierOfFormat<'GPUBuffer'>
 *
 * // 类型推断为 ImageDataCarrier
 * type ImageCarrier = CarrierOfFormat<'ImageData'>
 * ```
 */
export type CarrierOfFormat<T extends DataFormat> =
  T extends 'GPUBuffer' ? GPUBufferCarrier :
  T extends 'GPUTexture' ? GPUTextureCarrier :
  T extends 'ImageData' ? ImageDataCarrier :
  T extends 'Canvas' ? CanvasCarrier :
  T extends 'Blob' ? BlobCarrier :
  T extends 'BlobURL' ? BlobURLCarrier :
  never
