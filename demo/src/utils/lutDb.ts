import * as LUTDBFunctions from './LUTDB.class';

export * from './lutDb.types';
// Export as object to mimic class instance
export const lutDb = {
    ...LUTDBFunctions
};

// For backward compatibility if someone used `new LUTDB()` (unlikely given it was a singleton usage pattern, but defining the type is good)
export type LUTDBType = typeof lutDb;

