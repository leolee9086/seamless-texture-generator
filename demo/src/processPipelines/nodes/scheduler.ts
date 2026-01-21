/**
 * 智能调度器
 * 识别连续 CPU 节点，合并传输以减少 GPU↔CPU 往返次数
 */
import type { Node, NodeContext } from './types'
import type { baseOptions } from './imports'
import { 转换为ImageData, 转换为PipelineData } from './formatConverter'

/**
 * 判断节点是否为 CPU 节点（有 cpuProcess 且输出 ImageData）
 */
export function isCPUNode(node: Node): boolean {
    return node.输出格式 === 'ImageData' && node.cpuProcess !== undefined
}

/**
 * 将节点列表分组：连续的 CPU 节点归为一组
 * 
 * 例如: [GPU1, CPU1, CPU2, CPU3, GPU2] => [[GPU1], [CPU1, CPU2, CPU3], [GPU2]]
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
        } else if (是CPU === 上一个是CPU) {
            // 同类型，加入当前组
            当前组.push(节点)
        } else {
            // 类型切换，保存当前组并开始新组
            分组结果.push(当前组)
            当前组 = [节点]
            上一个是CPU = 是CPU
        }
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

    console.log(`[管线优化] CPU 批处理开始: ${节点列表.length} 个节点`)

    // 1. GPU → CPU (只做一次)
    let imageData = await 转换为ImageData(pipelineData, device)

    // 2. 依次执行所有 CPU 处理
    for (const 节点 of 节点列表) {
        if (节点.cpuProcess && 节点.guard(options)) {
            const 节点名 = 节点.名称 ?? '未命名节点'
            console.log(`  [批处理] 执行: ${节点名}`)
            imageData = await 节点.cpuProcess(imageData, options)
        }
    }

    // 3. CPU → GPU (只做一次)
    const newPipelineData = await 转换为PipelineData(imageData, device)

    // 销毁旧 buffer
    pipelineData.buffer.destroy()

    // 更新上下文
    context.pipelineData = newPipelineData

    console.log(`[管线优化] CPU 批处理完成`)
}

/**
 * 执行单个或一组节点
 */
async function 执行节点组(
    节点组: Node[],
    context: NodeContext
): Promise<void> {
    const 第一个节点 = 节点组[0]

    // 检查是否全是 CPU 节点
    if (isCPUNode(第一个节点)) {
        // CPU 批处理
        await 执行CPU批处理(节点组, context)
    } else {
        // 非 CPU 节点，逐个执行
        for (const 节点 of 节点组) {
            if (节点.guard(context.options)) {
                await 节点.process(context)
            }
        }
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
    // 过滤出需要执行的节点
    const 启用的节点 = 节点列表.filter(n => n.guard(context.options))

    if (启用的节点.length === 0) {
        return
    }

    // 分组
    const 节点分组 = 分组节点(启用的节点)

    console.log(`[管线调度] 共 ${启用的节点.length} 个节点，分为 ${节点分组.length} 组`)

    // 执行每组
    for (let i = 0; i < 节点分组.length; i++) {
        const 组 = 节点分组[i]
        const 是CPU组 = isCPUNode(组[0])
        console.log(`[管线调度] 执行第 ${i + 1} 组: ${是CPU组 ? 'CPU' : 'GPU'} 节点 x${组.length}`)
        await 执行节点组(组, context)
    }
}
