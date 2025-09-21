import { useEffect, useState } from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface ChalkboardProps {
  boardContent?: string;
}

export const Chalkboard = ({ boardContent = '' }: ChalkboardProps) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (boardContent && boardContent !== displayedContent) {
      console.log('Chalkboard received new content:', boardContent);
      setIsAnimating(true);
      // Simulate writing animation
      setTimeout(() => {
        setDisplayedContent(boardContent);
        setIsAnimating(false);
      }, 500);
    }
  }, [boardContent, displayedContent]);

  const renderContent = () => {
    if (!displayedContent) {
      return (
        <div>
          <p style={{fontSize: '1.5rem', margin: 0, color: 'white'}}>Learning Hub:</p>
          <ul style={{ listStyleType: 'none', paddingLeft: '10px', marginTop: '1rem', color: 'white' }}>
            <li style={{fontSize: '1.2rem'}}>• Key concepts will appear here</li>
            <li style={{fontSize: '1.2rem'}}>• Equations and formulas</li>
            <li style={{fontSize: '1.2rem'}}>• Important notes</li>
          </ul>
        </div>
      );
    }

    // Enhanced LaTeX pattern to catch more formats
    const latexPattern = /\$\$([^$]+)\$\$|\$([^$]+)\$|\\\[([^\]]+)\\\]|\\\(([^)]+)\\\)/g;
    
    // Create a copy of the content to test for LaTeX without consuming the regex
    const contentCopy = displayedContent;
    const hasLatex = latexPattern.test(contentCopy);
    
    // Reset the regex for actual replacement
    latexPattern.lastIndex = 0;

    if (hasLatex) {
      try {
        // Replace LaTeX with rendered HTML
        const renderedContent = displayedContent.replace(latexPattern, (_, displayMath, inlineMath, displayBracket, inlineParen) => {
          const latex = displayMath || inlineMath || displayBracket || inlineParen;
          const isDisplayMode = !!(displayMath || displayBracket);
          
          console.log('Rendering LaTeX:', latex, 'Display mode:', isDisplayMode);
          
          try {
            return katex.renderToString(latex, { 
              throwOnError: false,
              displayMode: isDisplayMode
            });
          } catch (error) {
            console.error('LaTeX rendering error:', error);
            return `<span style="color: #ff6b6b;">[LaTeX Error: ${latex}]</span>`;
          }
        });

        return (
          <div 
            style={{ 
              color: 'white', 
              fontSize: '1.4rem',
              lineHeight: '1.8',
              textAlign: 'center',
              padding: '20px'
            }}
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />
        );
      } catch (error) {
        console.error('Content rendering error:', error);
        return (
          <p style={{ color: 'white', fontSize: '1.3rem' }}>
            {displayedContent}
          </p>
        );
      }
    } else {
      // Regular text content - also try to render any LaTeX that might not have been caught
      const processedContent = displayedContent.replace(/\$([^$]+)\$/g, (match, latex) => {
        try {
          return katex.renderToString(latex, { throwOnError: false });
        } catch (error) {
          return match; // Return original if rendering fails
        }
      });
      
      // Check if any LaTeX was processed
      if (processedContent !== displayedContent) {
        return (
          <div 
            style={{ 
              color: 'white', 
              fontSize: '1.3rem', 
              textAlign: 'center', 
              lineHeight: '1.6',
              padding: '20px'
            }}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        );
      }
      
      return (
        <div style={{ color: 'white', fontSize: '1.3rem', textAlign: 'center', lineHeight: '1.6' }}>
          {displayedContent.split('\n').map((line, index) => (
            <p key={index} style={{ margin: '0.5rem 0' }}>
              {line}
            </p>
          ))}
        </div>
      );
    }
  };

  return (
    <div 
      className="chalkboard"
      style={{
        transition: 'all 0.3s ease',
        opacity: isAnimating ? 0.7 : 1,
        transform: isAnimating ? 'scale(0.98)' : 'scale(1)'
      }}
    >
      {renderContent()}
      
      {isAnimating && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '15px',
          color: 'white',
          fontSize: '0.9rem',
          opacity: 0.7
        }}>
          ✏️ Writing...
        </div>
      )}
    </div>
  );
};

