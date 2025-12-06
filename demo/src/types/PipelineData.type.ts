/**
 * 管线数据接口 - 统一使用 GPUBuffer 作为数据载体
 */
export interface PipelineData {
    buffer: GPUBuffer | GPUTexture;
    width: number;
    height: number;
}
/**
 * 多记录管线数据接口,统一使用GpuBuffer作为数据载体
 */
export type PipelineDataMultiRecord = Record<string, PipelineData>


export type baseOptions = Record<string, any>


/**
 * 通用合成管线处理接口,单通道
 */
export interface GeneralSynthesisPipelineStep {
    execute(data: PipelineData, options: baseOptions): Promise<PipelineData>
}

/**
 * 通用合成管线处理接口,多通道
 */
export interface GeneralSynthesisPipelineStepMultiRecord {
    execute(data: PipelineDataMultiRecord, options: baseOptions): Promise<PipelineDataMultiRecord>
}

/**
 * 通用合成管线处理堆栈接口,需要可以序列化
 */
export interface GeneralSynthesisPipelineStepStack {
    steps: GeneralSynthesisPipelineStepMultiRecord[]
}