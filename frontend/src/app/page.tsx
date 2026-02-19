'use client';

import React, { useState } from 'react';
import FileUpload from './components/FileUpload';
import ResultsDashboard from './components/ResultsDashboard';
import RemediationPanel from './components/RemediationPanel';
import SettingsPanel from './components/SettingsPanel';
import { ScanResult, scanSkill } from './utils/api';

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanSource, setScanSource] = useState<File | string | null>(null);

  // AI Settings State
  const [provider, setProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');

  const handleUpload = async (fileOrUrl: File | string) => {
    setIsScanning(true);
    setError(null);
    setResults(null);
    setScanSource(fileOrUrl);

    try {
      const data = await scanSkill(fileOrUrl);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scanning failed');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Skill Sentinel Scan
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Secure your AI skills and agents. Detect malicious patterns, supply chain risks, and overreach.
          </p>
        </div>

        <SettingsPanel
          provider={provider}
          setProvider={setProvider}
          apiKey={apiKey}
          setApiKey={setApiKey}
          model={model}
          setModel={setModel}
        />

        <FileUpload onUpload={handleUpload} isScanning={isScanning} />

        {error && (
          <div className="mt-8 max-w-4xl mx-auto bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {results && (
          <>
            <ResultsDashboard result={results} />
            {scanSource && results.some(r => ['ERROR', 'HIGH', 'MEDIUM', 'WARNING'].includes(r.severity.toUpperCase())) && (
              <RemediationPanel
                findings={results}
                scanSource={scanSource}
                provider={provider}
                apiKey={apiKey}
                model={model}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
