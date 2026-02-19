from sklearn.feature_extraction.text import TfidfVectorizer
import glob
import os
import re
from typing import List, Dict, Any, Set

def run(path: str) -> List[Dict[str, Any]]:
    findings = []
    
    # 1. Find README or SKILL.md
    readme_content = ""
    readme_path = None
    for filename in ["README.md", "values.md", "SKILL.md", "instructions.md"]:
        p = os.path.join(path, filename)
        if os.path.exists(p):
            readme_path = p
            with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                readme_content = f.read()
            break
    
    if not readme_content:
        return [] # No instructions to compare against
        
    # 2. Extract Keywords from Code
    # Simplified approach: regex for function calls or imports
    # In a real scenario, use AST for better accuracy
    code_content = ""
    for root, dirs, files in os.walk(path):
        for file in files:
            if file.endswith(".py") or file.endswith(".js"):
                try:
                    with open(os.path.join(root, file), 'r', encoding='utf-8', errors='ignore') as f:
                        code_content += f.read() + "\n"
                except Exception:
                    pass

    # Extract potential API calls / important keywords from code
    # We look for words following "import", "from", or function calls "foo("
    detected_apis = set(re.findall(r'\b(import|from)\s+([a-zA-Z0-9_]+)', code_content))
    # Flatten the tuples from findall
    api_keywords = {item[1] for item in detected_apis}
    
    # Also add standard function calls
    calls = set(re.findall(r'\b([a-zA-Z0-9_]+)\(', code_content))
    api_keywords.update(calls)
    
    if not api_keywords:
        return []

    # 3. Compare using TF-IDF or simple set difference
    # The plan suggested TF-IDF, but simple keyword matching might be more direct for "mismatches"
    # "declared_keywords = extract_keywords(readme)"
    # "actual_keywords = set(detected_apis)"
    
    # Let's extract keywords from README using a simple list of "sensitive" capabilities
    # and see if they appear in code, or vice-versa.
    # Actually, the plan says: "Compare SKILL.md description vs. detected API calls"
    
    # Let's verify if high-risk APIs found in code are mentioned in README
    high_risk_apis = {
        "os", "subprocess", "eval", "exec", "requests", "urllib", "socket", 
        "open", "write", "read", "env", "environ"
    }
    
    found_risk_apis = api_keywords.intersection(high_risk_apis)
    
    unpublished_capabilities = []
    for api in found_risk_apis:
        if api.lower() not in readme_content.lower():
            unpublished_capabilities.append(api)
            
    if unpublished_capabilities:
        findings.append({
            "check_id": "instruction_diff",
            "severity": "HIGH",
            "message": f"Undocumented capability detected: Code uses {', '.join(unpublished_capabilities)} but not mentioned in instructions.",
            "details": f"Found sensitive APIs: {unpublished_capabilities}"
        })

    return findings
