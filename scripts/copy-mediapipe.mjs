// Copia o runtime WASM do MediaPipe para public/mediapipe/wasm, servido pelo próprio app
// (plan.md, porta 9). O modelo .tflite fica versionado em public/mediapipe/.
import { cpSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const pkgDir = join(process.cwd(), "node_modules", "@mediapipe", "tasks-vision");
const target = join(process.cwd(), "public", "mediapipe", "wasm");

mkdirSync(target, { recursive: true });
cpSync(join(pkgDir, "wasm"), target, { recursive: true });
console.log(`mediapipe wasm -> ${target}`);
