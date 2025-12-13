import { IndexDBFS } from '../infra/IndexDBFS.class';
import type { LUTItem } from './lutDb.types';
import { DB_NAME, DB_VERSION, STORE_NAME } from './LUTDB.constants';

const fs = new IndexDBFS(DB_NAME, [STORE_NAME], DB_VERSION);

// Functional implementation of LUTDB
// Eliminates unnecessary class wrapper

export async function init(): Promise<void> {
    // IndexDBFS 懒加载初始化，无需显式 init，保留该方法用于兼容性
    try {
        // 能够触发一次连接检查
        await fs.list(STORE_NAME);
    } catch (e) {
        console.error('Failed to init LUTDB FS', e);
        throw e;
    }
}

export async function addLUT(lut: LUTItem): Promise<void> {
    // 使用 lut.id 作为文件名
    await fs.write(`${STORE_NAME}/${lut.id}`, lut);
}

export async function getAllLUTs(): Promise<LUTItem[]> {
    const result = await fs.readdir<LUTItem>(STORE_NAME);
    // Sort by createdAt desc
    result.sort((a, b) => b.createdAt - a.createdAt);
    return result;
}

export async function deleteLUT(id: string): Promise<void> {
    await fs.delete(`${STORE_NAME}/${id}`);
}

export async function updateLUTThumbnail(id: string, thumbnail: string): Promise<void> {
    const lut = await fs.read<LUTItem>(`${STORE_NAME}/${id}`);
    if (!lut) {
        throw new Error('LUT not found');
    }
    lut.thumbnail = thumbnail;
    await fs.write(`${STORE_NAME}/${id}`, lut);
}


