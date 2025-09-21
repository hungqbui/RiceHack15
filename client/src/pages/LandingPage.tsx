import React, { useState, useEffect } from "react";
import SearchBar from "../components/seachbar";
import Loader from "../components/Loader.tsx";
import SideBar from "../components/SideBar.tsx";
import Clock from "../components/Clock.tsx";
import OwlIcon from "/logo.png";
import SideBarRight from "../components/SideBarRight.tsx";
import { useAuth } from "../contexts/AuthContext";

const LandingPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [chosenFolders, setChosenFolders] = useState<Set<string>>(new Set());
  

  const { logout, user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAiResponse(null);
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
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: gradientStyles }} />
      <div className="app-container">
        <SideBar />
      <main className="main-content">
                <div className="header-container">
                  <div className="header-controls">
                      <Clock time={time} />
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
                              style={{ margin: "0 10px" }}
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
                <p>{aiResponse}</p>
              </div>
            ) : (
              <div className="welcome-message" style={{ textAlign: "center" }}>
                <img src={OwlIcon} className="owl-icon" alt="Owl Icon" style={{ width: "15%" }} />
                <h1>Welcome to Owlai</h1>
                <p>Ask me anything to get started.</p>
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
        <SideBarRight />
    </div>
    </>
  );
};

export default LandingPage;
