// Quiz Generation Utility
// Reusable utility for generating quizzes using AI with document context and user preferences

export interface QuizGenerationOptions {
  fileIds: string[];
  quizType: 'multiple_choice' | 'blank_filling';
  numQuestions: number;
  quizPrompt?: string;
}

export interface QuizResponse {
  status: string;
  quiz?: {
    questions: Array<{
      question?: string;
      text?: string;
      options?: string[];
      correct_answer?: string | number;
      answer?: string;
    }>;
    raw_response?: string;
  };
  message?: string;
  error?: string;
}

/**
 * Generate quiz using AI with document context and user preferences
 * @param options Quiz generation options including file IDs, quiz type, and number of questions
 * @returns Promise<QuizResponse> API response with generated quiz data
 */
export const generateQuizFromAPI = async (options: QuizGenerationOptions): Promise<QuizResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const requestBody = {
      file_ids: options.fileIds.length > 0 ? options.fileIds : null,
      quiz_type: options.quizType === 'blank_filling' ? 'short_answer' : options.quizType,
      num_questions: options.numQuestions || 5,
      quiz_prompt: options.quizPrompt || 'Generate educational quiz questions based on the provided materials. Focus on key concepts and important information.'
    };

    console.log('Quiz Generation Request:', requestBody);
    console.log('File IDs being sent:', options.fileIds);

    const response = await fetch('http://localhost:5000/api/quiz/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
      throw new Error(`Quiz generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Quiz Generation Response:', data);
    return data;
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
};

/**
 * Simplified wrapper function for common quiz generation scenarios
 * @param fileIds Array of document IDs to use as context
 * @param quizType Type of quiz questions to generate
 * @param numQuestions Number of questions to generate
 * @returns Promise<QuizResponse> API response with generated quiz data
 */
export const generateQuiz = async (
  fileIds: string[], 
  quizType: 'multiple_choice' | 'blank_filling', 
  numQuestions: number
): Promise<QuizResponse> => {
  return generateQuizFromAPI({
    fileIds,
    quizType,
    numQuestions
  });
};