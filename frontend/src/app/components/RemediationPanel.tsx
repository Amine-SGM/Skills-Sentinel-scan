import React, { useState } from 'react';
import { Finding, remediateSkill } from '../utils/api';

interface RemediationPanelProps {
    findings: Finding[];
    scanSource: string | File;
}

export default function RemediationPanel({ findings, scanSource }: RemediationPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [provider, setProvider] = useState('openai');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('gpt-3.5-turbo');
    const [isFixing, setIsFixing] = useState(false);
    const [fixedCode, setFixedCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRemediate = async () => {
        setIsFixing(true);
        setError(null);
        setFixedCode(null);

        try {
            // For now, we assume we just pass a placeholder "code" or logic to fetch it.
            // Since we don't have the full code in the frontend easily (unless it was a file we uploaded),
            // and the backend scan result didn't return the full source code (it returned findings),
            // we might need to send a request to get the code or passing the findings is enough if the backend kept state?
            // BUT: The backend is stateless (mostly).
            // A robust solution would have the backend actually return the remediated code based on the scan_id if it cached it,
            // or we send the file content again?

            // Simplified: We will ask the backend to remediate the "code" associated with the findings.
            // But wait, the backend `remediate` endpoint expects `code` string in the body.
            // If we uploaded a file, we (frontend) have it. If it was a URL, we don't necessarily have the content unless we fetch it.

            let codeContent = "";
            if (scanSource instanceof File) {
                codeContent = await scanSource.text();
            } else {
                // It was a URL. We might simply pass the URL and let the backend re-fetch?
                // The current `remediate` endpoint expects `code: str`.
                // Let's assume for this MVP we only remediate if we have the FILE content accessible,
                // OR we update backend to accept URL for remediation too.
                // For now, prompt the user that URL remediation isn't fully supported in this UI step 
                // without fetching the code first.
                // Hack: Just send "Please fix the code at this URL: " + scanSource
                codeContent = `Source Code URL: ${scanSource}`;
            }

            const result = await remediateSkill({
                findings,
                code: codeContent,
                provider,
                api_key: apiKey,
                model
            });
            setFixedCode(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Remediation failed');
        } finally {
            setIsFixing(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 bg-white shadow rounded-lg overflow-hidden border border-blue-100">
            <div
                className="bg-blue-50 p-4 flex justify-between items-center cursor-pointer hover:bg-blue-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <h3 className="font-bold text-blue-800">AI Remediation Assistant</h3>
                </div>
                <svg className={`w-5 h-5 text-blue-600 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="p-6 border-t border-blue-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">AI Provider</label>
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            >
                                <option value="openai">OpenAI</option>
                                <option value="openrouter">OpenRouter</option>
                                <option value="ai_studio">Google AI Studio (Gemini)</option>
                                <option value="pollinations">Pollinations.AI</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                placeholder="e.g., gpt-4, gemini-pro"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                        <input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                            placeholder={provider === 'pollinations' ? 'Optional for Pollinations' : 'sk- or key'}
                        />
                    </div>

                    <button
                        onClick={handleRemediate}
                        disabled={isFixing}
                        className="w-full inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {isFixing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Fixing Code...
                            </>
                        ) : (
                            "Generate Secure Code"
                        )}
                    </button>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">
                            {error}
                        </div>
                    )}

                    {fixedCode && (
                        <div className="mt-6">
                            <h4 className="text-md font-bold text-gray-800 mb-2">Secure Version</h4>
                            <div className="bg-gray-900 rounded-lg overflow-hidden relative">
                                <div className="absolute top-2 right-2">
                                    <button
                                        className="text-xs bg-gray-700 text-white px-2 py-1 rounded hover:bg-gray-600"
                                        onClick={() => navigator.clipboard.writeText(fixedCode)}
                                    >
                                        Copy
                                    </button>
                                </div>
                                <pre className="p-4 text-gray-100 text-sm overflow-x-auto">
                                    {fixedCode}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
