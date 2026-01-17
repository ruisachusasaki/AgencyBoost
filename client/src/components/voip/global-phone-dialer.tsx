import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Hash, Users, Clock, Delete, Search, User, Building2, PhoneCall, Loader2 } from "lucide-react";
import { useVoip } from "@/hooks/use-voip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  name: string;
  phone: string;
  type: 'client' | 'lead';
  company?: string;
}

export function GlobalPhoneDialer() {
  const [isOpen, setIsOpen] = useState(false);
  const [dialedNumber, setDialedNumber] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [activeTab, setActiveTab] = useState("keypad");
  const { isReady, isConfigured, isConnecting, activeCall, makeCall, error } = useVoip();
  const { toast } = useToast();

  const { data: twilioConfig } = useQuery<{ phoneNumbers: Array<{ id: number; phoneNumber: string; name: string }> }>({
    queryKey: ['/api/integrations/twilio/phone-numbers'],
  });

  const [selectedCallerId, setSelectedCallerId] = useState<string>("");
  const twilioNumbers = twilioConfig?.phoneNumbers || [];

  useEffect(() => {
    if (twilioNumbers.length > 0 && !selectedCallerId) {
      setSelectedCallerId(twilioNumbers[0].phoneNumber);
    }
  }, [twilioNumbers, selectedCallerId]);

  const { data: clientsData } = useQuery<any[]>({
    queryKey: ['/api/clients'],
    enabled: isOpen,
  });

  const { data: leadsData } = useQuery<any[]>({
    queryKey: ['/api/leads'],
    enabled: isOpen,
  });

  const { data: customFieldsData } = useQuery<any[]>({
    queryKey: ['/api/custom-fields', 'client'],
    enabled: isOpen,
  });

  const contacts: Contact[] = useMemo(() => {
    const result: Contact[] = [];
    
    const phoneField = customFieldsData?.find(field => 
      field.name === 'Phone' || field.name === 'phone' || field.name === 'Mobile' || field.name === 'mobile'
    );

    // Handle both array and object with clients property
    const clients = Array.isArray(clientsData) ? clientsData : (clientsData as any)?.clients || [];
    if (clients && Array.isArray(clients)) {
      clients.forEach((client: any) => {
        const customFieldValues = client.customFieldValues as Record<string, any> || {};
        const phoneValue = phoneField ? customFieldValues[phoneField.id] || "" : "";
        const phone = phoneValue || client.phone;
        
        if (phone) {
          result.push({
            id: client.id.toString(),
            name: client.company || client.name || "Unnamed Client",
            phone,
            type: 'client',
            company: client.company
          });
        }
      });
    }

    // Handle both array and object with leads property
    const leads = Array.isArray(leadsData) ? leadsData : (leadsData as any)?.leads || [];
    if (leads && Array.isArray(leads)) {
      leads.forEach((lead: any) => {
        if (lead.phone) {
          result.push({
            id: lead.id,
            name: lead.name || "Unnamed Lead",
            phone: lead.phone,
            type: 'lead',
            company: lead.company
          });
        }
      });
    }

    return result;
  }, [clientsData, leadsData, customFieldsData]);

  const filteredContacts = useMemo(() => {
    if (!contactSearch) return contacts.slice(0, 20);
    const search = contactSearch.toLowerCase();
    return contacts.filter(c => 
      c.name.toLowerCase().includes(search) || 
      c.phone.includes(search) ||
      c.company?.toLowerCase().includes(search)
    ).slice(0, 20);
  }, [contacts, contactSearch]);

  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      setDialedNumber(prev => prev.slice(0, -1));
    } else {
      setDialedNumber(prev => prev + key);
    }
  };

  const handleCall = async (phoneNumber?: string, name?: string, entityId?: string, entityType?: "client" | "lead") => {
    const numberToCall = phoneNumber || dialedNumber;
    
    if (!numberToCall) {
      toast({
        title: "No number",
        description: "Please enter or select a phone number to call.",
        variant: "destructive",
      });
      return;
    }

    if (!isConfigured) {
      toast({
        title: "VoIP not configured",
        description: "Please configure Twilio Voice in Settings > Integrations.",
        variant: "destructive",
      });
      return;
    }

    try {
      await makeCall(numberToCall, entityId || "manual", name || numberToCall, entityType || "lead");
      setIsOpen(false);
    } catch (err) {
      toast({
        title: "Call failed",
        description: error || "Failed to connect the call. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  const isInCall = !!activeCall || isConnecting;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "p-2 rounded-md transition-colors",
            isOpen ? "bg-primary/10 text-primary" : "",
            isInCall ? "bg-green-100 dark:bg-green-900/30" : "hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
          title={isInCall ? "Call in progress" : "Phone Dialer"}
          data-testid="button-phone-dialer"
        >
          <Phone className={cn(
            "h-5 w-5",
            isOpen && !isInCall ? "text-primary" : "",
            isInCall ? "text-green-600 dark:text-green-400 animate-pulse" : "text-slate-600 dark:text-slate-300"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          {twilioNumbers.length > 0 && (
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">Calling From</label>
              <Select value={selectedCallerId} onValueChange={setSelectedCallerId}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select number" />
                </SelectTrigger>
                <SelectContent>
                  {twilioNumbers.map((num) => (
                    <SelectItem key={num.id} value={num.phoneNumber}>
                      {num.name ? `${num.name} - ${num.phoneNumber}` : num.phoneNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex w-full h-10 p-1 bg-muted/50 rounded-lg">
              <TabsTrigger 
                value="keypad" 
                className="flex-1 text-xs gap-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary data-[state=active]:text-primary dark:data-[state=active]:bg-slate-800"
              >
                <Hash className="h-3.5 w-3.5" />
                Keypad
              </TabsTrigger>
              <TabsTrigger 
                value="contacts" 
                className="flex-1 text-xs gap-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary data-[state=active]:text-primary dark:data-[state=active]:bg-slate-800"
              >
                <Users className="h-3.5 w-3.5" />
                Contacts
              </TabsTrigger>
              <TabsTrigger 
                value="recent" 
                className="flex-1 text-xs gap-1.5 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-primary data-[state=active]:text-primary dark:data-[state=active]:bg-slate-800"
              >
                <Clock className="h-3.5 w-3.5" />
                Recent
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={activeTab} className="w-full">
          <TabsContent value="keypad" className="m-0 p-4">
            <div className="text-center mb-4">
              <Input
                value={formatPhoneDisplay(dialedNumber)}
                onChange={(e) => setDialedNumber(e.target.value.replace(/\D/g, ''))}
                className="text-center text-xl font-mono h-12 border-0 bg-transparent focus-visible:ring-0"
                placeholder="Enter number"
                data-testid="input-dial-number"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((key) => (
                <Button
                  key={key}
                  variant="outline"
                  className="h-12 w-full text-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => handleKeyPress(key)}
                  data-testid={`button-keypad-${key}`}
                >
                  {key}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                onClick={() => handleCall()}
                disabled={!dialedNumber || isConnecting || !isConfigured}
                data-testid="button-dial-call"
              >
                {isConnecting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <PhoneCall className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="outline"
                className="h-12 px-4"
                onClick={() => handleKeyPress('backspace')}
                disabled={!dialedNumber}
              >
                <Delete className="h-5 w-5" />
              </Button>
            </div>

            {!isConfigured && (
              <p className="text-xs text-yellow-600 text-center mt-3">
                VoIP not configured. Go to Settings &gt; Integrations.
              </p>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="m-0">
            <div className="p-3 border-b dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients or leads..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="pl-9 h-9"
                  data-testid="input-contact-search"
                />
              </div>
            </div>
            <ScrollArea className="h-64">
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {contactSearch ? "No contacts found" : "No contacts with phone numbers"}
                </div>
              ) : (
                <div className="divide-y dark:divide-gray-700">
                  {filteredContacts.map((contact) => (
                    <button
                      key={`${contact.type}-${contact.id}`}
                      onClick={() => handleCall(contact.phone, contact.name, contact.id, contact.type)}
                      className="w-full px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-left flex items-center gap-2.5"
                      data-testid={`contact-${contact.type}-${contact.id}`}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        contact.type === 'client' 
                          ? "bg-blue-100 dark:bg-blue-900/30" 
                          : "bg-purple-100 dark:bg-purple-900/30"
                      )}>
                        {contact.type === 'client' ? (
                          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-sm font-medium truncate">{contact.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{contact.phone}</p>
                      </div>
                      <div className="flex-shrink-0 pl-1">
                        <Phone className="h-4 w-4 text-green-600" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recent" className="m-0">
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>Recent calls will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
