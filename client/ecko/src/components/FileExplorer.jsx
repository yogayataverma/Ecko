import React, { useState, useEffect } from "react";
import axios from "axios";

const styles = {
  container: {
    display: "flex",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    height: "100vh",
    backgroundColor: "#010409",
  },
  fileExplorer: {
    width: "280px",
    borderRight: "1px solid #21262d",
    backgroundColor: "#0d1117",
    overflowY: "auto",
    padding: "12px 0",
    boxShadow: "2px 0 6px rgba(0,0,0,0.2)",
  },
  folderItem: {
    padding: "8px 16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 500,
    color: "#7d8590",
    transition: "background-color 0.2s",
  },
  fileItem: {
    padding: "8px 16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "transparent",
    transition: "background-color 0.2s, border-left 0.2s",
  },
  fileItemSelected: {
    backgroundColor: "#161b22",
    borderLeft: "4px solid #21262d",
  },
  nestedFiles: {
    paddingLeft: "16px",
    borderLeft: "1px solid #21262d",
  },
  fileIcon: {
    fontSize: "14px",
    color: "#7d8590",
  },
  folderIcon: {
    fontSize: "14px",
    color: "#7d8590",
  },
};

const FileExplorer = ({ repoName, onFileSelect }) => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileTree, setFileTree] = useState({});
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  useEffect(() => {
    if (!repoName) return;

    axios
      .get(`http://localhost:5000/api/repo/${repoName}/files`)
      .then((response) => {
        if (response.data.success) {
          setFiles(response.data.files);
          setFileTree(buildFileTree(response.data.files));
        } else {
          console.error("❌ No files found.");
        }
      })
      .catch((error) => console.error("❌ Error fetching files:", error));
  }, [repoName]);

  // Build a nested file tree from the list of files
  const buildFileTree = (files) => {
    const tree = {};

    files.forEach((file) => {
      // Normalize the file path to use forward slashes
      const normalizedPath = file.path.replace(/\\/g, "/");
      const parts = normalizedPath.split("/");
      let current = tree;

      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // It's a file
          current[part] = { ...file, type: "file" };
        } else {
          // It's a folder
          if (!current[part]) {
            current[part] = { type: "directory", children: {} };
          }
          current = current[part].children;
        }
      });
    });

    return tree;
  };

  const toggleFolder = (path) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFileClick = (file) => {
    setSelectedFile(file);
    if (typeof onFileSelect === "function") {
      onFileSelect(file);
    }
  };

  // Render the tree recursively
  const renderFileTree = (tree, path = "") => {
    return Object.entries(tree).map(([name, node]) => {
      const currentPath = path ? `${path}/${name}` : name;

      if (node.type === "directory") {
        // This is a folder
        const isExpanded = expandedFolders.has(currentPath);
        return (
          <div key={currentPath}>
            <div
              style={styles.folderItem}
              onClick={() => toggleFolder(currentPath)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#161b22")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <span style={styles.folderIcon}>{isExpanded ? "▾" : "▸"}</span>
              <span>{name}</span>
            </div>
            {isExpanded && (
              <div style={styles.nestedFiles}>
                {renderFileTree(node.children, currentPath)}
              </div>
            )}
          </div>
        );
      } else {
        // This is a file
        return (
          <div
            key={node.hash}
            style={{
              ...styles.fileItem,
              ...(selectedFile?.hash === node.hash
                ? styles.fileItemSelected
                : {}),
            }}
            onClick={() => handleFileClick(node)}
            onMouseEnter={(e) => {
              if (selectedFile?.hash !== node.hash) {
                e.currentTarget.style.backgroundColor = "#161b22";
              }
            }}
            onMouseLeave={(e) => {
              if (selectedFile?.hash !== node.hash) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <span style={styles.fileIcon}></span>
            <span>{name}</span>
          </div>
        );
      }
    });
  };

  return (
    <div style={styles.fileExplorer}>
      {Object.keys(fileTree).length > 0 ? (
        renderFileTree(fileTree)
      ) : (
        <p style={{ padding: "16px", color: "#7d8590" }}>No files found.</p>
      )}
    </div>
  );
};

export default FileExplorer;
