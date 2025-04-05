import React, { useState } from "react";
import RepoList from "./components/RepoList";
import FileExplorer from "./components/FileExplorer";
import FileViewer from "./components/FileViewer";
import axios from "axios";
import "./App.css";

function App() {
  const [repoName, setRepoName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleNewRepo = async () => {
    const repoName = prompt("Enter a new repo name:");
    if (!repoName) return; // user canceled

    try {
      const res = await axios.post("http://localhost:5000/api/create", {
        name: repoName,
        files: [],
        commitMessage: "Init",
      });

      if (res.data.success) {
        console.log("Repo created:", res.data.repo);
        // Refresh the page to show the new repo
        window.location.reload();
      }
    } catch (err) {
      console.error("Error creating repo:", err);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-left">
            <h1 style={{marginLeft:"40px"}}>Ecko</h1>
            <nav className="main-nav">
              {/* <a href="#" className="nav-item">Repositories</a>
              <a href="#" className="nav-item">Issues</a>
              <a href="#" className="nav-item">Pull Requests</a> */}
            </nav>
          </div>
          <div className="header-right">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={handleSearch}
                style={{
                  backgroundColor: "#0d1117",
                  color: "#7d8590",
                  border: "1px solid #21262d",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  width: "300px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="App-main">
        <div className="sidebar">
          <div className="sidebar-header">
            {/* <h3>Repositories</h3> */}
            <button 
              onClick={handleNewRepo}
              style={{
                backgroundColor: "#238636",
                color: "#ffffff",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                marginLeft: "15px",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#2ea043";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#238636";
              }}
            >
              New
            </button>
          </div>
          <RepoList 
            onSelectRepo={(name) => setRepoName(name)} 
            searchQuery={searchQuery}
          />
        </div>

        <div className="content">
          <div className="repo-header">
            <div className="repo-nav">
              <div className="repo-nav-left">
                <h2>{repoName || "Select a Repository"}</h2>
                {repoName && (
                  <div className="repo-meta">
                    {/* <span className="repo-visibility">Public</span>
                    <span className="repo-stats">
                      <span className="stat-item">
                        <svg className="stat-icon" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"></path>
                        </svg>
                        0
                      </span>
                      <span className="stat-item">
                        <svg className="stat-icon" viewBox="0 0 16 16" fill="currentColor">
                          <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 114.5 0v.878c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.372a3.75 3.75 0 10-7.5 0zM10.5 1.5h-3a.75.75 0 010-1.5h3a.75.75 0 010 1.5z"></path>
                        </svg>
                        0
                      </span>
                    </span> */}
                  </div>
                )}
              </div>
              {repoName && (
                <div className="repo-nav-right">
                  {/* <button className="watch-button">
                    <svg className="button-icon" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 2.5a5.487 5.487 0 00-5.131 3.502.75.75 0 01-.585.563A2.001 2.001 0 002 8.688V13a2 2 0 002 2h8a2 2 0 002-2V8.688a2 2 0 00-.283-1.123.75.75 0 01-.585-.563A5.487 5.487 0 008 2.5zM4.606 6.5a4 4 0 017.787 0 .75.75 0 01.585.563A.5.5 0 0113 8.688V13a.5.5 0 01-.5.5h-9a.5.5 0 01-.5-.5V8.688a.5.5 0 01.283-.125.75.75 0 01.585-.563z"></path>
                    </svg>
                    Watch
                  </button>
                  <button className="fork-button">
                    <svg className="button-icon" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-.878a2.25 2.25 0 114.5 0v.878c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V5.372a3.75 3.75 0 10-7.5 0zM10.5 1.5h-3a.75.75 0 010-1.5h3a.75.75 0 010 1.5z"></path>
                    </svg>
                    Fork
                  </button> */}
                </div>
              )}
            </div>
            <nav className="repo-tabs">
              <a href="#" className="tab-item active">Code</a>
              {/* <a href="#" className="tab-item">Issues</a>
              <a href="#" className="tab-item">Pull requests</a>
              <a href="#" className="tab-item">Actions</a>
              <a href="#" className="tab-item">Projects</a>
              <a href="#" className="tab-item">Security</a>
              <a href="#" className="tab-item">Insights</a> */}
            </nav>
          </div>
          <div className="file-explorer-container">
            <FileExplorer
              repoName={repoName}
              onFileSelect={(file) => {
                console.log("App: file selected:", file);
                setSelectedFile(file);
              }}
            />
            <FileViewer
              repoName={repoName}
              selectedFile={selectedFile}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
