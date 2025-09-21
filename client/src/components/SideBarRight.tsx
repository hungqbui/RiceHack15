import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SideBar.css";
import { useChosenDocuments } from "../contexts/ChosenDocumentsContext";
import ragChat from "../utils/ragChat";

interface SideBarRightProps {
  onSummaryResponse?: (response: string, searchTerm: string) => void;
}

const SideBarRight = ({ onSummaryResponse }: SideBarRightProps) => {

    const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { getChosenDocumentsArray } = useChosenDocuments();

    const handleSummarize = async () => {
        try {
            setIsLoading(true);
            const chosenDocumentIds = getChosenDocumentsArray();
            const summarizePrompt = "Please provide a comprehensive summary of the materials provided.";
            
            const response = await ragChat(summarizePrompt, chosenDocumentIds.length > 0 ? chosenDocumentIds : undefined);
            
            // Send the response to the main chat area via callback
            if (response.status === 'success' && onSummaryResponse) {
                onSummaryResponse(response.answer, "Summary of Materials");
            }
            
        } catch (error) {
            console.error('Error generating summary:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateQuiz = async () => {
        try {
            setIsLoading(true);
            // Navigate to quiz page
            navigate('/quiz');
            
        } catch (error) {
            console.error('Error generating quiz:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
                        <button 
                            onClick={handleSummarize}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Summarizing...' : 'Summarize materials'}
                        </button>
                        <button 
                            onClick={handleCreateQuiz}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating Quiz...' : 'Create Quiz / Exam'}
                        </button>
                        <button>Converse w/ Tutor</button>
                    </div>
                    <div className="placeholder-box"></div>
                 </div>
            </aside>
        </div>
    );
}

export default SideBarRight;
