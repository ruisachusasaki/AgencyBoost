import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Clock, CheckCircle2, XCircle, AlertCircle, Trophy, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer';
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points: number;
  order: number;
}

interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  description?: string;
  passingScore: number;
  maxAttempts: number;
  timeLimit?: number;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  isRequired: boolean;
  questions: QuizQuestion[];
}

interface QuizAttempt {
  id: string;
  score: number;
  isPassed: boolean;
  attemptNumber: number;
  submittedAt: string;
}

interface QuizTakerProps {
  quiz: Quiz;
  onComplete?: () => void;
}

export function QuizTaker({ quiz, onComplete }: QuizTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    quiz.timeLimit ? quiz.timeLimit * 60 : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const { toast } = useToast();

  // Shuffle questions if needed
  const [questions] = useState(() => {
    if (quiz.shuffleQuestions) {
      return [...quiz.questions].sort(() => Math.random() - 0.5);
    }
    return quiz.questions;
  });

  // Load previous attempts
  useEffect(() => {
    const loadAttempts = async () => {
      try {
        const response = await fetch(`/api/training/quizzes/${quiz.id}/attempts`);
        if (response.ok) {
          const attemptsData = await response.json();
          setAttempts(attemptsData);
        }
      } catch (error) {
        console.error('Error loading attempts:', error);
      } finally {
        setIsLoadingAttempts(false);
      }
    };

    loadAttempts();
  }, [quiz.id]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isCompleted) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, isCompleted]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/training/quizzes/${quiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit quiz');
      }

      const resultData = await response.json();
      setResult(resultData);
      setIsCompleted(true);

      toast({
        title: resultData.isPassed ? "Quiz Passed!" : "Quiz Completed",
        description: `You scored ${resultData.score}% (${resultData.earnedPoints}/${resultData.totalPoints} points)`,
        variant: resultData.isPassed ? "default" : "destructive"
      });

      onComplete?.();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: "Submission Error",
        variant: "success",
        description: error instanceof Error ? error.message : "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canRetake = () => {
    return quiz.maxAttempts === 0 || attempts.length < quiz.maxAttempts;
  };

  const retakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTimeRemaining(quiz.timeLimit ? quiz.timeLimit * 60 : null);
    setIsCompleted(false);
    setResult(null);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoadingAttempts) {
    return <div className="p-6 text-center">Loading quiz...</div>;
  }

  // Check if max attempts reached
  if (!canRetake() && !isCompleted) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Maximum Attempts Reached</h3>
          <p className="text-gray-600 mb-4">
            You have used all {quiz.maxAttempts} attempts for this quiz.
          </p>
          {attempts.length > 0 && (
            <div className="text-sm text-gray-500">
              Best score: {Math.max(...attempts.map(a => a.score))}%
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show results
  if (isCompleted && result) {
    return (
      <Card>
        <CardHeader className="text-center">
          <div className={cn(
            "mx-auto mb-4 p-3 rounded-full",
            result.isPassed ? "bg-green-100" : "bg-red-100"
          )}>
            {result.isPassed ? (
              <Trophy className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          <CardTitle className={cn(
            "text-2xl",
            result.isPassed ? "text-green-600" : "text-red-600"
          )}>
            {result.isPassed ? "Quiz Passed!" : "Quiz Not Passed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">{result.score}%</div>
            <div className="text-gray-600">
              {result.earnedPoints} out of {result.totalPoints} points
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Passing score: {quiz.passingScore}%
            </div>
          </div>

          <Separator />

          {/* Previous Attempts */}
          {attempts.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Previous Attempts</h4>
              <div className="space-y-2">
                {attempts.map((attempt, index) => (
                  <div key={attempt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant={attempt.isPassed ? "default" : "secondary"}>
                        Attempt {attempt.attemptNumber}
                      </Badge>
                      <span className="font-medium">{attempt.score}%</span>
                      {attempt.isPassed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(attempt.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show correct answers if enabled and quiz not passed */}
          {quiz.showCorrectAnswers && !result.isPassed && (
            <div>
              <h4 className="font-semibold mb-3">Review Answers</h4>
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const userAnswer = answers[question.id];
                  const isCorrect = userAnswer === question.correctAnswer;
                  
                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <Badge variant={isCorrect ? "default" : "destructive"}>
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium mb-2">{question.question}</p>
                          {question.questionType === 'multiple_choice' && (
                            <div className="space-y-1">
                              {question.options.map((option, optionIndex) => {
                                const isUserAnswer = userAnswer === optionIndex.toString();
                                const isCorrectAnswer = question.correctAnswer === optionIndex.toString();
                                
                                return (
                                  <div
                                    key={optionIndex}
                                    className={cn(
                                      "p-2 rounded text-sm",
                                      isCorrectAnswer && "bg-green-100 text-green-800",
                                      isUserAnswer && !isCorrectAnswer && "bg-red-100 text-red-800"
                                    )}
                                  >
                                    {option}
                                    {isCorrectAnswer && " ✓"}
                                    {isUserAnswer && !isCorrectAnswer && " ✗"}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {question.questionType === 'true_false' && (
                            <div className="space-y-1">
                              {question.options.map((option, optionIndex) => {
                                const isUserAnswer = userAnswer === optionIndex.toString();
                                const isCorrectAnswer = question.correctAnswer === optionIndex.toString();
                                
                                return (
                                  <div
                                    key={optionIndex}
                                    className={cn(
                                      "p-2 rounded text-sm",
                                      isCorrectAnswer && "bg-green-100 text-green-800",
                                      isUserAnswer && !isCorrectAnswer && "bg-red-100 text-red-800"
                                    )}
                                  >
                                    {option}
                                    {isCorrectAnswer && " ✓"}
                                    {isUserAnswer && !isCorrectAnswer && " ✗"}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {question.explanation && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Retake Button */}
          {canRetake() && (
            <div className="text-center">
              <Button onClick={retakeQuiz} variant="outline" data-testid="button-retake-quiz">
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake Quiz
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Quiz interface
  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{quiz.title}</CardTitle>
              {quiz.description && (
                <p className="text-gray-600 mt-1">{quiz.description}</p>
              )}
            </div>
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span className={cn(
                  "font-mono",
                  timeRemaining < 300 && "text-red-600 font-bold"
                )}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
            <span>{quiz.passingScore}% to pass</span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Badge variant="outline">{currentQuestionIndex + 1}</Badge>
            <div className="flex-1">
              <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
              <div className="text-sm text-gray-500 mt-1">
                {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.questionType === 'multiple_choice' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => setAnswer(currentQuestion.id, value)}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`option-${index}`}
                    data-testid={`radio-option-${index}`}
                  />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer p-2 rounded hover:bg-gray-50">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.questionType === 'true_false' && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(value) => setAnswer(currentQuestion.id, value)}
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`tf-${index}`}
                    data-testid={`radio-tf-${index}`}
                  />
                  <Label htmlFor={`tf-${index}`} className="flex-1 cursor-pointer p-2 rounded hover:bg-gray-50">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {currentQuestion.questionType === 'short_answer' && (
            <Input
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
              placeholder="Enter your answer..."
              data-testid="input-short-answer"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={previousQuestion}
          disabled={currentQuestionIndex === 0}
          data-testid="button-previous"
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {questions.map((_, index) => (
            <Button
              key={index}
              variant={index === currentQuestionIndex ? "default" : "outline"}
              size="sm"
              onClick={() => goToQuestion(index)}
              className={cn(
                "w-8 h-8 p-0",
                answers[questions[index].id] && index !== currentQuestionIndex && "bg-green-100"
              )}
              data-testid={`button-question-${index + 1}`}
            >
              {index + 1}
            </Button>
          ))}
        </div>

        {currentQuestionIndex === questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(answers).length !== questions.length}
            data-testid="button-submit-quiz"
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        ) : (
          <Button
            onClick={nextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            data-testid="button-next"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}