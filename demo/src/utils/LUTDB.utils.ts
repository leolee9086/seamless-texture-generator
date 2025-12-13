import type { IndexDBFS } from './imports';
import type { LUTItem, LUTDB } from './lutDb.types';
import { STORE_NAME, buildLutPath } from './LUTDB.constants';

//@AIDONE: fs对接适配器应该作为参数由调用方传入，而不是在模块内硬编码
export function createLUTDB(fs: IndexDBFS): LUTDB {

    async function init(): Promise<void> {
        // IndexDBFS 懒加载初始化，无需显式 init，保留该方法用于兼容性
        try {
            // 能够触发一次连接检查
            await fs.list(STORE_NAME);
        } catch (error) {
            console.error('Failed to init LUTDB FS', error);
            throw error;
        }
    }

    async function addLUT(lut: LUTItem): Promise<void> {
        // 使用 lut.id 作为文件名
        await fs.write(buildLutPath(lut.id), lut);
    }

    async function getAllLUTs(): Promise<LUTItem[]> {
        const result = await fs.readdir<LUTItem>(STORE_NAME);
        // Sort by createdAt desc
        result.sort((itemA, itemB) => itemB.createdAt - itemA.createdAt);
        return result;
    }

    async function deleteLUT(id: string): Promise<void> {
        await fs.delete(buildLutPath(id));
    }

    async function updateLUTThumbnail(id: string, thumbnail: string): Promise<void> {
        const lut = await fs.read<LUTItem>(buildLutPath(id));
        if (!lut) {
            throw new Error('LUT not found');
        }
        lut.thumbnail = thumbnail;
        await fs.write(buildLutPath(id), lut);
    }

    return {
        init,
        addLUT,
        getAllLUTs,
        deleteLUT,
        updateLUTThumbnail
    };
}


