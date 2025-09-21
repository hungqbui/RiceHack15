import { useEffect, useState } from "react";
import "./SideBar.css";

const SideBarRight = () => {

    const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true);

    return (
        <div className="sidebar-container-right">
            <button
                className={`sidebar-toggle toggle-right ${rightSidebarCollapsed ? 'collapsed' : ''}`}
                onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
            >
                {rightSidebarCollapsed ? '<' : '>'}
            </button>
                <aside className={`sidebar sidebar-right ${rightSidebarCollapsed ? 'collapsed' : ''}`}>
                 <div className="sidebar-section">
                    <h2>Available tools</h2>
                    <div className="recommend-actions">
                        <button>Summarize materials</button>
                        <button>Create Quiz / Exam</button>
                        <button>Converse w/ Tutor</button>
                    </div>
                    <div className="placeholder-box"></div>
                 </div>
            </aside>
        </div>
    );
}

export default SideBarRight;
