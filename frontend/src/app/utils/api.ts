export type ScanResult = Finding[];

export interface Finding {
    check_id: string;
    severity: string;
    message: string;
    details?: string;
    file?: string;
    line?: number;
    code?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function scanSkill(input: File | string): Promise<ScanResult> {
    const formData = new FormData();
    if (typeof input === 'string') {
        formData.append('url', input);
    } else {
        formData.append('file', input);
    }

    const response = await fetch(`${API_URL}/scan`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        let errorMsg = response.statusText;
        try {
            const errData = await response.json();
            errorMsg = errData.detail || errorMsg;
        } catch (e) { }
        throw new Error(`Scan failed: ${errorMsg}`);
    }

    const data = await response.json();
    // Backend returns { score: number, findings: [] } in the 'results' field
    // We want to return just the findings array as per ScanResult type alias
    return data.results.findings || [];
}

export interface RemediationRequest {
    findings: Finding[];
    code: string; // The original code (or a snippet/file content)
    provider: string;
    api_key: string;
    model: string;
}

export async function remediateSkill(req: RemediationRequest): Promise<string> {
    const response = await fetch(`${API_URL}/remediate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
    });

    if (!response.ok) {
        let errorMsg = response.statusText;
        try {
            const errData = await response.json();
            errorMsg = errData.detail || errorMsg;
        } catch (e) { }
        throw new Error(`Remediation failed: ${errorMsg}`);
    }

    const data = await response.json();
    return data.fixed_code;
}
