/**
 * 水印设置组件的逻辑上下文
 */
import { ref, onMounted } from 'vue'
import { 默认水印配置 } from './watermark.constants'
import { 保存预设, 获取所有预设, 删除预设 } from './watermark.indexedDB.ctx'
import type { 水印配置, 水印预设 } from './watermark.types'

/** 生成唯一 ID */
function 生成ID(): string {
    return `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** 创建水印设置状态 */
export function 使用水印设置() {
    const 当前配置 = ref<水印配置>({ ...默认水印配置 })
    const 预设列表 = ref<水印预设[]>([])
    const 正在加载 = ref(false)

    /** 加载预设列表 */
    async function 加载预设() {
        正在加载.value = true
        try {
            预设列表.value = await 获取所有预设()
        } finally {
            正在加载.value = false
        }
    }

    /** 保存当前配置为预设 */
    async function 保存当前配置(名称: string) {
        const 新预设: 水印预设 = {
            id: 生成ID(),
            名称,
            配置: { ...当前配置.value },
            创建时间: Date.now()
        }
        await 保存预设(新预设)
        await 加载预设()
    }

    /** 应用预设 */
    function 应用预设(预设: 水印预设) {
        当前配置.value = { ...预设.配置 }
    }

    /** 删除指定预设 */
    async function 删除指定预设(id: string) {
        await 删除预设(id)
        await 加载预设()
    }

    /** 重置为默认配置 */
    function 重置配置() {
        当前配置.value = { ...默认水印配置 }
    }

    onMounted(加载预设)

    return {
        当前配置,
        预设列表,
        正在加载,
        保存当前配置,
        应用预设,
        删除指定预设,
        重置配置
    }
}
