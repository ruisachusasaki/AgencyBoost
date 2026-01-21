import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, User, Mail, Phone, Briefcase, ChevronDown, ChevronUp } from "lucide-react";

export interface ContactCardEntry {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
}

interface ContactCardFieldProps {
  value: ContactCardEntry[];
  onChange: (value: ContactCardEntry[]) => void;
  maxContacts?: number;
  disabled?: boolean;
  fieldName?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export default function ContactCardField({
  value = [],
  onChange,
  maxContacts = 10,
  disabled = false,
  fieldName = "Contacts"
}: ContactCardFieldProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const lastNormalizedRef = useRef<string>("");

  const contacts = Array.isArray(value) ? value : [];
  const needsNormalization = contacts.some(c => !c.id);
  
  const normalizedContacts = needsNormalization 
    ? contacts.map(contact => ({
        ...contact,
        id: contact.id || generateId()
      }))
    : contacts;

  useEffect(() => {
    if (!needsNormalization) return;
    
    const signature = JSON.stringify(normalizedContacts.map(c => c.id));
    if (signature === lastNormalizedRef.current) return;
    
    lastNormalizedRef.current = signature;
    onChange(normalizedContacts);
    
    const emptyContacts = normalizedContacts.filter(c => !c.name && !c.email);
    if (emptyContacts.length > 0) {
      setExpandedCards(new Set(emptyContacts.map(c => c.id)));
    }
  }, [needsNormalization, normalizedContacts, onChange]);

  const addContact = () => {
    if (normalizedContacts.length >= maxContacts) return;
    const newContact: ContactCardEntry = {
      id: generateId(),
      name: "",
      position: "",
      email: "",
      phone: ""
    };
    onChange([...normalizedContacts, newContact]);
    setExpandedCards(prev => new Set(prev).add(newContact.id));
  };

  const removeContact = (id: string) => {
    onChange(normalizedContacts.filter(c => c.id !== id));
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateContact = (id: string, field: keyof ContactCardEntry, fieldValue: string) => {
    onChange(normalizedContacts.map(c => c.id === id ? { ...c, [field]: fieldValue } : c));
  };

  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{fieldName}</Label>
        <span className="text-xs text-muted-foreground">
          {normalizedContacts.length} / {maxContacts} contacts
        </span>
      </div>

      {normalizedContacts.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-6 text-center">
          <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-3">No contacts added yet</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addContact}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Contact
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {normalizedContacts.map((contact, index) => {
            const isExpanded = expandedCards.has(contact.id);
            const hasContent = contact.name || contact.email || contact.phone || contact.position;

            return (
              <Card key={contact.id} className="border border-border">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpanded(contact.id)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#00C9C6]/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-[#00C9C6]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {contact.name || `Contact ${index + 1}`}
                      </p>
                      {contact.position && (
                        <p className="text-xs text-muted-foreground">{contact.position}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeContact(contact.id);
                      }}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="pt-0 pb-4 px-4 border-t border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" /> Name
                        </Label>
                        <Input
                          value={contact.name}
                          onChange={(e) => updateContact(contact.id, "name", e.target.value)}
                          placeholder="Contact name"
                          disabled={disabled}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" /> Position
                        </Label>
                        <Input
                          value={contact.position}
                          onChange={(e) => updateContact(contact.id, "position", e.target.value)}
                          placeholder="e.g. CMO, CTO, Account Manager"
                          disabled={disabled}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> Email
                        </Label>
                        <Input
                          type="email"
                          value={contact.email}
                          onChange={(e) => updateContact(contact.id, "email", e.target.value)}
                          placeholder="email@example.com"
                          disabled={disabled}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> Phone
                        </Label>
                        <Input
                          type="tel"
                          value={contact.phone}
                          onChange={(e) => updateContact(contact.id, "phone", e.target.value)}
                          placeholder="(555) 123-4567"
                          disabled={disabled}
                          className="h-9"
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {normalizedContacts.length > 0 && normalizedContacts.length < maxContacts && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addContact}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Another Contact
        </Button>
      )}

      {normalizedContacts.length >= maxContacts && (
        <p className="text-xs text-muted-foreground text-center">
          Maximum of {maxContacts} contacts reached
        </p>
      )}
    </div>
  );
}
