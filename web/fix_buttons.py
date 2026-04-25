import re

files_to_process = [
    "src/app/admin/tours/page.tsx",
    "src/app/admin/pricing/page.tsx",
    "src/app/admin/expenses/page.tsx"
]

for filepath in files_to_process:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Blue buttons
    content = content.replace(
        "bg-blue-600 hover:bg-blue-500 rounded-xl text-text-primary",
        "bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-xl text-white"
    )
    content = content.replace(
        "bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-text-primary",
        "bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 text-white"
    )

    # Violet buttons
    content = content.replace(
        "bg-violet-600 hover:bg-violet-500 rounded-xl text-text-primary",
        "bg-slate-900 hover:bg-slate-800 dark:bg-violet-600 dark:hover:bg-violet-500 rounded-xl text-white"
    )
    content = content.replace(
        "bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-text-primary",
        "bg-slate-900 hover:bg-slate-800 dark:bg-violet-600 dark:hover:bg-violet-500 disabled:opacity-50 text-white"
    )

    # Red buttons
    content = content.replace(
        "bg-red-600 hover:bg-red-500 text-text-primary",
        "bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 text-white"
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")
