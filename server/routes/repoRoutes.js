// In repoRoutes.js
const express = require('express');
const router = express.Router();
const repoController = require('../controllers/repoController');

router.get('/repos', repoController.getRepos);
router.get('/repo/:repoName/files', repoController.getRepoFiles);
router.get('/repo/:repoName/file/:fileHash', repoController.getFileContent);
router.post('/create', repoController.createRepo);
router.post('/push', repoController.pushCommit);
router.get('/file-content', async (req, res) => {
  try {
    const { path } = req.query;
    if (!path) {
      return res.status(400).send('Path parameter is required');
    }
    
    const content = await uploadFileContent(path);
    res.send(content);
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).send('Error reading file content');
  }
});

module.exports = router;
