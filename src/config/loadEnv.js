import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Must be imported before any module that reads process.env at top level
// (e.g. db.js), so that .env is loaded before the module graph evaluates it.
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });
