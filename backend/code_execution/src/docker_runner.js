import Docker from 'dockerode';
import { writeFile, unlink, readFile } from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import tar from 'tar-stream';
import { Writable } from 'stream';

const docker = new Docker();
const MAX_TIMEOUT_MS = 5000;
const CONTAINER_WORKDIR = '/tmp/run';
const CODE_FILENAME = 'solution'; // name of file in docker container
const INPUT_FILENAME = 'input.txt';
const LANGUAGE_CONFIG = {
    javascript: {
        image: 'peerprep/js-sandbox:latest',
        command: 'node',
        extension: '.js',
    },
    python: {
        image: 'peerprep/py-sandbox:latest',
        command: 'python3',
        extension: '.py',
    },
};

/**
 * Executes the user's code using Docker's copy and exec APIs.
 */
export async function executeCode(code, language, input) {
    const config = LANGUAGE_CONFIG[language.toLowerCase()];
    const fileId = crypto.randomUUID();
    const tempDir = os.tmpdir();

    const codeFilePath = path.join(tempDir, `${fileId}${config.extension}`);
    const inputFilePath = path.join(tempDir, `${fileId}${INPUT_FILENAME}`);

    const containerCodePath = `${CONTAINER_WORKDIR}/${CODE_FILENAME}${config.extension}`;
    const containerInputPath = `${CONTAINER_WORKDIR}/${INPUT_FILENAME}`;

    let startTime;
    let container;
    let cleanupFiles = [codeFilePath, inputFilePath];

    let result = {
        status: 'Failure',
        output: '',
        error: '',
        executionTimeMs: 0,
        message: ''
    };

    try {
        await writeFile(codeFilePath, code);
        await writeFile(inputFilePath, input || '');

        startTime = process.hrtime.bigint();
        const containerConfig = {
            Image: config.image,
            Cmd: ['tail', '-f', '/dev/null'],
            Tty: false,
            HostConfig: {
                NetworkMode: 'none',
                Memory: 256 * 1024 * 1024,
                CpuShares: 1024,
                AutoRemove: true,
            },
        };
        container = await docker.createContainer(containerConfig);
        await container.start();

        await copyFileToContainer(container, codeFilePath, CONTAINER_WORKDIR, CODE_FILENAME + config.extension);
        await copyFileToContainer(container, inputFilePath, CONTAINER_WORKDIR, INPUT_FILENAME);

        const shellCommand = `/bin/sh -c "${config.command} ${containerCodePath} < ${containerInputPath}"`;
        const execCommand = ['/bin/sh', '-c', shellCommand];

        const { stdout, stderr, exitCode } = await executeCommandInContainer({
            container,
            command: execCommand,
            timeout: MAX_TIMEOUT_MS
        });

        // kill the container after execution
        await container.kill().catch(() => { });

        const endTime = process.hrtime.bigint();
        result.executionTimeMs = Number(endTime - startTime) / 1000000;
        result.output = stdout;

        if (exitCode !== 0) {
            result.status = 'Runtime Error';
            result.error = stderr || stdout;
            result.message = `Code failed with exit code ${exitCode} after ${result.executionTimeMs.toFixed(2)}ms.`;
        } else {
            result.status = 'Success';
            result.message = `Execution successful in ${result.executionTimeMs.toFixed(2)}ms.`;
        }


    } catch (error) {
        const endTime = process.hrtime.bigint();
        if (startTime) {
            result.executionTimeMs = Number(endTime - startTime) / 1000000;
        } else {
            result.executionTimeMs = 0;
        }

        if (error.message === 'TIMEOUT_EXCEEDED') {
            result.status = 'Time Limit Exceeded';
            result.error = `Execution exceeded the maximum limit of ${MAX_TIMEOUT_MS / 1000} seconds.`;
            result.message = 'The container was killed (TLE). Check for infinite loops.';
        } else {
            result.status = 'Setup/Docker Error';
            result.error = error.message;
            result.message = `Failed to execute code. Details: ${error.message}`;
        }
    } finally {
        // stop the container if the code execution times out or errors out
        if (container) {
            await container.stop().catch(() => {});
        }
        for (const fPath of cleanupFiles) {
             await unlink(fPath).catch(e => console.error(`Failed to clean up file ${fPath}:`, e));
        }
    }
    return result;
}

/**
 * Utility function to create a tar stream and upload a file to a container.
 */
async function copyFileToContainer(container, sourcePath, destinationDir, fileName) {
    const pack = tar.pack();
    const fileContent = await readFile(sourcePath);
    pack.entry({ name: fileName }, fileContent);
    pack.finalize();
    await container.putArchive(pack, { path: destinationDir });
}

/**
 * Utility function to execute a command inside a running container with a timeout.
 */
async function executeCommandInContainer({ container, command, timeout }) {
    let stdout = '';
    let stderr = '';

    const execConfig = {
        Cmd: command,
        AttachStdout: true,
        AttachStderr: true,
    };

    const execInstance = await container.exec(execConfig);

    const stream = await execInstance.start({ detach: false, Tty: false });

    const streamPromise = new Promise((resolve) => {
        docker.modem.demuxStream(stream,
            new Writable({
                write(chunk, encoding, callback) {
                    stdout += chunk.toString();
                    callback();
                }
            }),
            new Writable({
                write(chunk, encoding, callback) {
                    stderr += chunk.toString();
                    callback();
                }
            })
        );

        stream.on('end', async () => {
            const inspect = await execInstance.inspect();
            resolve({ stdout, stderr, exitCode: inspect.ExitCode });
        });
    });

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(async () => {
            await container.kill().catch(() => { });
            reject(new Error('TIMEOUT_EXCEEDED'));
        }, timeout);
    });

    return Promise.race([streamPromise, timeoutPromise]);
}