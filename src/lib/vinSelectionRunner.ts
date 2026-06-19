import { execFile } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const API_ROOT = path.join(/* turbopackIgnore: true */ process.cwd(), "Avtobaks_API");

function inferPartsApiCat(partsText: string) {
  const normalized = partsText.toLowerCase();
  if (normalized.includes("воздуш") && normalized.includes("фильтр")) return "8";
  if (normalized.includes("масл") && normalized.includes("фильтр")) return "7";
  return "";
}

export async function runVinSelectionBackend(vin: string, partsText: string) {
  const pythonPath = process.env.VIN_SELECTOR_PYTHON
    ? path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.VIN_SELECTOR_PYTHON)
    : path.join(API_ROOT, ".venv", "Scripts", "python.exe");
  const scriptPath = path.join(API_ROOT, "vin_selection.py");

  try {
    await fs.access(pythonPath);
    await fs.access(scriptPath);
  } catch {
    return {
      ok: false,
      log: "VIN backend не запущен: не найден Python из Avtobaks_API/.venv или vin_selection.py",
    };
  }

  const args = [
    scriptPath,
    "--vin",
    vin,
    "--parts",
    partsText,
    "--use-partsapi-vin",
    "--partsapi-type",
    "oem",
    "--max-partsapi-parts",
    "3",
    "--limit-per-target",
    "1",
  ];
  const cat = inferPartsApiCat(partsText);
  if (cat) args.push("--partsapi-cat", cat);

  try {
    const result = await execFileAsync(pythonPath, args, {
      cwd: API_ROOT,
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 3,
    });
    return {
      ok: true,
      log: [result.stdout, result.stderr].filter(Boolean).join("\n").trim() || "VIN backend отработал без вывода",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      log: `VIN backend завершился с ошибкой: ${message}`,
    };
  }
}
