/**
 * 性能测量与记录工具集
 * 用于函数性能监控、执行时间测量和性能分析
 */

/** 性能记录数据结构 */
export interface 性能数据 {
    名称: string
    调用次数: number
    累计耗时: number
    平均耗时: number
    最短耗时: number
    最长耗时: number
    最近耗时: number
}

/** 测量结果 */
export interface 测量结果<T> {
    结果: T
    耗时: number
    成功: true
}

export interface 测量失败 {
    错误: unknown
    耗时: number
    成功: false
}

/** 性能比较结果 */
export interface 比较结果 {
    名称: string
    平均耗时: number
    最短耗时: number
    最长耗时: number
    累计耗时: number
    迭代次数: number
}

// 存储函数性能记录
const 性能记录表 = new Map<Function, 性能数据>()

/**
 * 包装函数以记录其执行性能
 * @简洁函数 这是一个高阶函数工厂
 */
export function 性能包装<T extends (...args: Parameters<T>) => ReturnType<T>>(
    fn: T
): T {
    const 包装函数 = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
        const 开始时间 = performance.now()
        const 结果 = fn.apply(this, args)

        const 记录性能 = () => {
            const 结束时间 = performance.now()
            const 耗时 = 结束时间 - 开始时间
            const 函数名 = fn.name || '匿名函数'

            const 现有数据 = 性能记录表.get(fn)
            if (现有数据) {
                现有数据.调用次数 += 1
                现有数据.累计耗时 += 耗时
                现有数据.平均耗时 = 现有数据.累计耗时 / 现有数据.调用次数
                现有数据.最近耗时 = 耗时
                现有数据.最短耗时 = Math.min(现有数据.最短耗时, 耗时)
                现有数据.最长耗时 = Math.max(现有数据.最长耗时, 耗时)
            } else {
                性能记录表.set(fn, {
                    名称: 函数名,
                    调用次数: 1,
                    累计耗时: 耗时,
                    平均耗时: 耗时,
                    最短耗时: 耗时,
                    最长耗时: 耗时,
                    最近耗时: 耗时
                })
            }

            console.warn(`[性能] ${函数名} 耗时 ${耗时.toFixed(2)}ms`)
        }

        // 处理 Promise
        if (结果 instanceof Promise) {
            return 结果.then(res => {
                记录性能()
                return res
            }).catch(err => {
                记录性能()
                throw err
            }) as ReturnType<T>
        }

        记录性能()
        return 结果
    }

    return 包装函数 as T
}

/**
 * 测量函数执行时间（同步）
 */
export function 测量执行时间<T>(fn: () => T): 测量结果<T> | 测量失败 {
    const 开始时间 = performance.now()

    try {
        const 结果 = fn()
        const 耗时 = performance.now() - 开始时间
        return { 结果, 耗时, 成功: true }
    } catch (错误) {
        const 耗时 = performance.now() - 开始时间
        return { 错误, 耗时, 成功: false }
    }
}

/**
 * 测量异步函数执行时间
 */
export async function 测量异步执行时间<T>(fn: () => Promise<T>): Promise<测量结果<T> | 测量失败> {
    const 开始时间 = performance.now()

    try {
        const 结果 = await fn()
        const 耗时 = performance.now() - 开始时间
        return { 结果, 耗时, 成功: true }
    } catch (错误) {
        const 耗时 = performance.now() - 开始时间
        return { 错误, 耗时, 成功: false }
    }
}

/**
 * 获取函数性能统计数据
 */
export function 获取性能统计(fn?: Function): 性能数据 | Map<Function, 性能数据> | undefined {
    if (fn) {
        return 性能记录表.get(fn)
    }
    return 性能记录表
}

/**
 * 清除性能统计数据
 */
export function 清除性能统计(fn?: Function): void {
    if (fn) {
        性能记录表.delete(fn)
        return
    }
    性能记录表.clear()
}

/**
 * 性能计时器，用于手动测量代码块性能
 */
export const 性能计时器 = {
    计时器: new Map<string, number>(),

    开始(标签: string): void {
        this.计时器.set(标签, performance.now())
    },

    结束(标签: string, 输出日志 = true): number {
        const 开始时间 = this.计时器.get(标签)
        if (开始时间 === undefined) {
            console.warn(`计时器 "${标签}" 未启动`)
            return 0
        }

        const 耗时 = performance.now() - 开始时间
        this.计时器.delete(标签)

        if (输出日志) {
            console.warn(`[计时器] ${标签} 耗时: ${耗时.toFixed(2)}ms`)
        }

        return 耗时
    }
}

/**
 * 比较多个函数性能
 */
export function 比较性能<T>(配置: {
    函数列表: Array<() => T>
    迭代次数?: number
}): 比较结果[] {
    const { 函数列表, 迭代次数 = 100 } = 配置
    const 结果列表: 比较结果[] = []

    for (const fn of 函数列表) {
        const 名称 = fn.name || '匿名函数'
        let 累计耗时 = 0
        let 最短耗时 = Infinity
        let 最长耗时 = 0

        for (let i = 0; i < 迭代次数; i++) {
            const 测量 = 测量执行时间(fn)
            累计耗时 += 测量.耗时
            最短耗时 = Math.min(最短耗时, 测量.耗时)
            最长耗时 = Math.max(最长耗时, 测量.耗时)
        }

        结果列表.push({
            名称,
            平均耗时: 累计耗时 / 迭代次数,
            最短耗时,
            最长耗时,
            累计耗时,
            迭代次数
        })
    }

    return 结果列表.sort((a, b) => a.平均耗时 - b.平均耗时)
}

// 英文别名导出
export {
    性能包装 as withPerformanceLogging,
    测量执行时间 as measureExecutionTime,
    测量异步执行时间 as measureAsyncExecutionTime,
    获取性能统计 as getPerformanceStats,
    清除性能统计 as clearPerformanceStats,
    性能计时器 as performanceTimer,
    比较性能 as comparePerformance
}
