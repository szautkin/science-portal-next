# Star AI Widget - Usage Guide

## How to Create Files and Folders

The Star AI widget provides a simple interface for creating folders and files in your VOSpace storage.

---

## Creating Folders

### Basic Folder Creation

1. In the **"Create Folder"** section (left side)
2. Enter folder name: `my-folder`
3. Click **"Create Folder"** button

**Result:** Folder created at `home/username/my-folder`

### Nested Folder Creation

1. Enter path: `projects/astronomy/data`
2. Click **"Create Folder"**

**Result:** Folder created at `home/username/projects/astronomy/data`

**Note:** Parent folders must exist first. Create them in order:
- First: `projects`
- Then: `projects/astronomy`
- Finally: `projects/astronomy/data`

---

## Creating Files

### Basic File Creation (in Home Directory)

1. In the **"Create File"** section (right side)
2. **Leave "Location" field empty** (or clear it)
3. Enter filename: `script`
4. Select content type: **Python**
5. Enter content:
   ```python
   def hello():
       print("Hello, World!")
   ```
6. Click **"Create File"**

**Result:** File created at `home/username/script.py`

**Note:** Extension `.py` is automatically added based on content type!

---

### Creating Files in a Folder

1. In the **"Create File"** section
2. **Enter location:** `projects/my-project`
3. Enter filename: `analysis`
4. Select content type: **Python**
5. Enter your code
6. Click **"Create File"**

**Result:** File created at `home/username/projects/my-project/analysis.py`

---

### Creating Files in Nested Folders

1. **Location field:** `data/observations/2024`
2. **Filename:** `catalog`
3. **Content Type:** CSV
4. **Content:**
   ```csv
   object_id,ra,dec,magnitude
   NGC1234,180.5,45.6,18.5
   NGC5678,220.8,12.3,19.2
   ```
5. Click **"Create File"**

**Result:** File created at `home/username/data/observations/2024/catalog.csv`

---

## Content Types & Auto Extensions

The widget automatically adds the correct file extension based on content type:

| Content Type | Extension | Example |
|--------------|-----------|---------|
| Plain Text | `.txt` | `notes.txt` |
| Python | `.py` | `script.py` |
| JSON | `.json` | `config.json` |
| Markdown | `.md` | `README.md` |
| CSV | `.csv` | `data.csv` |
| JavaScript | `.js` | `app.js` |
| HTML | `.html` | `index.html` |

**Examples:**

- Enter `myfile`, select **Python** → creates `myfile.py` ✅
- Enter `config`, select **JSON** → creates `config.json` ✅
- Enter `readme`, select **Markdown** → creates `readme.md` ✅

**Smart Extension Handling:**

- Enter `script.txt`, select **Python** → creates `script.py` (replaces extension) ✅
- Enter `data.py`, select **CSV** → creates `data.csv` (replaces extension) ✅
- Enter `file.json`, select **JSON** → creates `file.json` (keeps correct extension) ✅

---

## Complete Workflow Example

### Goal: Create a project with structure and files

```
home/username/
└── astronomy-project/
    ├── README.md
    ├── data/
    │   └── observations.csv
    └── scripts/
        └── analyze.py
```

### Steps:

#### 1. Create Main Folder
- **Folder Path:** `astronomy-project`
- Click **Create Folder** ✅

#### 2. Create README
- **Location:** `astronomy-project`
- **Filename:** `README`
- **Content Type:** Markdown
- **Content:**
  ```markdown
  # Astronomy Project

  Analysis of astronomical observations.
  ```
- Click **Create File** ✅

#### 3. Create Data Subfolder
- **Folder Path:** `astronomy-project/data`
- Click **Create Folder** ✅

#### 4. Create CSV Data File
- **Location:** `astronomy-project/data`
- **Filename:** `observations`
- **Content Type:** CSV
- **Content:**
  ```csv
  object,ra,dec,mag
  NGC1234,180.5,45.6,18.5
  ```
- Click **Create File** ✅

#### 5. Create Scripts Subfolder
- **Folder Path:** `astronomy-project/scripts`
- Click **Create Folder** ✅

#### 6. Create Python Script
- **Location:** `astronomy-project/scripts`
- **Filename:** `analyze`
- **Content Type:** Python
- **Content:**
  ```python
  import pandas as pd

  def analyze():
      data = pd.read_csv('../data/observations.csv')
      print(data.describe())

  if __name__ == "__main__":
      analyze()
  ```
- Click **Create File** ✅

**Result:** Complete project structure created! 🎉

---

## Tips & Tricks

### 1. File Extension Handling
- **Don't worry about extensions** - they're added automatically
- Just enter the filename without extension
- The extension matches your selected content type

### 2. Path Handling
- All paths are relative to `home/username/`
- You don't need to include `home/username` - it's automatic
- Use forward slashes `/` for nested folders

### 3. Location Field (File Creation)
- **Leave empty** to create file in home directory
- **Enter folder path** to create file in that folder
- Shows preview: `File will be created at: home/username/.../`

### 4. Folder Path vs Location
- **Folder Path** (left) - Creates a new folder
- **Location** (right) - Where to place a file
- They are independent fields

### 5. Success Messages
- Success alerts appear at the top
- Show the full path where item was created
- Auto-dismiss after 5 seconds
- VOSpace widget above refreshes automatically

### 6. Validation
- Empty fields show helpful error messages
- Required fields are marked
- Helper text shows where items will be created

---

## Quick Reference

### Create File in Home Directory
```
Location: [leave empty]
Filename: myfile
Content Type: Python
Result: home/username/myfile.py
```

### Create File in Subfolder
```
Location: projects/data
Filename: results
Content Type: CSV
Result: home/username/projects/data/results.csv
```

### Create Nested Folder
```
Folder Path: workspace/analysis/temp
Result: home/username/workspace/analysis/temp
```

---

## Common Workflows

### 1. Quick Script
1. Leave location empty
2. Filename: `test`
3. Content Type: Python
4. Add code
5. Create → `home/username/test.py`

### 2. Project Config
1. Location: `myproject`
2. Filename: `config`
3. Content Type: JSON
4. Add config
5. Create → `home/username/myproject/config.json`

### 3. Data File
1. Location: `data/raw`
2. Filename: `dataset`
3. Content Type: CSV
4. Add data
5. Create → `home/username/data/raw/dataset.csv`

### 4. Documentation
1. Location: `docs`
2. Filename: `guide`
3. Content Type: Markdown
4. Add content
5. Create → `home/username/docs/guide.md`

---

## Troubleshooting

### "Folder path is required"
- Enter a folder name in the Folder Path field
- Example: `my-folder`

### "Filename is required"
- Enter a filename in the Filename field
- Example: `script` (extension added automatically)

### "File content is required"
- Add some content to the text area
- Cannot create empty files

### "Parent directory not found"
- Create parent folders first
- Example: To create `a/b/c`, first create `a`, then `a/b`, then `a/b/c`

### "Node already exists"
- A file/folder with that name already exists
- Choose a different name or delete the existing one

---

## Summary

✅ **Folders** - Always created under `home/username/[your-path]`
✅ **Files** - Use "Location" field to specify subfolder
✅ **Extensions** - Automatically added based on content type
✅ **Nested** - Create parent folders first, then children
✅ **Refresh** - VOSpace widget updates automatically after creation
