from typing import List, Dict, Any, Optional
import os
import requests
import json
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self, provider: str, api_key: str, model: str):
        self.provider = provider
        self.api_key = api_key
        self.model = model

    def remediate(self, findings: List[Dict[str, Any]], original_code: str) -> str:
        prompt = self._construct_prompt(findings, original_code)
        
        if self.provider == "openai" or self.provider == "openrouter":
            return self._call_openai_compatible(prompt, "https://openrouter.ai/api/v1/chat/completions" if self.provider == "openrouter" else "https://api.openai.com/v1/chat/completions")
        elif self.provider == "ai_studio":
            return self._call_gemini(prompt)
        elif self.provider == "pollinations":
            return self._call_pollinations(prompt)
        else:
            raise ValueError(f"Unsupported provider: {self.provider}")

    def _construct_prompt(self, findings: List[Dict[str, Any]], code: str) -> str:
        findings_text = json.dumps(findings, indent=2)
        return f"""
You are a security expert. I will provide you with a source code file and a list of security findings detected in it.
Your task is to rewrite the code to fix all the security issues while maintaining the original functionality.

SECURITY FINDINGS:
{findings_text}

SOURCE CODE:
```
{code}
```

Return ONLY the fixed source code. Do not include markdown formatting or explanations. Just the code.
"""

    def _call_openai_compatible(self, prompt: str, url: str) -> str:
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            # OpenRouter requires specific headers sometimes, but standard bearer usually works
            if self.provider == "openrouter":
                headers["HTTP-Referer"] = "https://skill-sentinel.com" # Required by OpenRouter
                headers["X-Title"] = "Skill Sentinel"

            data = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}]
            }
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except Exception as e:
            logger.error(f"Error calling {self.provider}: {e}")
            return f"Error: Failed to remediate using {self.provider}. Details: {str(e)}"

    def _call_gemini(self, prompt: str) -> str:
        # Assuming using Google AI Studio REST API
        # URL format: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
            data = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            headers = {"Content-Type": "application/json"}
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            result = response.json()
            # Safety checks might block content
            if "candidates" in result and result["candidates"]:
                return result["candidates"][0]["content"]["parts"][0]["text"]
            else:
                return "Error: No candidates returned (likely safety block)."
        except Exception as e:
            logger.error(f"Error calling Gemini: {e}")
            return f"Error: Failed to remediate using Gemini. Details: {str(e)}"

    def _call_pollinations(self, prompt: str) -> str:
        # Pollinations.AI text generation
        # Endpoint: https://text.pollinations.ai/
        # They often accept GET or POST with simple text
        try:
            # Pollinations usually follows OpenAI format now or simple GET/POST
            # Checking recent usage: often it's 'https://text.pollinations.ai/{prompt}' (GET)
            # or POST to the same.
            # Let's try simple GET first as it's the most common "hacky" way, or assume OpenAI compat if they offer it.
            # The user said "enter.pollinations.ai" which leads to their site.
            # They recently support OpenAI compatible endpoint. Let's try that or fallback.
            # Endpoint: https://text.pollinations.ai/openai
            
            # Using standard OpenAI compatible call with their endpoint
            return self._call_openai_compatible(prompt, "https://text.pollinations.ai/openai")
            
        except Exception as e:
             # Fallback to simple GET if complex API fails
            try:
                response = requests.get(f"https://text.pollinations.ai/{prompt}")
                if response.status_code == 200:
                    return response.text
                return f"Error: Pollinations returned {response.status_code}"
            except Exception as e2:
                return f"Error calling Pollinations: {e2}"

    
