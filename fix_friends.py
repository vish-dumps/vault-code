import re

# Read the file
with open(r'E:\VaultCode\client\src\pages\community\friends.tsx', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Print lines around 212 to see the issue
lines = content.split('\n')
print(f"Total lines: {len(lines)}")
print("\n=== Lines 209-216 ===")
for i in range(209, min(216, len(lines))):
    print(f"{i+1}: {repr(lines[i][:100])}")

# Look for literal \n in the file
if r'\n' in content or '\\n' in content:
    print("\n=== Found literal backslash-n ===")
    # Find and show context
    for i, line in enumerate(lines):
        if '\\n' in line:
            print(f"Line {i+1}: {repr(line[:200])}")
