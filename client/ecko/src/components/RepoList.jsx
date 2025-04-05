// RepoList.js

import React, { useState, useEffect } from "react";
import axios from "axios";

const RepoList = ({ onSelectRepo, searchQuery }) => {
  const [repos, setRepos] = useState([]);

  useEffect(() => {
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/repos");
      if (response.data.success) {
        setRepos(response.data.repos);
      }
    } catch (error) {
      console.error("Error fetching repos:", error);
    }
  };

  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "16px", backgroundColor: "#010409" }}>
      <h2 style={{ marginTop: 0, color: "#7d8590" }}>Repositories</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        {filteredRepos.map((repo) => (
          <div
            key={repo._id}
            onClick={() => onSelectRepo(repo.name)}
            style={{
              cursor: "pointer",
              padding: "14px",
              border: "1px solid #21262d",
              borderRadius: "6px",
              width: "220px",
              backgroundColor: "#0d1117",
              transition: "background-color 0.2s, box-shadow 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#161b22";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#0d1117";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2)";
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#7d8590" }}>
              {repo.name}
            </h3>
            <p style={{ margin: 0, color: "#7d8590", fontSize: "14px" }}>
              {repo.description || "No description available."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepoList;
