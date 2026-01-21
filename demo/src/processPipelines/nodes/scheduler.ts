/**
 * 智能调度器
 * 识别连续 CPU 节点，合并传输以减少 GPU↔CPU 往返次数
 */
import type { Node, NodeContext } from './types'
import { 转换为ImageData, 转换为PipelineData } from './formatConverter'
import { 性能计时器 } from '../../utils/performance.utils'

/** @简洁函数 判断是否为可批处理的 CPU 节点 */
export function isCPUNode(node: Node): boolean {
    return node.输出格式 === 'ImageData' && node.cpuProcess !== undefined
}

/**
 * 将节点列表分组：连续的 CPU 节点归为一组
 */
export function 分组节点(节点列表: Node[]): Node[][] {
    const 分组结果: Node[][] = []
    let 当前组: Node[] = []
    let 上一个是CPU = false

    for (const 节点 of 节点列表) {
        const 是CPU = isCPUNode(节点)

        if (当前组.length === 0) {
            当前组.push(节点)
            上一个是CPU = 是CPU
            continue
        }

        if (是CPU === 上一个是CPU) {
            当前组.push(节点)
            continue
        }

        // 类型切换，保存当前组并开始新组
        分组结果.push(当前组)
        当前组 = [节点]
        上一个是CPU = 是CPU
    }

    if (当前组.length > 0) {
        分组结果.push(当前组)
    }

    return 分组结果
}

/**
 * 批量执行 CPU 节点
 * 只在批次开头做一次 GPU→CPU，批次结尾做一次 CPU→GPU
 */
export async function 执行CPU批处理(
    节点列表: Node[],
    context: NodeContext
): Promise<void> {
    const { pipelineData, options } = context
    const device = await context.getWebGPUDevice()

    性能计时器.开始('CPU批处理总耗时')

    // 1. GPU → CPU (只做一次)
    性能计时器.开始('GPU→CPU传输')
    let imageData = await 转换为ImageData(pipelineData, device)
    const gpuToCpu耗时 = 性能计时器.结束('GPU→CPU传输', false)

    // 2. 依次执行所有 CPU 处理
    const 节点耗时列表: Array<{ 名称: string; 耗时: number }> = []

    for (const 节点 of 节点列表) {
        if (!节点.cpuProcess || !节点.guard(options)) continue

        const 节点名 = 节点.名称 ?? '未命名节点'
        性能计时器.开始(节点名)
        imageData = await 节点.cpuProcess(imageData, options)
        const 耗时 = 性能计时器.结束(节点名, false)
        节点耗时列表.push({ 名称: 节点名, 耗时 })
    }

    // 3. CPU → GPU (只做一次)
    性能计时器.开始('CPU→GPU传输')
    const newPipelineData = await 转换为PipelineData(imageData, device)
    const cpuToGpu耗时 = 性能计时器.结束('CPU→GPU传输', false)

    // 销毁旧 buffer
    pipelineData.buffer.destroy()

    // 更新上下文
    context.pipelineData = newPipelineData

    const 总耗时 = 性能计时器.结束('CPU批处理总耗时', false)

    // 输出性能报告
    console.warn(`[管线优化] CPU 批处理完成 (${总耗时.toFixed(1)}ms)`)
    console.warn(`  ├─ GPU→CPU: ${gpuToCpu耗时.toFixed(1)}ms`)
    节点耗时列表.forEach((item, idx) => {
        const 是最后一个 = idx === 节点耗时列表.length - 1 && cpuToGpu耗时 === 0
        const 前缀 = 是最后一个 ? '└─' : '├─'
        console.warn(`  ${前缀} ${item.名称}: ${item.耗时.toFixed(1)}ms`)
    })
    console.warn(`  └─ CPU→GPU: ${cpuToGpu耗时.toFixed(1)}ms`)
}

/**
 * 执行单个或一组节点
 */
async function 执行节点组(
    节点组: Node[],
    context: NodeContext
): Promise<void> {
    const 第一个节点 = 节点组[0]

    if (isCPUNode(第一个节点)) {
        await 执行CPU批处理(节点组, context)
        return
    }

    // 非 CPU 节点，逐个执行
    for (const 节点 of 节点组) {
        if (!节点.guard(context.options)) continue

        const 节点名 = 节点.名称 ?? '未命名GPU节点'
        性能计时器.开始(节点名)
        await 节点.process(context)
        const 耗时 = 性能计时器.结束(节点名, false)
        console.warn(`[GPU节点] ${节点名}: ${耗时.toFixed(1)}ms`)
    }
}

/**
 * 智能执行节点列表
 * 自动识别连续 CPU 节点并合并传输
 */
export async function 智能执行节点(
    节点列表: Node[],
    context: NodeContext
): Promise<void> {
    const 启用的节点 = 节点列表.filter(节点 => 节点.guard(context.options))

    if (启用的节点.length === 0) {
        return
    }

    const 节点分组 = 分组节点(启用的节点)

    console.warn(`[管线调度] ${启用的节点.length} 个节点 → ${节点分组.length} 组`)

    性能计时器.开始('管线总耗时')

    for (let i = 0; i < 节点分组.length; i++) {
        const 当前组 = 节点分组[i]
        await 执行节点组(当前组, context)
    }

    const 总耗时 = 性能计时器.结束('管线总耗时', false)
    console.warn(`[管线调度] 全部完成: ${总耗时.toFixed(1)}ms`)
}

