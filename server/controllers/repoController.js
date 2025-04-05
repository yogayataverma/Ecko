const Repo = require('../models/Repo');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

exports.getRepos = async (req, res) => {
  try {
    const repos = await Repo.find({});
    res.json({ success: true, repos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getRepoFiles = async (req, res) => {
  try {
    const { repoName } = req.params;
    console.log('Fetching files for repo:', repoName); // Debug log

    const repo = await Repo.findOne({ name: repoName });
    console.log('Found repo:', repo); // Debug log

    if (!repo) {
      console.log('Repo not found'); // Debug log
      return res.status(404).json({ success: false, message: "Repo not found." });
    }

    const latestCommit = repo.commits[repo.commits.length - 1];
    console.log('Latest commit:', latestCommit); // Debug log
    
    if (!latestCommit || !latestCommit.files) {
      console.log('No commits or files found'); // Debug log
      return res.json({ success: true, files: [] });
    }

    const files = latestCommit.files.map(f => ({
      hash: f.hash,
      filename: f.filename,
      path: f.path,
      content: f.content,
      _id: f._id
    }));

    console.log('Sending files:', files); // Debug log

    res.json({
      success: true,
      files: files
    });
  } catch (err) {
    console.error('Error fetching repo files:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// controllers/repoController.js
exports.getFileContent = async (req, res) => {
  try {
    const { repoName, fileHash } = req.params;
    const repo = await Repo.findOne({ name: repoName });
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repo not found." });
    }

    const latestCommit = repo.commits[repo.commits.length - 1];
    if (!latestCommit) {
      return res.status(404).json({ success: false, message: "No commits found." });
    }

    const file = latestCommit.files.find((f) => f.hash === fileHash);
    if (!file) {
      return res
        .status(404)
        .json({ success: false, message: "File not found." });
    }

    // return { success, content } where content is the base64 from the DB
    return res.json({
      success: true,
      content: file.content, // base64 string
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.createRepo = async (req, res) => {
  try {
    const { name, files = [], commitMessage = "Initial commit" } = req.body;
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: "Repository name is required" 
      });
    }

    // Ensure files is an array
    const filesArray = Array.isArray(files) ? files : [];
    
    const processedFiles = filesArray.map(file => {
      // Extract filename from path if path exists, otherwise use filename or generate one
      const filename = file.filename || (file.path ? file.path.split('/').pop() : 'unnamed');
      // Use provided path or construct one from filename
      const path = file.path || filename;

      return {
        hash: file.hash || '',
        content: file.content || '',
        path: path,
        filename: filename
      };
    });

    const repo = new Repo({
      name,
      commits: [{
        message: commitMessage,
        files: processedFiles,
        timestamp: new Date()
      }]
    });

    const savedRepo = await repo.save();
    res.status(201).json({
      success: true,
      repo: savedRepo
    });
  } catch (error) {
    console.error('Error creating repo:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A repository with this name already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating repository",
      error: error.message
    });
  }
};

exports.pushCommit = async (req, res) => {
  try {
    const { repoName, commit, files } = req.body;
    const repo = await Repo.findOne({ name: repoName });
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repo not found." });
    }

    // Process files with proper path and filename handling
    const processedFiles = files.map(file => {
      const filename = file.filename || (file.path ? file.path.split('/').pop() : 'unnamed');
      const path = file.path || filename;

      return {
        hash: file.hash,
        content: file.content,
        path: path,
        filename: filename
      };
    });

    const newCommit = {
      message: commit.message || "Update",
      timestamp: commit.timestamp || new Date(),
      files: processedFiles
    };

    repo.commits.push(newCommit);
    await repo.save();

    res.json({ 
      success: true, 
      message: "Commit pushed successfully.",
      commit: newCommit
    });
  } catch (err) {
    console.error('Error pushing commit:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCommit = async (req, res) => {
  try {
    const { repoId, message, files } = req.body;
    
    // Map the files array to include the full path
    const processedFiles = files.map(file => ({
      ...file,
      path: file.relativePath || file.path, // Use relativePath if provided, fallback to path
      filename: path.basename(file.relativePath || file.path) // Extract filename from path
    }));

    const commit = {
      message,
      timestamp: new Date(),
      files: processedFiles
    };

    const updatedRepo = await Repo.findByIdAndUpdate(
      repoId,
      { 
        $push: { commits: commit }
      },
      { new: true }
    );

    res.json(updatedRepo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addCommit = async (req, res) => {
  try {
    const { repoName, commitMessage } = req.body;
    const repo = await Repo.findOne({ name: repoName });
    
    if (!repo) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    // Get all files in the repository directory and subdirectories
    const getAllFiles = (dirPath, arrayOfFiles = []) => {
      const files = fs.readdirSync(dirPath);
      
      files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
          arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
          // Store the relative path from the repo root
          const relativePath = path.relative(path.join(process.env.REPOS_DIR, repoName), fullPath);
          arrayOfFiles.push({
            path: relativePath,
            filename: file,
            content: fs.readFileSync(fullPath, 'utf8'),
            hash: crypto.createHash('sha1')
                      .update(fs.readFileSync(fullPath))
                      .digest('hex')
          });
        }
      });
      
      return arrayOfFiles;
    };

    const repoPath = path.join(process.env.REPOS_DIR, repoName);
    const files = getAllFiles(repoPath);

    const newCommit = {
      message: commitMessage,
      timestamp: new Date(),
      files: files
    };

    repo.commits.push(newCommit);
    await repo.save();

    res.status(200).json(newCommit);
  } catch (error) {
    console.error('Error adding commit:', error);
    res.status(500).json({ message: 'Error adding commit', error: error.message });
  }
};
