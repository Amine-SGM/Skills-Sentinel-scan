import React from 'react';
import { ScanResult, Finding } from '../utils/api';

interface ResultsDashboardProps {
    result: ScanResult | null;
}

export default function ResultsDashboard({ result }: ResultsDashboardProps) {
    if (!result) return null;

    // Calculate score: 100 start, -10 for HIGH, -5 for MEDIUM, -2 for LOW
    const score = Math.max(0, 100 - result.reduce((acc, finding) => {
        const sev = finding.severity.toUpperCase();
        if (sev === 'HIGH' || sev === 'ERROR') return acc + 10;
        if (sev === 'MEDIUM' || sev === 'WARNING') return acc + 5;
        return acc + 2;
    }, 0));

    const getScoreColor = (s: number) => {
        if (s >= 90) return "text-green-600";
        if (s >= 70) return "text-yellow-600";
        return "text-red-600";
    };

    const getSeverityColor = (severity: string) => {
        switch (severity.toUpperCase()) {
            case "ERROR": return "bg-red-100 text-red-800 border-red-200";
            case "HIGH": return "bg-red-100 text-red-800 border-red-200";
            case "WARNING": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "MEDIUM": return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "LOW": return "bg-blue-100 text-blue-800 border-blue-200";
            default: return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-8">
            <div className="bg-white shadow rounded-lg p-6 mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Security Score</h2>
                <div className={`text-6xl font-extrabold ${getScoreColor(score)}`}>
                    {score}
                </div>
                <p className="text-gray-500 mt-2">out of 100</p>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">Findings ({result.length})</h3>
                </div>

                {result.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No security issues found! 🎉
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {result.map((finding, index) => (
                            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(finding.severity)}`}>
                                            {finding.severity}
                                        </span>
                                        <span className="font-semibold text-gray-700">{finding.check_id}</span>
                                    </div>
                                    {(finding.file || finding.line) && (
                                        <span className="text-sm text-gray-500 font-mono">
                                            {finding.file}:{finding.line}
                                        </span>
                                    )}
                                </div>
                                <p className="text-gray-800 font-medium mb-2">{finding.message}</p>
                                {finding.details && (
                                    <pre className="mt-2 bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                                        {finding.details}
                                    </pre>
                                )}
                                {finding.code && (
                                    <pre className="mt-2 bg-gray-100 text-gray-800 p-3 rounded text-sm overflow-x-auto border border-gray-300">
                                        {finding.code}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
