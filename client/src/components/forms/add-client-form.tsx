import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { X, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertClientSchema, type Client, type InsertClient } from "@shared/schema";
import ContactCardField from "@/components/contact-card-field";
import { z } from "zod";

interface AddClientFormProps {
  onSuccess?: () => void;
}

// Custom form schema that includes custom field values
const addClientFormSchema = z.object({
  status: z.string().min(1, "Status is required"),
  contactOwner: z.string().optional(),
  tags: z.array(z.string()).default([]),
  customFieldValues: z.record(z.any()).default({}),
});

type AddClientFormData = z.infer<typeof addClientFormSchema>;

export default function AddClientForm({ onSuccess }: AddClientFormProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newTag, setNewTag] = useState("");

  // Fetch custom fields
  const { data: customFields = [] } = useQuery<Array<{ id: string; name: string; type: string; required: boolean; folderId: string; options?: string[] }>>({
    queryKey: ['/api/custom-fields'],
  });

  // Fetch staff for contact owner dropdown
  const { data: staff = [] } = useQuery<Array<{ id: string; firstName: string; lastName: string }>>({
    queryKey: ['/api/staff'],
  });

  // Map field names to field IDs for required fields
  const fieldMap: Record<string, string> = {
    "First Name": "817cf194-9aa7-4963-9530-65c496457d53",
    "Last Name": "46c68705-55d7-4fc7-bce3-bae600a619d2", 
    "Email": "d3d222e1-6df4-44f5-b65b-e82be49cfb94",
    "Phone": "76c9f453-33e0-49fa-a2b8-0574fb97b1dd",
    "Business Name": "26ca3019-98c8-4424-b629-249d6765f1dd",
    "Street Address": "6cd3ef90-84c0-4dd3-8487-e9c0ccb0b34a",
    "City": "6fc10ec1-1be5-4745-ac73-d5fc8f8556e7",
    "State": "4220bed3-c9a4-4405-86cd-a6ab31645c0e",
    "Country": "a5e85463-47d5-4fb4-b61d-f8a9561a24e4",
    "Client Vertical": "cac6e6ee-bdf9-48bd-81a7-48672d2453ae",
    "Website": "ad71b498-7e6d-4864-bfe5-0b56f901d4b9",
  };

  // Get required custom fields in the specific order
  const requiredFields = [
    "First Name", "Last Name", "Email", "Phone", "Business Name", 
    "Street Address", "City", "State", "Country", "Client Vertical", "Website"
  ].map(name => customFields.find(field => field.id === fieldMap[name]!)).filter(Boolean);

  const form = useForm<AddClientFormData>({
    resolver: zodResolver(addClientFormSchema),
    defaultValues: {
      status: "active",
      contactOwner: "none",
      tags: [],
      customFieldValues: {},
    },
  });

  // Force reset form state on mount to prevent cached data
  useEffect(() => {
    const resetData = {
      status: "active" as const,
      contactOwner: "none",
      tags: [] as string[],
      customFieldValues: {} as Record<string, string>,
    };
    form.reset(resetData);
    // Also clear any potential field registrations
    Object.keys(form.getValues().customFieldValues || {}).forEach(fieldId => {
      form.setValue(`customFieldValues.${fieldId}`, "");
    });
  }, [form]);

  const createClientMutation = useMutation({
    mutationFn: async (data: AddClientFormData) => {
      // Create the client data structure
      const customFieldValues = data.customFieldValues;
      const firstName = customFieldValues[fieldMap["First Name"]] || "";
      const lastName = customFieldValues[fieldMap["Last Name"]] || "";
      const fullName = `${firstName} ${lastName}`.trim();
      
      const clientData: InsertClient = {
        name: fullName,
        email: customFieldValues[fieldMap["Email"]] || "",
        phone: customFieldValues[fieldMap["Phone"]] || "",
        company: customFieldValues[fieldMap["Business Name"]] || "",
        status: data.status,
        contactType: "client",
        address: customFieldValues[fieldMap["Street Address"]] || "",
        city: customFieldValues[fieldMap["City"]] || "",
        state: customFieldValues[fieldMap["State"]] || "",
        website: customFieldValues[fieldMap["Website"]] || "",
        clientVertical: customFieldValues[fieldMap["Client Vertical"]] || "",
        contactOwner: data.contactOwner === "none" ? null : data.contactOwner || null,
        tags: data.tags,
        customFieldValues: customFieldValues,
        // Set other fields to null/default values
        position: null,
        contactSource: null,
        address2: null,
        zipCode: null,
        notes: null,
        profileImage: null,
        mrr: null,
        invoicingContact: null,
        invoicingEmail: null,
        paymentTerms: null,
        upsideBonus: null,
        clientBrief: null,
        growthOsDashboard: null,
        storyBrand: null,
        styleGuide: null,
        googleDriveFolder: null,
        testingLog: null,
        cornerstoneBlueprint: null,
        customGpt: null,
        dndAll: false,
        dndEmail: false,
        dndSms: false,
        dndCalls: false,
        groupId: null,
        followers: null,
        lastActivity: null,
      };

      await apiRequest("POST", "/api/clients", clientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client created",
        variant: "success",
        description: "The client has been successfully created.",
      });
      // Reset form to completely empty state
      form.reset({
        status: "active",
        contactOwner: "none",
        tags: [],
        customFieldValues: {},
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddClientFormData) => {
    createClientMutation.mutate(data);
  };

  const addTag = () => {
    if (newTag.trim() && !form.getValues("tags").includes(newTag.trim())) {
      const currentTags = form.getValues("tags");
      form.setValue("tags", [...currentTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags");
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove));
  };

  const renderCustomField = (field: any) => {
    const fieldId = field.id;
    const fieldName = field.name;
    const fieldType = field.type;
    const isRequired = field.required;

    return (
      <FormField
        key={fieldId}
        control={form.control}
        name={`customFieldValues.${fieldId}`}
        render={({ field: formField }) => (
          <FormItem>
            <FormLabel>{fieldName} {isRequired && "*"}</FormLabel>
            <FormControl>
              {fieldType === "text" && (
                <Input 
                  {...formField} 
                  placeholder={`Enter ${fieldName.toLowerCase()}`}
                />
              )}
              {fieldType === "email" && (
                <Input 
                  {...formField} 
                  type="email"
                  placeholder="example@domain.com"
                />
              )}
              {fieldType === "phone" && (
                <PhoneInput 
                  {...formField} 
                  placeholder="+1 (555) 123-4567"
                />
              )}
              {fieldType === "url" && (
                <Input 
                  {...formField} 
                  type="url"
                  placeholder="https://example.com"
                />
              )}
              {fieldType === "dropdown" && (
                <Select onValueChange={formField.onChange} value={formField.value}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${fieldName.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options || []).map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {fieldType === "contact_card" && (
                <ContactCardField
                  value={formField.value || []}
                  onChange={formField.onChange}
                  fieldName={fieldName}
                  maxContacts={10}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const isLoading = createClientMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Render required custom fields */}
          {requiredFields.map(field => renderCustomField(field))}

          {/* Status field */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contact Owner field */}
          <FormField
            control={form.control}
            name="contactOwner"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Owner</FormLabel>
                <FormControl>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {staff.map((staffMember) => (
                        <SelectItem key={staffMember.id} value={staffMember.id}>
                          {staffMember.firstName} {staffMember.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Tags section */}
        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="flex flex-wrap gap-2 mb-2">
            {form.watch("tags").map((tag) => (
              <Badge key={tag} variant="secondary" className="cursor-pointer">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="ml-1 h-auto p-0"
                  onClick={() => removeTag(tag)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" onClick={addTag} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
}