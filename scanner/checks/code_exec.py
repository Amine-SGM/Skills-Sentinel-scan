import subprocess
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def run(path: str) -> List[Dict[str, Any]]:
    findings = []
    
    # Run Semgrep
    try:
        semgrep_cmd = [
            "semgrep",
            "--config", "rules/code_exec.yaml",
            path,
            "--json",
            "--quiet" # Suppress non-JSON output
        ]
        result = subprocess.run(semgrep_cmd, capture_output=True, text=True)
        if result.returncode == 0 or result.returncode == 1: # 0 for no findings, 1 for findings (sometimes) or just completed
             # Semgrep might return non-zero on findings depending on config, but usually 0 on success.
             # We should check stderr if stdout is empty but return code is non-zero.
             if result.stdout:
                try:
                    data = json.loads(result.stdout)
                    for result_item in data.get("results", []):
                        findings.append({
                            "check_id": "code_exec",
                            "tool": "semgrep",
                            "severity": result_item["extra"]["severity"],
                            "message": result_item["extra"]["message"],
                            "file": result_item["path"],
                            "line": result_item["start"]["line"],
                            "code": result_item["extra"]["lines"]
                        })
                except json.JSONDecodeError:
                    logger.error(f"Failed to decode semgrep output: {result.stdout}")
        else:
             logger.error(f"Semgrep failed: {result.stderr}")

    except Exception as e:
        logger.error(f"Error running Semgrep: {e}")

    # Run Bandit
    try:
        bandit_cmd = [
            "bandit",
            "-r", path,
            "-f", "json",
            "--quiet"
        ]
        result = subprocess.run(bandit_cmd, capture_output=True, text=True)
        # Bandit returns 0 on no issues, 1 on issues.
        if result.stdout:
             try:
                data = json.loads(result.stdout)
                for result_item in data.get("results", []):
                    findings.append({
                        "check_id": "code_exec",
                        "tool": "bandit",
                        "severity": result_item["issue_severity"],
                        "message": result_item["issue_text"],
                        "file": result_item["filename"],
                        "line": result_item["line_number"],
                        "code": result_item["code"]
                    })
             except json.JSONDecodeError:
                logger.error(f"Failed to decode bandit output: {result.stdout}")
    except Exception as e:
        logger.error(f"Error running Bandit: {e}")

    return findings
