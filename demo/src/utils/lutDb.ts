import { createLUTDB } from './LUTDB.utils';
import { IndexDBFS } from './imports';
import { DB_NAME, DB_VERSION, STORE_NAME } from './LUTDB.constants';
import type * as lutDbTypes from './lutDb.types';
export type { lutDbTypes };

// Instantiate the file system adapter
const fs = new IndexDBFS(DB_NAME, [STORE_NAME], DB_VERSION);

// Export as object to mimic class instance, using dependency injection
export const lutDb = createLUTDB(fs);

