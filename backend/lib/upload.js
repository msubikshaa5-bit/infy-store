import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));

// backend/uploads: created automatically if it doesn't exist
export const UPLOAD_DIR = path.join(here, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });