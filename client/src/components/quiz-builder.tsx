import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, GripVertical, CheckCircle2 } from "lucide-react";
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

interface QuizData {
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

interface QuizBuilderProps {
  initialQuiz?: Partial<QuizData>;
  onSave: (quiz: QuizData) => void;
  onCancel?: () => void;
}

export function QuizBuilder({ initialQuiz, onSave, onCancel }: QuizBuilderProps) {
  const [quiz, setQuiz] = useState<QuizData>({
    title: initialQuiz?.title || "",
    description: initialQuiz?.description || "",
    passingScore: initialQuiz?.passingScore || 70,
    maxAttempts: initialQuiz?.maxAttempts || 3,
    timeLimit: initialQuiz?.timeLimit,
    shuffleQuestions: initialQuiz?.shuffleQuestions || false,
    showCorrectAnswers: initialQuiz?.showCorrectAnswers || true,
    isRequired: initialQuiz?.isRequired || true,
    questions: initialQuiz?.questions || []
  });

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q_${Date.now()}`,
      question: "",
      questionType: 'multiple_choice',
      options: ["", ""],
      correctAnswer: "0",
      explanation: "",
      points: 1,
      order: quiz.questions.length
    };
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      )
    }));
  };

  const deleteQuestion = (questionId: string) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== questionId)
    }));
  };

  const addOption = (questionId: string) => {
    const question = quiz.questions.find(q => q.id === questionId);
    if (question && question.options.length < 6) {
      updateQuestion(questionId, {
        options: [...question.options, ""]
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = quiz.questions.find(q => q.id === questionId);
    if (question) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    const question = quiz.questions.find(q => q.id === questionId);
    if (question && question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      updateQuestion(questionId, { 
        options: newOptions,
        correctAnswer: question.correctAnswer === optionIndex.toString() ? "0" : question.correctAnswer
      });
    }
  };

  const setCorrectAnswer = (questionId: string, optionIndex: number) => {
    updateQuestion(questionId, { correctAnswer: optionIndex.toString() });
  };

  const handleSave = () => {
    if (!quiz.title.trim() || quiz.questions.length === 0) {
      return;
    }
    onSave(quiz);
  };

  return (
    <div className="space-y-6">
      {/* Quiz Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quiz-title">Quiz Title *</Label>
              <Input
                id="quiz-title"
                value={quiz.title}
                onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter quiz title"
                data-testid="input-quiz-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="passing-score">Passing Score (%)</Label>
              <Input
                id="passing-score"
                type="number"
                min="0"
                max="100"
                value={quiz.passingScore}
                onChange={(e) => setQuiz(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))}
                data-testid="input-passing-score"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-attempts">Max Attempts (0 = unlimited)</Label>
              <Input
                id="max-attempts"
                type="number"
                min="0"
                value={quiz.maxAttempts}
                onChange={(e) => setQuiz(prev => ({ ...prev, maxAttempts: parseInt(e.target.value) || 0 }))}
                data-testid="input-max-attempts"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-limit">Time Limit (minutes, optional)</Label>
              <Input
                id="time-limit"
                type="number"
                min="1"
                value={quiz.timeLimit || ""}
                onChange={(e) => setQuiz(prev => ({ ...prev, timeLimit: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="No time limit"
                data-testid="input-time-limit"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-description">Description (optional)</Label>
            <Textarea
              id="quiz-description"
              value={quiz.description}
              onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter quiz description or instructions"
              rows={3}
              data-testid="textarea-quiz-description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="shuffle-questions"
                checked={quiz.shuffleQuestions}
                onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, shuffleQuestions: checked }))}
                data-testid="switch-shuffle-questions"
              />
              <Label htmlFor="shuffle-questions">Shuffle Questions</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-correct-answers"
                checked={quiz.showCorrectAnswers}
                onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, showCorrectAnswers: checked }))}
                data-testid="switch-show-correct-answers"
              />
              <Label htmlFor="show-correct-answers">Show Correct Answers</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is-required"
                checked={quiz.isRequired}
                onCheckedChange={(checked) => setQuiz(prev => ({ ...prev, isRequired: checked }))}
                data-testid="switch-is-required"
              />
              <Label htmlFor="is-required">Required Quiz</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Questions ({quiz.questions.length})</h3>
          <Button onClick={addQuestion} data-testid="button-add-question">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        {quiz.questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                  <Badge variant="outline">Question {index + 1}</Badge>
                  <Badge variant="secondary">{question.points} point{question.points !== 1 ? 's' : ''}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={question.questionType}
                    onValueChange={(value: 'multiple_choice' | 'true_false' | 'short_answer') => 
                      updateQuestion(question.id, { 
                        questionType: value,
                        options: value === 'true_false' ? ['True', 'False'] : value === 'multiple_choice' ? ['', ''] : [],
                        correctAnswer: '0'
                      })
                    }
                  >
                    <SelectTrigger className="w-40" data-testid={`select-question-type-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteQuestion(question.id)}
                    data-testid={`button-delete-question-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Question Text */}
              <div className="space-y-2">
                <Label>Question *</Label>
                <Textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                  placeholder="Enter your question here"
                  rows={2}
                  data-testid={`textarea-question-${index}`}
                />
                <div className="text-sm text-gray-500 text-right">
                  {question.question.length}/1000 characters
                </div>
              </div>

              {/* Answer Options */}
              {(question.questionType === 'multiple_choice' || question.questionType === 'true_false') && (
                <div className="space-y-3">
                  <Label>Answer Options</Label>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={question.correctAnswer === optionIndex.toString()}
                          onCheckedChange={() => setCorrectAnswer(question.id, optionIndex)}
                          className="rounded-full"
                          data-testid={`checkbox-correct-answer-${index}-${optionIndex}`}
                        />
                        <Label className="text-sm text-gray-600">Correct</Label>
                      </div>
                      <div className="flex-1 relative">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                          disabled={question.questionType === 'true_false'}
                          data-testid={`input-option-${index}-${optionIndex}`}
                        />
                        {question.correctAnswer === optionIndex.toString() && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 absolute right-3 top-1/2 transform -translate-y-1/2" />
                        )}
                      </div>
                      {question.questionType === 'multiple_choice' && question.options.length > 2 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeOption(question.id, optionIndex)}
                          data-testid={`button-remove-option-${index}-${optionIndex}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="text-sm text-gray-500 min-w-0">
                        {option.length}/500
                      </div>
                    </div>
                  ))}
                  
                  {question.questionType === 'multiple_choice' && question.options.length < 6 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addOption(question.id)}
                      data-testid={`button-add-option-${index}`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Option
                    </Button>
                  )}
                </div>
              )}

              {/* Short Answer */}
              {question.questionType === 'short_answer' && (
                <div className="space-y-2">
                  <Label>Correct Answer</Label>
                  <Input
                    value={question.correctAnswer}
                    onChange={(e) => updateQuestion(question.id, { correctAnswer: e.target.value })}
                    placeholder="Enter the correct answer"
                    data-testid={`input-short-answer-${index}`}
                  />
                </div>
              )}

              {/* Explanation */}
              <div className="space-y-2">
                <Label>Explanation (optional)</Label>
                <Textarea
                  value={question.explanation || ""}
                  onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                  placeholder="Explain why this is the correct answer"
                  rows={2}
                  data-testid={`textarea-explanation-${index}`}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={question.points}
                    onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
                    className="w-20"
                    data-testid={`input-points-${index}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {quiz.questions.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-gray-500 mb-4">
                <Plus className="h-12 w-12 mx-auto mb-2" />
                <p>No questions added yet</p>
                <p className="text-sm">Add your first question to get started</p>
              </div>
              <Button onClick={addQuestion} data-testid="button-add-first-question">
                Add Question
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <Separator />
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} data-testid="button-cancel-quiz">
            Cancel
          </Button>
        )}
        <Button 
          onClick={handleSave} 
          disabled={!quiz.title.trim() || quiz.questions.length === 0}
          data-testid="button-save-quiz"
        >
          Save Quiz
        </Button>
      </div>
    </div>
  );
}