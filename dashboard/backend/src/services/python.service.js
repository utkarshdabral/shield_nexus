import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Execute a Python script and return the result
 * @param {string} scriptPath - Path to Python script
 * @param {Array} args - Command line arguments
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} - Parsed JSON output
 */
export async function executePython(scriptPath, args = [], options = {}) {
    const {
        timeout = 300000, // 5 minutes default
        cwd = join(__dirname, '../../python'),
        pythonPath = 'python3'
    } = options;

    return new Promise((resolve, reject) => {
        const fullScriptPath = scriptPath.startsWith('/')
            ? scriptPath
            : join(cwd, scriptPath);

        console.log(`Executing Python: ${pythonPath} ${fullScriptPath} ${args.join(' ')}`);

        const process = spawn(pythonPath, [fullScriptPath, ...args], {
            cwd,
            timeout,
            env: { ...process.env, PYTHONUNBUFFERED: '1' }
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
            // Log progress messages
            if (data.toString().includes('[PROGRESS]')) {
                console.log(data.toString().trim());
            }
        });

        process.on('close', (code) => {
            if (code !== 0) {
                const error = new Error(`Python script exited with code ${code}`);
                error.code = 'PYTHON_ERROR';
                error.stderr = stderr;
                error.stdout = stdout;
                return reject(error);
            }

            try {
                // Try to parse JSON output
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (parseError) {
                // If not JSON, return raw output
                resolve({
                    success: true,
                    output: stdout,
                    stderr: stderr
                });
            }
        });

        process.on('error', (err) => {
            err.code = 'PYTHON_ERROR';
            reject(err);
        });
    });
}

/**
 * Execute Python with JSON input via stdin
 * @param {string} scriptPath - Path to Python script
 * @param {Object} inputData - Data to send via stdin
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} - Parsed JSON output
 */
export async function executePythonWithInput(scriptPath, inputData, options = {}) {
    const {
        timeout = 300000,
        cwd = join(__dirname, '../../python'),
        pythonPath = 'python3'
    } = options;

    return new Promise((resolve, reject) => {
        const fullScriptPath = scriptPath.startsWith('/')
            ? scriptPath
            : join(cwd, scriptPath);

        const process = spawn(pythonPath, [fullScriptPath], {
            cwd,
            timeout,
            env: { ...process.env, PYTHONUNBUFFERED: '1' }
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        process.on('close', (code) => {
            if (code !== 0) {
                const error = new Error(`Python script exited with code ${code}`);
                error.code = 'PYTHON_ERROR';
                error.stderr = stderr;
                return reject(error);
            }

            try {
                const result = JSON.parse(stdout);
                resolve(result);
            } catch (parseError) {
                resolve({ success: true, output: stdout });
            }
        });

        process.on('error', (err) => {
            err.code = 'PYTHON_ERROR';
            reject(err);
        });

        // Send input data
        process.stdin.write(JSON.stringify(inputData));
        process.stdin.end();
    });
}
