import re

with open('src/components/DocumentDetailEditor.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('isAiAnalyzing', 'isAnalyzing')
content = content.replace('setIsAiAnalyzing', 'setIsAnalyzing')
content = content.replace('aiSuccessFeedback', 'successFeedback')
content = content.replace('setAiSuccessFeedback', 'setSuccessFeedback')
content = content.replace('handleAiAutoAnalyze', 'handleAutoAnalyze')
content = content.replace('/api/gemini/analyze-book', '/api/metadata/analyze')

with open('src/components/DocumentDetailEditor.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Renamed variables in DocumentDetailEditor")
