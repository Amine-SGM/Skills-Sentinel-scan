import React, { useState } from 'react';

interface FileUploadProps {
    onUpload: (file: File | string) => void;
    isScanning: boolean;
}

export default function FileUpload({ onUpload, isScanning }: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [mode, setMode] = useState<'file' | 'url'>('file');
    const [url, setUrl] = useState('');

    const handleDrag = (e: React.DragEvent) => {
        if (mode !== 'file') return;
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        if (mode !== 'file') return;
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onUpload(e.target.files[0]);
        }
    };

    const handleUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url.trim()) {
            onUpload(url.trim());
        }
    };

    return (
        <div className="w-full max-w-xl mx-auto">
            <div className="flex justify-center mb-6">
                <div className="bg-gray-100 p-1 rounded-lg inline-flex">
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'file' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        onClick={() => setMode('file')}
                    >
                        File Upload
                    </button>
                    <button
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'url' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                        onClick={() => setMode('url')}
                    >
                        Git URL
                    </button>
                </div>
            </div>

            {mode === 'file' ? (
                <div
                    className={`p-8 border-2 border-dashed rounded-lg text-center transition-colors ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400"
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleChange}
                        disabled={isScanning}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-lg font-medium text-gray-700">
                            {isScanning ? "Scanning..." : "Drag and drop your skill here, or click to upload"}
                        </span>
                        <span className="text-sm text-gray-500 mt-2">
                            Accepts .zip, .py, .js, .md files
                        </span>
                    </label>
                </div>
            ) : (
                <form onSubmit={handleUrlSubmit} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-2">
                        Git Repository URL
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            id="url-input"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://github.com/user/repo.git"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2 border"
                            disabled={isScanning}
                        />
                        <button
                            type="submit"
                            disabled={isScanning || !url.trim()}
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {isScanning ? "Scanning..." : "Scan"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
