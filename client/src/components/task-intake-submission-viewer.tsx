import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ClipboardList, User, Calendar, ExternalLink, Link2 } from "lucide-react";
import { format } from "date-fns";

interface SubmissionAnswer {
  questionId: string;
  questionText: string;
  internalLabel: string | null;
  answerValue: string | null;
  questionType: string;
}

interface SubmissionSection {
  sectionId: string;
  sectionName: string;
  wasVisible: boolean;
  answers: SubmissionAnswer[];
}

interface IntakeSubmission {
  id: string;
  taskId: string | null;
  submittedBy: {
    id: string;
    name: string;
  };
  submittedAt: string;
  status: string;
  sections: SubmissionSection[];
}

interface TaskIntakeSubmissionViewerProps {
  taskId: string;
}

function formatAnswerValue(answer: SubmissionAnswer): React.ReactNode {
  if (!answer.answerValue) {
    return <span className="text-muted-foreground italic">No answer provided</span>;
  }

  const value = answer.answerValue;

  switch (answer.questionType) {
    case "multi_choice":
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return (
            <div className="flex flex-wrap gap-1">
              {parsed.map((item, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
            </div>
          );
        }
      } catch {
        return value;
      }
      return value;

    case "url":
      if (value.startsWith("http")) {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
          >
            <Link2 className="h-3 w-3" />
            {value}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      }
      return value;

    case "date":
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return format(date, "MMMM d, yyyy");
        }
      } catch {
        return value;
      }
      return value;

    default:
      return value;
  }
}

export function TaskIntakeSubmissionViewer({ taskId }: TaskIntakeSubmissionViewerProps) {
  const { data: submission, isLoading, error } = useQuery<IntakeSubmission>({
    queryKey: ["/api/tasks", taskId, "intake-submission"],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/intake-submission`);
      if (res.status === 404) {
        return null;
      }
      if (!res.ok) {
        throw new Error("Failed to fetch intake submission");
      }
      return res.json();
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !submission) {
    return null;
  }

  const visibleSections = submission.sections.filter(s => s.wasVisible && s.answers.length > 0);

  if (visibleSections.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5" />
          Intake Form Submission
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            {submission.submittedBy.name}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={[visibleSections[0]?.sectionId]} className="w-full">
          {visibleSections.map((section) => (
            <AccordionItem key={section.sectionId} value={section.sectionId}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  {section.sectionName}
                  <Badge variant="outline" className="text-xs">
                    {section.answers.length} {section.answers.length === 1 ? "answer" : "answers"}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {section.answers.map((answer) => (
                    <div key={answer.questionId} className="border-l-2 border-muted pl-4">
                      <p className="text-sm font-medium text-foreground mb-1">
                        {answer.questionText}
                      </p>
                      <div className="text-sm">
                        {formatAnswerValue(answer)}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
