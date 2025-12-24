import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertLeadNoteSchema, type LeadNote, type InsertLeadNote } from "@shared/schema";
import { NotebookPen, Plus, Edit, Trash2, Lock, Unlock, User } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

interface LeadNotesSectionProps {
  leadId?: string;
}

const noteFormSchema = insertLeadNoteSchema.pick({
  content: true,
});

type NoteFormData = z.infer<typeof noteFormSchema>;

export default function LeadNotesSection({ leadId }: LeadNotesSectionProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<LeadNote | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notes = [], isLoading } = useQuery<LeadNote[]>({
    queryKey: [`/api/lead-notes/${leadId}`],
    enabled: !!leadId,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
  });

  const form = useForm<NoteFormData>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      content: "",
    },
  });

  // Reset form when editing note changes
  useEffect(() => {
    if (editingNote) {
      form.reset({
        content: editingNote.content,
      });
    } else {
      form.reset({
        content: "",
      });
    }
  }, [editingNote, form]);

  const createNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      if (!leadId) throw new Error("Lead ID is required");
      
      // authorId will be set by backend from authenticated user session
      const noteData = {
        ...data,
        leadId,
      };

      return await fetch("/api/lead-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noteData),
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lead-notes/${leadId}`] });
      toast({
        title: "Success",
        variant: "success",
        description: "Note added successfully",
      });
      form.reset();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add note",
        variant: "destructive",
      });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async (data: NoteFormData) => {
      if (!editingNote) throw new Error("No note selected for editing");

      return await fetch(`/api/lead-notes/${editingNote.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lead-notes/${leadId}`] });
      toast({
        title: "Success",
        variant: "success",
        description: "Note updated successfully",
      });
      setEditingNote(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update note",
        variant: "destructive",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      return await fetch(`/api/lead-notes/${noteId}`, {
        method: "DELETE",
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.status === 204 ? null : res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lead-notes/${leadId}`] });
      toast({
        title: "Success",
        variant: "success",
        description: "Note deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note",
        variant: "destructive",
      });
    },
  });

  const toggleNoteLockMutation = useMutation({
    mutationFn: async ({ noteId, isLocked }: { noteId: string; isLocked: boolean }) => {
      return await fetch(`/api/lead-notes/${noteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isLocked }),
      }).then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lead-notes/${leadId}`] });
      toast({
        title: "Success",
        variant: "success",
        description: "Note lock status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update note lock status",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: NoteFormData) => {
    if (editingNote) {
      updateNoteMutation.mutate(data);
    } else {
      createNoteMutation.mutate(data);
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      deleteNoteMutation.mutate(noteId);
    }
  };

  const getStaffMember = (staffId: string) => {
    return (staff as any[]).find((s: any) => s.id === staffId);
  };

  const isLoading_mutation = createNoteMutation.isPending || updateNoteMutation.isPending;

  if (!leadId) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-gray-500">
          <NotebookPen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Please save the lead first to add notes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <NotebookPen className="w-5 h-5" />
          <h3 className="font-semibold">Lead Notes</h3>
          <Badge variant="secondary">{notes.length}</Badge>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Note</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter your note here..."
                          rows={6}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading_mutation}>
                    {isLoading_mutation ? "Adding..." : "Add Note"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-8">
            <p>Loading notes...</p>
          </CardContent>
        </Card>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            <NotebookPen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">No Notes Yet</h3>
            <p className="text-sm mb-4">Add notes to track interactions and important information about this lead.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => {
            const author = getStaffMember(note.authorId);
            return (
              <Card key={note.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-sm">
                            {author ? `${author.firstName} ${author.lastName}` : 'Unknown User'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(note.createdAt!), 'MMM d, yyyy h:mm a')}
                        </span>
                        {note.isLocked && (
                          <Badge variant="secondary" className="text-xs">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                      
                      {editingNote?.id === note.id ? (
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                            <FormField
                              control={form.control}
                              name="content"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Textarea {...field} rows={4} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-2">
                              <Button type="submit" size="sm" disabled={isLoading_mutation}>
                                {isLoading_mutation ? "Saving..." : "Save"}
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => setEditingNote(null)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </Form>
                      ) : (
                        <div className="whitespace-pre-wrap text-sm text-gray-700">
                          {note.content}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleNoteLockMutation.mutate({
                          noteId: note.id,
                          isLocked: !note.isLocked
                        })}
                        disabled={toggleNoteLockMutation.isPending}
                      >
                        {note.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingNote(note)}
                        disabled={note.isLocked || false}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={deleteNoteMutation.isPending}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 <strong>Note:</strong> When this lead is converted to a client, all notes will automatically 
          transfer to the client's notes section, maintaining the complete interaction history.
        </p>
      </div>
    </div>
  );
}