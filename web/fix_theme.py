import os
import re

directory = "src/app/admin"

replacements = [
    # Backgrounds
    (r'bg-slate-900/50', r'bg-white dark:bg-slate-900/50'),
    (r'bg-slate-900(?![/\w])', r'bg-white dark:bg-slate-900'),
    (r'bg-white/5(?![0-9])', r'bg-slate-100 dark:bg-white/5'),
    (r'hover:bg-white/\[0\.02\]', r'hover:bg-slate-50 dark:hover:bg-white/[0.02]'),
    (r'hover:bg-white/5(?![0-9])', r'hover:bg-slate-100 dark:hover:bg-white/5'),
    
    # Borders
    (r'border-white/5(?![0-9])', r'border-slate-200 dark:border-white/5'),
    (r'border-white/10', r'border-slate-200 dark:border-white/10'),
    
    # Text colors
    (r'text-white(?![/\w])', r'text-slate-900 dark:text-white'),
    (r'text-slate-300', r'text-slate-700 dark:text-slate-300'),
    (r'text-slate-400', r'text-slate-600 dark:text-slate-400'),
    (r'text-slate-500', r'text-slate-500 dark:text-slate-400'),
    
    # Theme specific colors (amber, blue, red, emerald) that are hardcoded for dark mode
    (r'text-blue-400', r'text-blue-600 dark:text-blue-400'),
    (r'text-amber-400', r'text-amber-600 dark:text-amber-400'),
    (r'text-red-400', r'text-red-600 dark:text-red-400'),
    (r'text-emerald-400', r'text-emerald-600 dark:text-emerald-400'),
    (r'text-violet-400', r'text-violet-600 dark:text-violet-400'),
    
    # Theme backgrounds
    (r'bg-blue-500/10', r'bg-blue-50 dark:bg-blue-500/10'),
    (r'bg-blue-500/15', r'bg-blue-50 dark:bg-blue-500/15'),
    (r'bg-blue-500/20', r'bg-blue-100 dark:bg-blue-500/20'),
    (r'bg-amber-500/10', r'bg-amber-50 dark:bg-amber-500/10'),
    (r'bg-amber-500/20', r'bg-amber-100 dark:bg-amber-500/20'),
    (r'bg-red-500/10', r'bg-red-50 dark:bg-red-500/10'),
    (r'bg-red-500/20', r'bg-red-100 dark:bg-red-500/20'),
    (r'bg-emerald-500/10', r'bg-emerald-50 dark:bg-emerald-500/10'),
    (r'bg-emerald-500/20', r'bg-emerald-100 dark:bg-emerald-500/20'),
    (r'bg-violet-500/10', r'bg-violet-50 dark:bg-violet-500/10'),
    
    # Modals / overlays
    (r'bg-black/60', r'bg-slate-900/20 dark:bg-black/60'),
]

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(".tsx"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            new_content = content
            for old, new in replacements:
                new_content = re.sub(r'(?<!dark:)' + old, new, new_content)
                
            if new_content != content:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                print(f"Updated {path}")
