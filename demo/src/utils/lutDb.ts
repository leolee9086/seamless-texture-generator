import * as LUTDBFunctions from './LUTDB.utils';
import type * as LUTDBTypes from './lutDb.types';

export { LUTDBTypes };
// Export as object to mimic class instance
export const lutDb = {
    ...LUTDBFunctions
};

