#!/usr/bin/env python3
"""
TrashDrop Collector - Hardcoded Values Audit Script

This script scans the project files for potentially hardcoded values that should be
moved to the configuration system. It identifies URLs, API keys, email addresses,
coordinates and other configuration values that might be candidates for externalization.
"""

import os
import re
import sys
import json
import argparse
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple, Set

# Define regex patterns for different types of hardcoded values
PATTERNS = {
    'url': r'https?://[^\s\'"<>)]+',  # URLs
    'email': r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',  # Email addresses
    'phone': r'\b(?:\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b',  # Phone numbers
    'api_key': r'(?:api[_-]?key|token|secret|password|auth)["\']?\s*[:=]\s*["\']([a-zA-Z0-9_\-\.]{20,})["\']',  # API keys
    'coordinates': r'\[\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\]',  # Map coordinates
    'port': r'(?:port|PORT)\s*=\s*(\d{2,5})',  # Port numbers
    'ip_address': r'\b(?:\d{1,3}\.){3}\d{1,3}\b',  # IP addresses
    'supabase': r'supabase[a-zA-Z0-9_\-\.]{10,}',  # Supabase identifiers
}

# Files and directories to ignore
IGNORE_DIRS = [
    'node_modules',
    'dist',
    '.git',
    'build',
    '__pycache__',
    '.vscode',
    '.idea'
]

IGNORE_FILES = [
    '.env',
    '.env.example',
    'package-lock.json',
    'hardcode-audit.py',
    'config.js'  # We've already refactored this
]

# File extensions to scan (empty means all files)
FILE_EXTENSIONS = [
    '.js',
    '.html',
    '.css',
    '.json',
    '.md'
]

# Result storage structure
class Finding:
    def __init__(self, pattern_type, value, line_number, line):
        self.pattern_type = pattern_type
        self.value = value
        self.line_number = line_number
        self.line = line.strip()

    def __str__(self):
        return f"[{self.pattern_type}] Line {self.line_number}: {self.value}"


def should_ignore_file(file_path: str) -> bool:
    """Check if the file should be ignored."""
    file_name = os.path.basename(file_path)
    
    # Check if file is in ignore list
    if file_name in IGNORE_FILES:
        return True
    
    # Check if file extension should be included
    if FILE_EXTENSIONS and not any(file_path.endswith(ext) for ext in FILE_EXTENSIONS):
        return True
        
    return False


def should_ignore_directory(dir_path: str) -> bool:
    """Check if the directory should be ignored."""
    dir_name = os.path.basename(dir_path)
    return dir_name in IGNORE_DIRS


def scan_file(file_path: str) -> Dict[str, List[Finding]]:
    """Scan a file for hardcoded values."""
    findings = defaultdict(list)
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
            
        for i, line in enumerate(lines, 1):
            for pattern_name, pattern in PATTERNS.items():
                matches = re.finditer(pattern, line)
                for match in matches:
                    # Get the value of the match
                    if pattern_name == 'api_key' and match.groups():
                        value = match.group(1)  # The captured group is the key
                    elif pattern_name == 'coordinates' and match.groups():
                        value = f"[{match.group(1)}, {match.group(2)}]"  # Reformat coordinates
                    else:
                        value = match.group(0)
                    
                    findings[file_path].append(Finding(pattern_name, value, i, line))
    except Exception as e:
        print(f"Error scanning {file_path}: {e}", file=sys.stderr)
    
    return findings


def scan_directory(root_dir: str) -> Dict[str, List[Finding]]:
    """Recursively scan a directory for hardcoded values."""
    all_findings = defaultdict(list)
    
    for root, dirs, files in os.walk(root_dir):
        # Filter out directories to ignore
        dirs[:] = [d for d in dirs if not should_ignore_directory(os.path.join(root, d))]
        
        for file in files:
            file_path = os.path.join(root, file)
            if not should_ignore_file(file_path):
                file_findings = scan_file(file_path)
                for file_path, findings in file_findings.items():
                    all_findings[file_path].extend(findings)
    
    return all_findings


def format_report(findings: Dict[str, List[Finding]], format_type: str, root_dir: str) -> str:
    """Format the findings into a report."""
    if not findings:
        return "No hardcoded values found."
    
    # Convert absolute paths to relative paths
    relative_findings = defaultdict(list)
    for file_path, file_findings in findings.items():
        try:
            rel_path = os.path.relpath(file_path, root_dir)
            relative_findings[rel_path] = file_findings
        except ValueError:
            # Fall back to full path if relative path can't be computed
            relative_findings[file_path] = file_findings
    
    if format_type == 'markdown':
        return format_markdown(relative_findings)
    elif format_type == 'json':
        return format_json(relative_findings)
    else:
        return format_text(relative_findings)


