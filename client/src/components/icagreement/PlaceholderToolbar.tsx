import { Button } from "@/components/ui/button";

interface PlaceholderToolbarProps {
  onInsert: (placeholder: string) => void;
}

const placeholderGroups = [
  {
    label: "Candidate Information",
    items: [
      { key: "candidate_name", description: "Applicant's full name" },
      { key: "position", description: "Position being offered" },
      { key: "start_date", description: "Their start date" },
    ],
  },
  {
    label: "Compensation",
    items: [
      { key: "compensation", description: "Pay rate or amount" },
      { key: "compensation_type", description: "e.g. per hour / per month" },
    ],
  },
  {
    label: "Offer Details",
    items: [
      { key: "offer_date", description: "Date offer was sent" },
      { key: "custom_terms", description: "Additional custom terms" },
    ],
  },
  {
    label: "Company",
    items: [
      { key: "manager_name", description: "Hiring manager's full name" },
      { key: "company_name", description: "The Media Optimizers" },
    ],
  },
];

export default function PlaceholderToolbar({ onInsert }: PlaceholderToolbarProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Dynamic Fields</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Click any field to insert it at your cursor position in the agreement
        </p>
      </div>

      {placeholderGroups.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.items.map((item) => (
              <Button
                key={item.key}
                variant="outline"
                size="sm"
                className="text-xs border-[hsl(179,100%,39%)] text-[hsl(179,100%,39%)] hover:bg-[hsl(179,100%,39%)]/10 h-7"
                onClick={() => onInsert(`{{${item.key}}}`)}
                title={item.description}
              >
                {item.key}
              </Button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
