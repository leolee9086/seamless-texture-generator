/**
 * dehaze 目录的统一导入转发文件
 * 用于转发第三方包，避免直接导入
 */

// 转发 @leolee9086/image-dehazing 包的导入
export { 
  dehazeImageWebGPUSimple, 
  preInitializeDevice, 
  clearAllCaches 
} from '@leolee9086/image-dehazing'