import { useQuery } from "@tanstack/react-query";
import { linkifyString } from "@/components/ui/linkify-text";

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface MentionMatch {
  start: number;
  end: number;
  text: string;
  userId?: string;
  userName?: string;
}

interface MentionTextProps {
  text: string;
  className?: string;
}

export function MentionText({ text, className = "" }: MentionTextProps) {
  // Fetch staff data to resolve mention IDs to names
  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  // Parse mentions from the text
  const parseMentions = (content: string): MentionMatch[] => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: MentionMatch[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        userName: match[1],
        userId: match[2],
      });
    }

    return mentions;
  };

  // Get staff member name by ID
  const getStaffName = (userId: string): string => {
    const staffMember = staff.find(s => s.id === userId);
    return staffMember ? `${staffMember.firstName} ${staffMember.lastName}` : "Unknown User";
  };

  // Render text with highlighted mentions
  const renderTextWithMentions = () => {
    const mentions = parseMentions(text);
    if (mentions.length === 0) {
      return <span className={className}>{linkifyString(text)}</span>;
    }

    let lastIndex = 0;
    const parts: (string | JSX.Element)[] = [];

    mentions.forEach((mention, index) => {
      if (mention.start > lastIndex) {
        parts.push(...linkifyString(text.slice(lastIndex, mention.start)));
      }
      
      const actualName = mention.userId ? getStaffName(mention.userId) : mention.userName;
      parts.push(
        <span 
          key={`mention-${index}`}
          className="bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-medium hover:bg-primary/30 transition-colors cursor-pointer"
          title={`Mentioned: ${actualName}`}
          data-testid={`mention-${mention.userId}`}
        >
          @{actualName}
        </span>
      );
      
      lastIndex = mention.end;
    });

    if (lastIndex < text.length) {
      parts.push(...linkifyString(text.slice(lastIndex)));
    }

    return <span className={className}>{parts}</span>;
  };

  return renderTextWithMentions();
}