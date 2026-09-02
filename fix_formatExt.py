with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const formatExt = targetFormat === 'epub' && doc.fileType === 'pdf' ? 'pdf' : targetFormat;", "const formatExt = targetFormat;")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("formatExt fixed")
