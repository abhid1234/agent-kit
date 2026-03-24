// tests/cli.test.ts
import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const cliPath = path.join(projectRoot, 'dist', 'cli.js');

const tmpDir = path.resolve(projectRoot, 'tests/_tmp_cli');

function cleanup(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

afterEach(() => {
  cleanup(tmpDir);
});

function runCli(args: string, cwd: string): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execSync(`node ${cliPath} ${args}`, {
      cwd,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
      exitCode: error.status ?? 1,
    };
  }
}

describe('CLI: agent-kit init', () => {
  it('creates the project directory', () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const result = runCli(`init test-project`, tmpDir);
    expect(result.exitCode).toBe(0);
    expect(fs.existsSync(path.join(tmpDir, 'test-project'))).toBe(true);
  });

  it('scaffolds package.json with correct content', () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    runCli(`init test-project`, tmpDir);

    const pkgPath = path.join(tmpDir, 'test-project', 'package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.name).toBe('test-project');
    expect(pkg.type).toBe('module');
    expect(pkg.scripts?.start).toBe('npx tsx agent.ts');
    expect(pkg.dependencies?.['@avee1234/agent-kit']).toBe('^0.2.0');
    expect(pkg.devDependencies?.tsx).toBe('^4.0.0');
  });

  it('scaffolds agent.ts with correct content', () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    runCli(`init test-project`, tmpDir);

    const agentPath = path.join(tmpDir, 'test-project', 'agent.ts');
    expect(fs.existsSync(agentPath)).toBe(true);

    const content = fs.readFileSync(agentPath, 'utf8');
    expect(content).toContain("import { Agent, Tool, Memory } from '@avee1234/agent-kit'");
    expect(content).toContain('Tool.create(');
    expect(content).toContain("new Memory({ store: 'sqlite'");
    expect(content).toContain('agent.chat(');
  });

  it('scaffolds README.md with project name and quickstart', () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    runCli(`init test-project`, tmpDir);

    const readmePath = path.join(tmpDir, 'test-project', 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);

    const content = fs.readFileSync(readmePath, 'utf8');
    expect(content).toContain('# test-project');
    expect(content).toContain('npm install');
    expect(content).toContain('npm start');
  });

  it('defaults project name to my-agent when not provided', () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    runCli(`init`, tmpDir);

    expect(fs.existsSync(path.join(tmpDir, 'my-agent'))).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(path.join(tmpDir, 'my-agent', 'package.json'), 'utf8'));
    expect(pkg.name).toBe('my-agent');
  });

  it('exits with error if directory already exists', () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'existing-project'));

    const result = runCli(`init existing-project`, tmpDir);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('already exists');
  });

  it('prints success message with next steps', () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const result = runCli(`init test-project`, tmpDir);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('test-project');
    expect(result.stdout).toContain('npm install');
    expect(result.stdout).toContain('npm start');
  });
});
