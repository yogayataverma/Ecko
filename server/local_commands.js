#!/usr/bin/env node

const commander = require("commander");
const program = new commander.Command();
const fs = require("fs-extra");
const crypto = require("crypto");
const path = require("path");
const axios = require("axios");
// const uploadFileContent = require("./utils/uploadFileContent"); // Import the helper function

const ECKO_DIR = path.join(process.cwd(), ".ecko");
const OBJECTS_DIR = path.join(ECKO_DIR, "objects");
const COMMITS_DIR = path.join(ECKO_DIR, "commits");
const FILE_MAP_PATH = path.join(ECKO_DIR, "filemap.json");
const CONFIG_PATH = path.join(ECKO_DIR, "config.json");

// Default remote URL
const DEFAULT_REMOTE_URL = "http://localhost:5000/api";

// Ensure required directories exist
fs.ensureDirSync(ECKO_DIR);
fs.ensureDirSync(OBJECTS_DIR);
fs.ensureDirSync(COMMITS_DIR);

// Get the original file path (relative to the repo root) from hash
const getOriginalFilePath = (hash) => {
  if (fs.existsSync(FILE_MAP_PATH)) {
    const fileMap = fs.readJsonSync(FILE_MAP_PATH);
    return fileMap[hash] || "Unnamed File";
  }
  return "Unnamed File";
};

// Initialize Ecko repository
const initRepo = () => {
  fs.ensureDirSync(OBJECTS_DIR);
  fs.ensureDirSync(COMMITS_DIR);
  fs.writeJsonSync(CONFIG_PATH, { remote: DEFAULT_REMOTE_URL }, { spaces: 2 });
  console.log("✅ Initialized empty Ecko repository.");
};

