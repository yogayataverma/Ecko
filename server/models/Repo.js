const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  hash: String,
  content: String,
  path: String,
  filename: String
});

const commitSchema = new mongoose.Schema({
  message: String,
  timestamp: { type: Date, default: Date.now },
  files: [fileSchema],
});

const repoSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  commits: [commitSchema],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Repo', repoSchema);
