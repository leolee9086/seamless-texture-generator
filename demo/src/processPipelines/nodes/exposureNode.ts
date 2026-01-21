import type { baseOptions } from './imports'
import type { NodeContext, Node } from './types'
import { GPU手动曝光调整 } from './imports'

/**
 * 曝光调整中间件 - GPU 版本
 * 直接在 GPUBuffer 上操作，避免 GPU↔CPU 往返传输
 */
export const exposureMiddleware: Node = {
    名称: '曝光调整',
    可接受输入: ['GPUBuffer'],
    输出格式: 'GPUBuffer',

    guard: (options: baseOptions) => {
        // 自动曝光暂不支持纯 GPU 路径，需要直方图计算
        // const hasExposureStrength = (options.exposureStrength && options.exposureStrength !== 1.0)

        // 手动曝光支持纯 GPU 路径
        const hasExposureManual = options.exposureManual && (
            options.exposureManual.exposure !== 1.0 ||
            options.exposureManual.contrast !== 1.0 ||
            options.exposureManual.gamma !== 1.0
        )

        return Boolean(hasExposureManual)
    },

    // GPU 节点不提供 cpuProcess，调度器会识别为 GPU 节点
    cpuProcess: undefined,

    process: async (context: NodeContext) => {
        const { options, pipelineData } = context
        const device = await context.getWebGPUDevice()
        const { exposureManual } = options

        if (!exposureManual) return

        // 类型检查：确保是 GPUBuffer
        if (!(pipelineData.buffer instanceof GPUBuffer)) {
            console.warn('曝光节点需要 GPUBuffer 输入')
            return
        }

        try {
            // 直接在 GPU 上处理，无需 GPU→CPU→GPU 往返
            const resultBuffer = await GPU手动曝光调整(
                device,
                pipelineData.buffer,
                pipelineData.width,
                pipelineData.height,
                exposureManual.exposure,
                exposureManual.contrast,
                exposureManual.gamma
            )

            // 销毁旧 buffer
            pipelineData.buffer.destroy()

            // 更新管线数据
            context.pipelineData = {
                buffer: resultBuffer,
                width: pipelineData.width,
                height: pipelineData.height
            }
        } catch (error) {
            console.warn('GPU曝光处理失败:', error)
        }
    }
}