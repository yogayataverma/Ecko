import React, { useState, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// Change or choose another Prism theme if you like:
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const FileViewer = ({ repoName, selectedFile }) => {
  const [fileContent, setFileContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function decodeBase64(base64String) {
    try {
      return atob(base64String);
    } catch (error) {
      console.error("Error decoding base64:", error);
      return base64String;
    }
  }

  // Guess language from file extension
  function getLanguage(filename) {
    if (!filename) return "text";
    const ext = filename.split(".").pop().toLowerCase();
    switch (ext) {
      case "js":
      case "jsx":
        return "jsx";
      case "ts":
      case "tsx":
        return "tsx";
      case "py":
        return "python";
      case "java":
        return "java";
      case "c":
        return "c";
      case "cpp":
      case "cc":
      case "cxx":
        return "cpp";
      case "html":
        return "html";
      case "css":
        return "css";
      case "json":
        return "json";
      case "rb":
        return "ruby";
      case "php":
        return "php";
      default:
        return "text";
    }
  }

  useEffect(() => {
    if (!repoName || !selectedFile?.hash) {
      setFileContent("");
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`http://localhost:5000/api/repo/${repoName}/file/${selectedFile.hash}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && data.content) {
          const decoded = decodeBase64(data.content);
          setFileContent(decoded);
        } else {
          throw new Error("No content in response");
        }
      })
      .catch((err) => {
        console.error("Error loading file:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [repoName, selectedFile]);

  return (
    <div
      style={{
        flex: 1,
        padding: "16px",
        overflowY: "auto",
        backgroundColor: "#0d1117",
        color: "#7d8590",
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        borderLeft: "1px solid #21262d",
      }}
    >
      {loading ? (
        <p style={{ color: "#7d8590" }}>Loading file content...</p>
      ) : error ? (
        <p style={{ color: "#f85149" }}>Error: {error}</p>
      ) : !selectedFile ? (
        <p style={{ color: "#7d8590" }}>Please select a file to view.</p>
      ) : (
        <SyntaxHighlighter
          language={getLanguage(selectedFile.filename)}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            borderRadius: "4px",
            backgroundColor: "#161b22",
            color: "#7d8590",
            border: "1px solid #21262d",
          }}
        >
          {fileContent}
        </SyntaxHighlighter>
      )}
    </div>
  );
};

export default FileViewer;