// Add a single file and store its relative path in filemap
const addFile = async (filePath) => {
  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ File ${filePath} not found.`);
    return;
  }

  const stats = fs.statSync(fullPath);
  if (stats.isDirectory()) {
    // Process directory with process.cwd() as baseDir
    const files = await getAllFilesRecursively(fullPath, process.cwd());
    for (const file of files) {
      const hash = file.hash;
      const objectPath = path.join(OBJECTS_DIR, hash);

      if (!fs.existsSync(objectPath)) {
        fs.writeFileSync(objectPath, file.content);
      }

      let fileMap = {};
      if (fs.existsSync(FILE_MAP_PATH)) {
        fileMap = fs.readJsonSync(FILE_MAP_PATH);
      }
      // file.path here already contains the relative path from the repo root.
      fileMap[hash] = file.path;
      fs.writeJsonSync(FILE_MAP_PATH, fileMap, { spaces: 2 });

      console.log(`✅ Added ${file.path} (hash: ${hash}).`);
    }
    return;
  }

  // If it's a regular file
  const content = fs.readFileSync(fullPath);
  const hash = crypto.createHash("sha1").update(content).digest("hex");
  const objectPath = path.join(OBJECTS_DIR, hash);

  if (!fs.existsSync(objectPath)) {
    fs.writeFileSync(objectPath, content);
  }

  // Compute the relative path from the repository root
  const relativePath = path.relative(process.cwd(), fullPath);
  let fileMap = {};
  if (fs.existsSync(FILE_MAP_PATH)) {
    fileMap = fs.readJsonSync(FILE_MAP_PATH);
  }
  fileMap[hash] = relativePath;
  fs.writeJsonSync(FILE_MAP_PATH, fileMap, { spaces: 2 });

  console.log(`✅ Added ${relativePath} (hash: ${hash}).`);
};

// Add all files in the current directory (excluding hidden and node_modules)
const addAllFiles = async () => {
  const allFiles = fs
    .readdirSync(process.cwd())
    .filter(
      (file) =>
        !file.startsWith(".") && file !== "node_modules" && file !== ".ecko"
    );

  if (allFiles.length === 0) {
    console.log("⚠️ No files found to add.");
    return;
  }

  for (const file of allFiles) {
    await addFile(file);
  }
};

const getAllFilesRecursively = async (dirPath, baseDir = dirPath) => {
  const files = [];
  const items = await fs.readdir(dirPath, { withFileTypes: true });

  for (const item of items) {
    // Skip hidden files and node_modules
    if (item.name.startsWith(".") || item.name === "node_modules") {
      continue;
    }

    const fullPath = path.join(dirPath, item.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (item.isDirectory()) {
      // Recursively get files from subdirectories
      const subDirFiles = await getAllFilesRecursively(fullPath, baseDir);
      files.push(...subDirFiles);
    } else {
      // Read file content as text (for hashing purposes, you may assume text here)
      const content = await fs.readFile(fullPath, "utf-8");
      const hash = crypto.createHash("sha1").update(content).digest("hex");

      files.push({
        filename: item.name,
        path: relativePath,
        content,
        hash,
      });
    }
  }
  return files;
};

const commitFiles = async (repoPath) => {
  try {
    const files = await getAllFilesRecursively(repoPath);
    // ... rest of your commit logic ...
    return files;
  } catch (error) {
    console.error("Error in commitFiles:", error);
    throw error;
  }
};

const commitChanges = (message) => {
  const files = fs.readdirSync(OBJECTS_DIR);
  if (!files.length) {
    console.log("⚠️ Nothing to commit.");
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:]/g, "-");
  const safeMessage = message.replace(/[^a-z0-9]/gi, "_");
  const commitFileName = `${timestamp}-${safeMessage}.json`;

  // Only include metadata: hash, filename, and path
  const fileMappings = files.map((hash) => {
    const originalPath = getOriginalFilePath(hash);
    return {
        hash,
        filename: require("path").basename(originalPath),
        path: originalPath,
        content: fs.readFileSync(path.join(OBJECTS_DIR, hash), "utf-8") // or use Buffer if binary      
      };
  });

  const commitData = {
    message,
    timestamp: new Date().toISOString(),
    files: fileMappings,
  };

  fs.ensureDirSync(COMMITS_DIR);
  fs.writeJsonSync(
    require("path").join(COMMITS_DIR, commitFileName),
    commitData,
    { spaces: 2 }
  );

  console.log(`✅ Committed successfully with message: "${message}".`);
};

// Helper to determine if a file is text-based (for push)
const isTextFile = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  const textExtensions = ["txt", "js", "jsx", "css", "html", "json", "md"];
  return textExtensions.includes(ext);
};

// Push commits to remote repository
// Push commits to remote repository with file content encoded as base64.
const pushCommits = async (repoName) => {
  // Read configuration from the config file.
  let config = {};
  if (fs.existsSync(CONFIG_PATH)) {
    config = fs.readJsonSync(CONFIG_PATH);
  }
  
  // Build remoteUrl from config or use default.
  const remoteBase = config.remote || DEFAULT_REMOTE_URL;
  if (!remoteBase) {
    throw new Error("Remote URL is not defined in configuration.");
  }
  const remoteUrl = `${remoteBase}/push`;

  const commits = fs.readdirSync(COMMITS_DIR);
  if (!commits.length) {
    console.log("⚠️ Nothing to push.");
    return;
  }

  // Get the latest commit (based on sorted filenames)
  const latestCommit = commits.sort().reverse()[0];
  const commitPath = path.join(COMMITS_DIR, latestCommit);
  const commitData = fs.readJsonSync(commitPath);

  // Process each file: read file content as Buffer, convert to base64 string,
  // and include it in the commit metadata.
  const filesData = commitData.files.map(({ hash, filename, path: filePath }) => {
    try {
      const localFilePath = path.join(OBJECTS_DIR, hash);
      if (!fs.existsSync(localFilePath)) {
        throw new Error(`File not found: ${localFilePath}`);
      }

      // Read file content as a Buffer.
      const fileBuffer = fs.readFileSync(localFilePath);

      // Convert the Buffer to a base64 string.
      const contentBase64 = fileBuffer.toString("base64");

      return {
        hash,
        filename,
        path: filePath,
        content: contentBase64, // Now serialized as a base64 string.
      };
    } catch (error) {
      console.error(`Error processing file ${filename}:`, error);
      return null;
    }
  });

  // Filter out any failed file readings.
  commitData.files = filesData.filter((file) => file !== null);

  // Optionally, update the local commit file with the added file content.
  fs.writeJsonSync(commitPath, commitData, { spaces: 2 });

  try {
    const response = await axios.post(remoteUrl, {
      repoName,
      commit: {
        message: commitData.message,
        timestamp: commitData.timestamp,
      },
      files: commitData.files, // Files now include base64-encoded content.
    });

    if (response.data.success) {
      console.log(`✅ Successfully pushed to "${repoName}".`);
    } else {
      console.error(`❌ Push failed: ${response.data.message}`);
    }
  } catch (error) {
    console.error(`❌ Push failed: ${error.message}`);
  }
};

// Set up the CLI commands
program
  .name("ecko")
  .description("A simple version control system")
  .version("1.0.0");

program
  .command("init")
  .description("Initialize a new Ecko repository")
  .action(() => {
    initRepo();
  });

program
  .command("add <file>")
  .description("Add a file to the staging area. Use '.' to add all files")
  .action(async (file) => {
    try {
      if (file === ".") {
        await addAllFiles();
      } else {
        await addFile(file);
      }
    } catch (error) {
      console.error("❌ Error adding files:", error.message);
    }
  });

program
  .command("commit <message>")
  .description("Commit staged changes")
  .action((message) => {
    commitChanges(message);
  });

program
  .command("push <repoName>")
  .description("Push commits to remote repository")
  .action(async (repoName) => {
    try {
      await pushCommits(repoName);
    } catch (error) {
      console.error("❌ Error pushing commits:", error.message);
    }
  });

program
  .command("config <remoteUrl>")
  .description("Configure remote repository URL")
  .action((remoteUrl) => {
    if (!remoteUrl.startsWith("http://") && !remoteUrl.startsWith("https://")) {
      console.error("❌ Remote URL must start with http:// or https://");
      return;
    }
    fs.writeJsonSync(CONFIG_PATH, { remote: remoteUrl }, { spaces: 2 });
    console.log(`✅ Configured remote URL: ${remoteUrl}`);
  });

// Parse the command line arguments
program.parse(process.argv);
