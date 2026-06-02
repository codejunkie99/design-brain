import { execFile } from "child_process";
import { promisify } from "util";
import { app } from "electron";
import path from "path";
import fs from "fs/promises";

const execFileAsync = promisify(execFile);

const SETTINGS_PATH = path.join(app.getPath("userData"), "settings.json");

export async function getDesignBrainRoot(): Promise<string | null> {
  try {
    const data = await fs.readFile(SETTINGS_PATH, "utf-8");
    const settings = JSON.parse(data);
    return settings.root || null;
  } catch {
    return null;
  }
}

export async function setDesignBrainRoot(root: string): Promise<void> {
  const dir = path.dirname(SETTINGS_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(SETTINGS_PATH, JSON.stringify({ root }), "utf-8");
}

export async function runCli(args: string[], cwd?: string): Promise<string> {
  const root = cwd || (await getDesignBrainRoot());
  if (!root) throw new Error("No design-brain root configured. Set it in Settings.");

  try {
    const { stdout } = await execFileAsync("npx", ["design-brain-memory", ...args], {
      cwd: root,
      timeout: 60000,
      env: { ...process.env, NODE_NO_WARNINGS: "1" },
    });
    return stdout.trim();
  } catch (err: unknown) {
    const error = err as { stderr?: string; message?: string };
    throw new Error(error.stderr || error.message || "CLI command failed");
  }
}

export async function readJsonFile(filePath: string): Promise<unknown> {
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}

export async function listMarkdownFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => path.join(dir, e.name));
  } catch {
    return [];
  }
}

export async function readMarkdownNote(
  filePath: string,
): Promise<{ frontmatter: Record<string, unknown>; content: string }> {
  const raw = await fs.readFile(filePath, "utf-8");
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) return { frontmatter: {}, content: raw };

  const frontmatter: Record<string, unknown> = {};
  for (const line of fmMatch[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) {
      frontmatter[key.trim()] = rest.join(":").trim();
    }
  }
  return { frontmatter, content: fmMatch[2] };
}
