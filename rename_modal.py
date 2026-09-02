import re

with open('src/components/MetadataSuggestionModal.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("suggestion.confidenceScore || (suggestion.source?.includes('gemini') ? 95 : 85);", "suggestion.confidenceScore || 85;")
content = content.replace("{suggestion.source === 'gemini_grounded_web' ? 'Web Grounded AI Catalog Match' : suggestion.source === 'gemini' ? 'Gemini Deep AI Match' : 'Bibliographic Web Search'}", "{suggestion.source === 'web_catalog' ? 'Web Catalog Match' : 'Bibliographic Search'}")

with open('src/components/MetadataSuggestionModal.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Renamed variables in MetadataSuggestionModal")
