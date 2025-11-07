import { executeCode } from './docker_runner.js';

/**
 * Handles the incoming POST request to run code.
 */
export async function runCodeHandler(req, res) {
    const { code, language, input } = req.body;

    if (!code || !language) {
        return res.status(400).json({ error: 'Missing required fields: code and language.' });
    }

    const supportedLanguages = ['javascript', 'python'];
    if (!supportedLanguages.includes(language.toLowerCase())) {
        return res.status(400).json({ error: `Language '${language}' is not supported.` });
    }

    console.log(`[Controller] Received execution request for: ${language}`);

    try {
        const result = await executeCode(code, language, input || '');

        return res.status(200).json({
            status: result.status,
            output: result.output,
            error: result.error,
            executionTimeMs: result.executionTimeMs,
            message: result.message
        });

    } catch (err) {
        console.error(`[Controller] Internal Error during execution:`, err);
        return res.status(500).json({
            status: 'Internal Error',
            error: 'An unexpected server error occurred during code execution.'
        });
    }
}
