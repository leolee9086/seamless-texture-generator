/**
 * 木纹生成器 - 向后兼容包装器
 * 
 * 此文件只是重新导出新的管线化实现
 * 旧的单步骤实现已被 woodGeneratorPipeline.ts 取代
 */

export {
    generateWoodTexture,
    generateWoodTexturePipeline,
    defaultWoodParams,
    type WoodParams
} from './woodGeneratorPipeline'
