import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Phone, Mail, Star, User, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ClientContact } from "@shared/schema";

interface ClientContactsProps {
  clientId: string;
}

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  isPrimary: boolean;
  notes: string;
}

const defaultFormData: ContactFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  title: "",
  isPrimary: false,
  notes: "",
};

export default function ClientContacts({ clientId }: ClientContactsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(defaultFormData);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery<ClientContact[]>({
    queryKey: ["/api/clients", clientId, "contacts"],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}/contacts`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch contacts");
      return response.json();
    },
    enabled: !!clientId,
  });

  const createContactMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const response = await fetch(`/api/clients/${clientId}/contacts`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create contact");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "contacts"] });
      setIsAddDialogOpen(false);
      setFormData(defaultFormData);
      toast({
        title: "Contact Added",
        variant: "success",
        description: "The contact has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, data }: { contactId: string; data: ContactFormData }) => {
      const response = await fetch(`/api/clients/${clientId}/contacts/${contactId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update contact");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "contacts"] });
      setEditingContact(null);
      setFormData(defaultFormData);
      toast({
        title: "Contact Updated",
        variant: "success",
        description: "The contact has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/clients/${clientId}/contacts/${contactId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete contact");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "contacts"] });
      toast({
        title: "Contact Deleted",
        variant: "success",
        description: "The contact has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: async (contactId: string) => {
      const response = await fetch(`/api/clients/${clientId}/contacts/${contactId}/set-primary`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to set primary contact");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients", clientId, "contacts"] });
      toast({
        title: "Primary Contact Updated",
        variant: "success",
        description: "The primary contact has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenAddDialog = () => {
    setFormData(defaultFormData);
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (contact: ClientContact) => {
    setFormData({
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      email: contact.email || "",
      phone: contact.phone || "",
      title: contact.title || "",
      isPrimary: contact.isPrimary || false,
      notes: contact.notes || "",
    });
    setEditingContact(contact);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingContact) {
      updateContactMutation.mutate({ contactId: editingContact.id, data: formData });
    } else {
      createContactMutation.mutate(formData);
    }
  };

  const handleDeleteContact = (contact: ClientContact) => {
    if (confirm(`Are you sure you want to delete ${contact.firstName} ${contact.lastName || ""}?`)) {
      deleteContactMutation.mutate(contact.id);
    }
  };

  const ContactFormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="John"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Smith"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title/Role</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Marketing Director"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes about this contact..."
          rows={3}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="isPrimary"
          checked={formData.isPrimary}
          onCheckedChange={(checked) => setFormData({ ...formData, isPrimary: checked })}
        />
        <Label htmlFor="isPrimary">Set as primary contact</Label>
      </div>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setIsAddDialogOpen(false);
            setEditingContact(null);
            setFormData(defaultFormData);
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createContactMutation.isPending || updateContactMutation.isPending}
        >
          {editingContact ? "Update Contact" : "Add Contact"}
        </Button>
      </DialogFooter>
    </form>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading contacts...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contacts ({contacts.length})</h3>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Contact</DialogTitle>
              <DialogDescription>
                Add a new contact for this client.
              </DialogDescription>
            </DialogHeader>
            <ContactFormContent />
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No contacts added yet</p>
              <p className="text-sm mt-1">Add contacts to keep track of people at this company</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map((contact) => (
            <Card key={contact.id} className={contact.isPrimary ? "border-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {contact.firstName} {contact.lastName || ""}
                        {contact.isPrimary && (
                          <Badge variant="default" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Primary
                          </Badge>
                        )}
                      </CardTitle>
                      {contact.title && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {contact.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dialog open={editingContact?.id === contact.id} onOpenChange={(open) => {
                      if (!open) {
                        setEditingContact(null);
                        setFormData(defaultFormData);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditDialog(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Contact</DialogTitle>
                          <DialogDescription>
                            Update contact information.
                          </DialogDescription>
                        </DialogHeader>
                        <ContactFormContent />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteContact(contact)}
                      disabled={deleteContactMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2 text-sm">
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="h-4 w-4" />
                      {contact.email}
                    </a>
                  )}
                  {contact.phone && (
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="h-4 w-4" />
                      {contact.phone}
                    </a>
                  )}
                  {contact.notes && (
                    <p className="text-muted-foreground mt-2 border-t pt-2">
                      {contact.notes}
                    </p>
                  )}
                </div>
                {!contact.isPrimary && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => setPrimaryMutation.mutate(contact.id)}
                    disabled={setPrimaryMutation.isPending}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Set as Primary
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
