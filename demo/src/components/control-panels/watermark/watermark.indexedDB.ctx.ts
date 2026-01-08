/**
 * 水印预设 IndexedDB 存储层
 */
import { IndexDBFS } from '../../../infra/IndexDBFS.class'
import { WATERMARK_DB } from './watermark.constants'
import type { 水印预设, 预设列表元数据 } from './watermark.types'

/** 文件系统实例 */
const fs = new IndexDBFS(
    WATERMARK_DB.DB_NAME,
    [WATERMARK_DB.PRESETS_STORE, WATERMARK_DB.LIST_STORE],
    WATERMARK_DB.VERSION
)

/**
 * 保存水印预设
 */
export async function 保存预设(预设: 水印预设): Promise<void> {
    await fs.write(`${WATERMARK_DB.PRESETS_STORE}/${预设.id}`, 预设)

    const ids = await 获取预设ID列表()
    if (!ids.includes(预设.id)) {
        await 保存预设ID列表([...ids, 预设.id])
    }
}

/**
 * 获取所有预设
 */
export async function 获取所有预设(): Promise<水印预设[]> {
    const ids = await 获取预设ID列表()
    const 预设列表: 水印预设[] = []

    for (const id of ids) {
        const 预设 = await 获取预设(id)
        if (预设) 预设列表.push(预设)
    }

    return 预设列表
}

/**
 * 获取单个预设
 */
export async function 获取预设(id: string): Promise<水印预设 | null> {
    return await fs.read<水印预设>(`${WATERMARK_DB.PRESETS_STORE}/${id}`)
}

/**
 * 删除预设
 */
export async function 删除预设(id: string): Promise<void> {
    await fs.delete(`${WATERMARK_DB.PRESETS_STORE}/${id}`)

    const ids = await 获取预设ID列表()
    await 保存预设ID列表(ids.filter(i => i !== id))
}

/** 获取预设 ID 列表 */
async function 获取预设ID列表(): Promise<string[]> {
    const meta = await fs.read<预设列表元数据>(
        `${WATERMARK_DB.LIST_STORE}/${WATERMARK_DB.LIST_ID}`
    )
    return meta?.预设IDs ?? []
}

/** 保存预设 ID 列表 */
async function 保存预设ID列表(ids: string[]): Promise<void> {
    const meta: 预设列表元数据 = { id: WATERMARK_DB.LIST_ID, 预设IDs: ids }
    await fs.write(`${WATERMARK_DB.LIST_STORE}/${WATERMARK_DB.LIST_ID}`, meta)
}
