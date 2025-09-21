import React, { useState, useEffect } from "react";
import SearchBar from "../components/seachbar";
import Loader from "../components/Loader.tsx";
import SideBar from "../components/SideBar.tsx";
import Clock from "../components/Clock.tsx";
import OwlIcon from "/logo.png";
import SideBarRight from "../components/SideBarRight.tsx";
import { useAuth } from "../contexts/AuthContext";
import { ChosenDocumentsProvider, useChosenDocuments } from "../contexts/ChosenDocumentsContext";
import ragChat from "../utils/ragChat";
import { marked } from 'marked';

const LandingPageContent = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [time] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const { logout } = useAuth();
  const { getChosenDocumentsArray } = useChosenDocuments();

  // Configure marked for safe HTML rendering
  marked.setOptions({
    breaks: true, // Convert \n to <br>
    gfm: true,    // Enable GitHub flavored markdown
  });

  // Function to render markdown to HTML safely
  const renderMarkdown = (text: string) => {
    return marked(text);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    setAiResponse(null);
    setError(null);
    
    try {
      const chosenDocumentIds = getChosenDocumentsArray();
      
      console.log("Chosen documents:", chosenDocumentIds);
      
      // Call RAG chat with specific file IDs if documents are chosen
      const response = await ragChat(searchTerm, chosenDocumentIds.length > 0 ? chosenDocumentIds : undefined);
      
      if (response.status === 'success') {
        setAiResponse(response.answer);
        // Store additional response info for display context
        (window as any).lastChatResponse = {
          context_summary: response.context_summary,
          total_chunks: response.total_chunks,
          found_files: response.found_files
        };
      } else {
        setError(response.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle summary response from SideBarRight
  const handleSummaryResponse = (response: string, searchTerm: string) => {
    setSearchTerm(searchTerm);
    setAiResponse(response);
    setError(null);
    // Store summary context info
    (window as any).lastChatResponse = {
      context_summary: null,
      total_chunks: null,
      found_files: null,
      isSummary: true
    };
  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [darkMode]);

  // Blue to white gradient animation
  const gradientStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    body, html, #root {
        font-family: 'Inter', sans-serif;
        margin: 0;
        padding: 0;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #e0f7fa, #0077b6, #e0f7fa);
        background-size: 400% 400%;
        animation: gradientBG 30s linear infinite;
    }

    @keyframes gradientBG {
        0% { background-position: 0% 0%; }
        50% { background-position: 100% 100%; }
        100% { background-position: 0% 0%; }
    }

    .app-container {
        display: flex;
        width: 100%;
        max-width: 1200px;
        background: rgba(255, 255, 255, 0.85);
        border-radius: 1rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
    }

    /* Markdown content styling */
    .markdown-content h1, .markdown-content h2, .markdown-content h3, 
    .markdown-content h4, .markdown-content h5, .markdown-content h6 {
        margin-top: 1.5em;
        margin-bottom: 0.5em;
        font-weight: 600;
        line-height: 1.3;
    }

    .markdown-content h1 { font-size: 1.8em; color: #2c3e50; }
    .markdown-content h2 { font-size: 1.5em; color: #34495e; }
    .markdown-content h3 { font-size: 1.3em; color: #34495e; }
    .markdown-content h4 { font-size: 1.1em; color: #34495e; }

    .markdown-content p {
        margin-bottom: 1em;
        line-height: 1.6;
    }

    .markdown-content ul, .markdown-content ol {
        margin: 1em 0;
        padding-left: 2em;
    }

    .markdown-content li {
        margin-bottom: 0.5em;
        line-height: 1.5;
    }

    .markdown-content code {
        background-color: #f1f3f4;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
        color: #d63384;
    }

    .markdown-content pre {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 6px;
        padding: 1em;
        overflow-x: auto;
        margin: 1em 0;
    }

    .markdown-content pre code {
        background-color: transparent;
        padding: 0;
        color: #212529;
    }

    .markdown-content blockquote {
        border-left: 4px solid #0077b6;
        background-color: #f8f9fa;
        margin: 1em 0;
        padding: 0.5em 1em;
        font-style: italic;
    }

    .markdown-content table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
    }

    .markdown-content th, .markdown-content td {
        border: 1px solid #ddd;
        padding: 8px 12px;
        text-align: left;
    }

    .markdown-content th {
        background-color: #f8f9fa;
        font-weight: 600;
    }

    .markdown-content strong {
        font-weight: 600;
        color: #2c3e50;
    }

    .markdown-content em {
        font-style: italic;
        color: #5a6c7d;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: gradientStyles }} />
      <div className="app-container">
        <SideBar />
        <main className="main-content">
          <div className="header-container">
            <div className="header-controls">
                <div className="clock-margin">
                  <Clock time={time} />
                </div>
                <div className="dark-mode-toggle" onMouseUp={() => { setDarkMode(!darkMode) }}>
                    <span>{darkMode ? '🌙' : '☀️'} Dark Mode</span>
                    <label className="toggle-switch">
                        <input id="dark-mode-toggle" type="checkbox" checked={darkMode} readOnly />
                        <span className="slider"></span>
                    </label>
                </div>
                <div className="user-info">
                    <button 
                        onClick={logout}
                        className="logout-button"
                        title="Logout"
                        style={{ 
                          margin: "0 10px", 
                          borderRadius: "16px", 
                          backgroundColor: "lightred",
                          height: "40px"
                        }}
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>
          </div>

          <div className="center-area">
            {isLoading ? (
              <Loader />
            ) : aiResponse ? (
              <div className="ai-response-container">
                <h3>Response for "{searchTerm}"</h3>
                <div style={{ 
                  maxHeight: "400px", 
                  overflowY: "auto", 
                  padding: "15px", 
                  border: "1px solid #ddd", 
                  borderRadius: "8px",
                  backgroundColor: "#f9f9f9"
                }}>
                  <div 
                    className="markdown-content"
                    style={{ lineHeight: "1.6" }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(aiResponse) }}
                  />
                </div>
                {getChosenDocumentsArray().length > 0 && (
                  <div style={{ fontSize: "0.9em", color: "#666", marginTop: "10px" }}>
                    {(window as any).lastChatResponse?.isSummary ? (
                      <p>Summary generated from {getChosenDocumentsArray().length} selected document(s)</p>
                    ) : (
                      <>
                        <p>Searched in {getChosenDocumentsArray().length} selected document(s)</p>
                        {/* Show additional context info if available */}
                        {(window as any).lastChatResponse?.context_summary && (
                          <p>
                            Found content in {(window as any).lastChatResponse.context_summary.files_used} files 
                            ({(window as any).lastChatResponse.total_chunks} relevant sections)
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : error ? (
              <div className="error-container" style={{ textAlign: "center", color: "red" }}>
                <h3>Error</h3>
                <p>{error}</p>
              </div>
            ) : (
              <div className="welcome-message" style={{ textAlign: "center" }}>
                <img src={OwlIcon} className="owl-icon" alt="Owl Icon" style={{ width: "15%" }} />
                <h1>Welcome to Owlai</h1>
                <p>Ask me anything to get started.</p>
                <p style={{ fontSize: "0.9em", color: "#666" }}>
                  {getChosenDocumentsArray().length > 0 
                    ? `Searching in ${getChosenDocumentsArray().length} selected document(s)` 
                    : "Select documents from the sidebar to search specific content"
                  }
                </p>
              </div>
            )}
          </div>

            <div className="search-container" style={{ marginBottom: "20px" }}>
                <form className="search-form" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                        </svg>
                    </button>
                </form>
            </div>
        </main>
        <SideBarRight onSummaryResponse={handleSummaryResponse} />
      </div>
    </>
  );
};

const LandingPage = () => {
  return (
    <ChosenDocumentsProvider>
      <LandingPageContent />
    </ChosenDocumentsProvider>
  );
};

export default LandingPage;
