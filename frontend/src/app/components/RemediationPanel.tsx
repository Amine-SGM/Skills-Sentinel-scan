import React, { useState } from 'react';
import { Finding, remediateSkill } from '../utils/api';

interface RemediationPanelProps {
    findings: Finding[];
    scanSource: string | File;
    provider: string;
    apiKey: string;
    model: string;
}

export default function RemediationPanel({ findings, scanSource, provider, apiKey, model }: RemediationPanelProps) {
    const [isOpen, setIsOpen] = useState(true); // Default open when issues found
    const [isFixing, setIsFixing] = useState(false);
    const [fixedCode, setFixedCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRemediate = async () => {
        setIsFixing(true);
        setError(null);
        setFixedCode(null);

        try {
            let codeContent = "";
            if (scanSource instanceof File) {
                codeContent = await scanSource.text();
            } else {
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
                    <p className="mb-4 text-sm text-gray-600">
                        Using provider: <span className="font-semibold">{provider}</span> ({model})
                    </p>

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
