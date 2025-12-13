import type * as LUTDBUtils from './LUTDB.utils';

export interface LUTItem {
    id: string;
    name: string;
    file: Blob;
    thumbnail?: string;
    createdAt: number;
}

// For backward compatibility if someone used `new LUTDB()` (unlikely given it was a singleton usage pattern, but defining the type is good)
export type LUTDBType = {
    [K in keyof typeof LUTDBUtils]: ReturnType<typeof LUTDBUtils[K]>;
};
