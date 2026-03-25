import React, { useState } from 'react';
import { X, CheckCircle2, ChevronRight, RefreshCw, Award } from 'lucide-react';

export default function QuizModal({ quizData, onClose }) {
  const [started, setStarted] = useState(false);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  if (!quizData || !quizData.questions) return null;

  const questions = quizData.questions;
  const currentQ = questions[currentQIdx];
  const totalQ = questions.length;
  
  const handleSelectOption = (optIdx) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [currentQIdx]: optIdx }));
  };

  const handleNext = () => {
    if (currentQIdx < totalQ - 1) {
      setCurrentQIdx(prev => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answerIndex) score++;
    });
    return score;
  };

  const S = {
    overlay: "fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4",
    modal: "relative w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col",
    textPrimary: "text-[var(--color-primary-text)]",
    textMuted: "text-[var(--color-muted-text)]"
  };

  const startScreen = (
    <div className="p-10 text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6">
        <Award size={32} className="text-indigo-500" />
      </div>
      <h2 className={`text-2xl font-bold mb-3 ${S.textPrimary}`}>{quizData.title || 'Knowledge Check'}</h2>
      <p className={`mb-8 ${S.textMuted}`}>{totalQ} questions to test your understanding of this module.</p>
      <button 
        onClick={() => setStarted(true)}
        className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
      >
        Start Quiz
      </button>
    </div>
  );

  const resultsScreen = (
    <div className="p-10 text-center flex flex-col items-center">
      <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 border-4 border-indigo-500/30">
        <span className="text-3xl font-extrabold text-indigo-500">{calculateScore()}/{totalQ}</span>
      </div>
      <h2 className={`text-2xl font-bold mb-2 ${S.textPrimary}`}>Quiz Complete!</h2>
      <p className={`mb-8 ${S.textMuted}`}>Great job completing this module's review.</p>
      <div className="flex gap-4">
        <button 
          onClick={() => { setStarted(false); setShowResults(false); setAnswers({}); setCurrentQIdx(0); }}
          className="px-6 py-2.5 rounded-xl border border-[var(--color-border)] font-semibold flex items-center gap-2 hover:bg-[var(--color-surface-hover)] transition"
        >
          <RefreshCw size={16} /> Retake
        </button>
        <button 
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold transition hover:bg-indigo-700"
        >
          Finish
        </button>
      </div>
    </div>
  );

  const quizScreen = (
    <div className="flex flex-col h-full bg-[var(--color-app-bg)]">
      {/* Quiz Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-500/10 text-indigo-500">
            Q {currentQIdx + 1}/{totalQ}
          </span>
          <span className={`text-sm font-semibold ${S.textMuted}`}>{quizData.title}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-[var(--color-surface-hover)] transition">
          <X size={20} className={S.textMuted} />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-[var(--color-border)]">
        <div 
          className="h-full bg-indigo-500 transition-all duration-300" 
          style={{ width: `${((currentQIdx) / totalQ) * 100}%` }}
        />
      </div>

      {/* Question Content */}
      <div className="p-6 sm:p-10 flex-1 overflow-y-auto">
        <h3 className={`text-xl sm:text-2xl font-bold leading-relaxed mb-8 ${S.textPrimary}`}>
          {currentQ.question}
        </h3>

        <div className="space-y-3">
          {currentQ.options.map((opt, idx) => {
            const isSelected = answers[currentQIdx] === idx;
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${
                  isSelected 
                    ? 'border-indigo-500 bg-indigo-500/5' 
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-indigo-500/50'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  isSelected ? 'border-indigo-500' : 'border-[var(--color-muted-text)]'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                </div>
                <span className={`font-medium ${isSelected ? S.textPrimary : S.textMuted}`}>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quiz Footer */}
      <div className="px-6 py-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex justify-between items-center">
        <span className={`text-sm ${S.textMuted}`}>
          {answers[currentQIdx] !== undefined ? 'Answer recorded' : 'Please select an option'}
        </span>
        <button
          disabled={answers[currentQIdx] === undefined}
          onClick={handleNext}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {currentQIdx === totalQ - 1 ? 'Submit' : 'Next'} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className={S.overlay}>
      <div className={S.modal} onClick={e => e.stopPropagation()}>
        {!started && startScreen}
        {started && !showResults && quizScreen}
        {started && showResults && resultsScreen}
      </div>
    </div>
  );
}
