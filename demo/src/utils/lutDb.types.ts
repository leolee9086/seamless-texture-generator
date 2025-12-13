export interface LUTItem {
    id: string;
    name: string;
    file: Blob;
    thumbnail?: string;
    createdAt: number;
}

// 定义 LUTDB 接口类型，提供明确的类型安全
export interface LUTDB {
    init(): Promise<void>;
    addLUT(lut: LUTItem): Promise<void>;
    getAllLUTs(): Promise<LUTItem[]>;
    deleteLUT(id: string): Promise<void>;
    updateLUTThumbnail(id: string, thumbnail: string): Promise<void>;
}

// For backward compatibility if someone used `new LUTDB()` (unlikely given it was a singleton usage pattern, but defining the type is good)
export type LUTDBType = LUTDB;
