import React from "react";
import QuestionsList from "../components/questionsList";
import QuizSettings from "../components/quizSettingComponent";
const QuizExam = () => {
  return (
    <div>
      <h1>Quiz Exam</h1>
      <QuestionsList questions={[]} />
      <QuizSettings />
    </div>
  );
};

export default QuizExam;
