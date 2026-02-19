from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import tempfile
import uuid
import subprocess
from typing import List, Dict, Any
# Import checks (to be implemented)
# from checks import code_exec, supply_chain, instruction_diff

app = FastAPI(title="Skill Sentinel Scanner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

from pydantic import BaseModel

class ScanRequest(BaseModel):
    url: str = None

@app.post("/scan")
async def scan_skill(
    file: UploadFile = File(None), 
    url: str = Form(None)
):
    # Create a unique temporary directory for this scan
    scan_id = str(uuid.uuid4())
    temp_dir = tempfile.mkdtemp(prefix=f"scan_{scan_id}_")
    
    try:
        scan_path = temp_dir
        
        if file:
            file_path = os.path.join(temp_dir, file.filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            if file.filename.endswith(".zip"):
                import zipfile
                with zipfile.ZipFile(file_path, 'r') as zip_ref:
                    zip_ref.extractall(temp_dir)
            # scan_path remains temp_dir
            
        elif url:
            # Basic sanitization
            cleaned_url = url.strip()
            # Remove common prefixes from copy-pasting commands
            for prefix in ["npx skills add ", "git clone "]:
                if cleaned_url.startswith(prefix):
                    cleaned_url = cleaned_url[len(prefix):].strip()
            
            # Ensure it looks like a URL
            if not cleaned_url.startswith("http"):
                raise HTTPException(status_code=400, detail="Invalid URL format. Please provide a valid http/https URL.")

            # Handle Git URL with potential subdirectory support
            # format: https://github.com/owner/repo/tree/branch/path/to/dir
            if "github.com" in cleaned_url and ("/tree/" in cleaned_url or "/blob/" in cleaned_url):
                try:
                    # Split url
                    parts = cleaned_url.split("/tree/" if "/tree/" in cleaned_url else "/blob/")
                    base_url = parts[0]
                    rest = parts[1]
                    
                    split_rest = rest.split("/", 1)
                    branch = split_rest[0]
                    subpath = split_rest[1] if len(split_rest) > 1 else ""
                    
                    # Clone base repo
                    subprocess.run(["git", "clone", base_url, temp_dir], check=True, capture_output=True)
                    
                    # Checkout branch
                    subprocess.run(["git", "checkout", branch], cwd=temp_dir, check=True, capture_output=True)
                    
                    scan_path = os.path.join(temp_dir, subpath)
                except subprocess.CalledProcessError as e:
                    # Try to return a helpful error message
                    err_msg = e.stderr.decode() if e.stderr else str(e)
                    raise HTTPException(status_code=400, detail=f"Git operation failed: {err_msg}")
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Failed to process GitHub URL: {str(e)}")
            
            elif cleaned_url.endswith(".git") or "github.com" in cleaned_url or "gitlab.com" in cleaned_url:
                try:
                    subprocess.run(["git", "clone", cleaned_url, temp_dir], check=True, capture_output=True)
                except subprocess.CalledProcessError as e:
                    err_msg = e.stderr.decode() if e.stderr else str(e)
                    raise HTTPException(status_code=400, detail=f"Git clone failed: {err_msg}")
            else:
                 raise HTTPException(status_code=400, detail="Only Git URLs are supported for now.")
        else:
             raise HTTPException(status_code=400, detail="Either file or url must be provided.")
            
        # Run checks
        if not os.path.exists(scan_path):
             raise HTTPException(status_code=404, detail=f"Target path not found after cloning: {scan_path}")

        results = run_all_checks(scan_path)
        
        return {
            "scan_id": scan_id,
            "source": file.filename if file else url,
            "results": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup
        shutil.rmtree(temp_dir, ignore_errors=True)

from remediation import AIService

class RemediateRequest(BaseModel):
    findings: List[Dict[str, Any]]
    code: str
    provider: str
    api_key: str
    model: str

@app.post("/remediate")
async def remediate_skill(request: RemediateRequest):
    try:
        service = AIService(request.provider, request.api_key, request.model)
        fixed_code = service.remediate(request.findings, request.code)
        return {"fixed_code": fixed_code}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from checks import code_exec, supply_chain, instruction_diff
import concurrent.futures

def run_all_checks(path: str) -> Dict[str, Any]:
    all_findings = []
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Submit tasks
        future_code_exec = executor.submit(code_exec.run, path)
        future_supply_chain = executor.submit(supply_chain.run, path)
        future_instruction_diff = executor.submit(instruction_diff.run, path)
        
        # Add other checks here as they are implemented
        
        # Gather results
        try:
            findings_exec = future_code_exec.result()
            all_findings.extend(findings_exec)
        except Exception as e:
            all_findings.append({"check_id": "code_exec", "error": str(e), "severity": "ERROR"})
            
        try:
            findings_supply = future_supply_chain.result()
            all_findings.extend(findings_supply)
        except Exception as e:
            all_findings.append({"check_id": "supply_chain", "error": str(e), "severity": "ERROR"})
            
        try:
            findings_diff = future_instruction_diff.result()
            all_findings.extend(findings_diff)
        except Exception as e:
             all_findings.append({"check_id": "instruction_diff", "error": str(e), "severity": "ERROR"})

    # Simple scoring logic (can be refined)
    score = 100
    for finding in all_findings:
        severity = finding.get("severity", "INFO")
        if severity == "ERROR" or severity == "HIGH":
            score -= 20
        elif severity == "WARNING" or severity == "MEDIUM":
            score -= 10
        elif severity == "LOW":
            score -= 5
            
    score = max(0, score)
    
    return {
        "score": score,
        "findings": all_findings
    }