def format_text(findings: Dict[str, List[Finding]]) -> str:
    """Format findings as plain text."""
    lines = ["Hardcoded Values Audit\n======================\n"]
    
    for file_path, file_findings in sorted(findings.items()):
        lines.append(f"\nFile: {file_path}")
        lines.append("-" * (len(file_path) + 6))
        
        for finding in file_findings:
            lines.append(f"Line {finding.line_number} [{finding.pattern_type}]: {finding.value}")
            lines.append(f"  Context: {finding.line}")
            lines.append("")
    
    return "\n".join(lines)


def format_markdown(findings: Dict[str, List[Finding]]) -> str:
    """Format findings as Markdown."""
    lines = ["# Hardcoded Values Audit\n"]
    
    # Summary table
    lines.append("## Summary\n")
    lines.append("| Category | Count |")
    lines.append("|----------|-------|")
    
    # Count occurrences by type
    type_counts = defaultdict(int)
    for file_findings in findings.values():
        for finding in file_findings:
            type_counts[finding.pattern_type] += 1
    
    for pattern_type, count in sorted(type_counts.items()):
        lines.append(f"| {pattern_type} | {count} |")
    
    # Detailed findings
    lines.append("\n## Detailed Findings\n")
    
    for file_path, file_findings in sorted(findings.items()):
        lines.append(f"### {file_path}\n")
        
        if not file_findings:
            lines.append("No issues found.\n")
            continue
            
        lines.append("| Line | Type | Value | Context |")
        lines.append("|------|------|-------|---------|")
        
        for finding in sorted(file_findings, key=lambda f: f.line_number):
            # Escape pipe characters in markdown table
            value = finding.value.replace("|", "\\|")
            context = finding.line.replace("|", "\\|")
            lines.append(f"| {finding.line_number} | {finding.pattern_type} | `{value}` | `{context}` |")
        
        lines.append("")
    
    lines.append("\n## Recommendations\n")
    lines.append("### Values to Move to Environment Variables\n")
    lines.append("- API keys, secrets, and credentials")
    lines.append("- Service URLs that might change between environments")
    lines.append("- Database connection strings")
    
    lines.append("\n### Values to Move to Configuration\n")
    lines.append("- Default coordinates and zoom levels")
    lines.append("- UI settings and defaults")
    lines.append("- Feature flags and toggles")
    
    return "\n".join(lines)


def format_json(findings: Dict[str, List[Finding]]) -> str:
    """Format findings as JSON."""
    result = {}
    
    for file_path, file_findings in findings.items():
        result[file_path] = []
        for finding in file_findings:
            result[file_path].append({
                "type": finding.pattern_type,
                "value": finding.value,
                "line_number": finding.line_number,
                "context": finding.line
            })
    
    return json.dumps(result, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Scan for hardcoded values in code")
    parser.add_argument("-d", "--directory", default=".", help="Root directory to scan")
    parser.add_argument("-f", "--format", choices=["text", "markdown", "json"], default="markdown",
                       help="Output format (default: markdown)")
    parser.add_argument("-o", "--output", help="Output file (default: stdout)")
    parser.add_argument("-i", "--ignore", action="append", default=[],
                       help="Additional files or directories to ignore")
    
    args = parser.parse_args()
    
    # Add custom ignores
    IGNORE_DIRS.extend([d for d in args.ignore if os.path.isdir(os.path.join(args.directory, d))])
    IGNORE_FILES.extend([f for f in args.ignore if os.path.isfile(os.path.join(args.directory, f))])
    
    # Convert the directory to an absolute path
    root_dir = os.path.abspath(args.directory)
    
    print(f"Scanning {root_dir} for hardcoded values...", file=sys.stderr)
    findings = scan_directory(root_dir)
    
    # Count total findings
    total_findings = sum(len(file_findings) for file_findings in findings.values())
    print(f"Found {total_findings} potential hardcoded values in {len(findings)} files.", file=sys.stderr)
    
    # Format the report
    report = format_report(findings, args.format, root_dir)
    
    # Output the report
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(report)
        print(f"Report written to {args.output}", file=sys.stderr)
    else:
        print(report)


if __name__ == "__main__":
    main()
