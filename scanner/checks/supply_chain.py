import docker
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def run(path: str) -> List[Dict[str, Any]]:
    findings = []
    
    try:
        client = docker.from_env()
        
        # Determine if requirements.txt exists
        import os
        req_path = os.path.join(path, "requirements.txt")
        if not os.path.exists(req_path):
            return findings # Nothing to check if no requirements

        # Run ephemeral container to check installation issues
        # We use a dry-run install if possible, or attempt to install in a safe sandbox
        logs = client.containers.run(
            "python:3.12-alpine",
            command=f"pip install --dry-run -r /skill/requirements.txt",
            # network_mode="none", # duplicate commented out
            
            network_mode="bridge", # Enable network for pip resolution
            mem_limit="128m",
            read_only=True,
            remove=True,
            stderr=True # Capture stderr
        )
        
        output = logs.decode('utf-8')
        
        # Analyze output for unofficial registries or errors
        if "index-url" in output.lower() and "pypi.org" not in output.lower():
             findings.append({
                "check_id": "supply_chain",
                "severity": "WARNING",
                "message": "Potential use of unofficial package registry detected.",
                "details": output
            })
            
    except docker.errors.ContainerError as e:
        # Container exited with non-zero
        findings.append({
            "check_id": "supply_chain",
            "severity": "ERROR",
            "message": "Pip install failed or triggered an error in sandbox.",
            "details": e.stderr.decode('utf-8') if e.stderr else str(e)
        })
    except Exception as e:
        logger.error(f"Error running supply chain check: {e}")
        findings.append({
            "check_id": "supply_chain",
            "severity": "ERROR",
            "message": f"Sandbox execution failed: {str(e)}"
        })

    return findings
