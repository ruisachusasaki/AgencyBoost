import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { InsertClient } from "@shared/schema";

const simpleClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  businessName: z.string().min(1, "Business name is required"),
  status: z.enum(["active", "pending", "inactive"]),
  contactOwner: z.string().optional(),
});

type SimpleClientFormData = z.infer<typeof simpleClientSchema>;

interface SimpleAddClientFormProps {
  onSuccess?: () => void;
}

export function SimpleAddClientForm({ onSuccess }: SimpleAddClientFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
  }) as { data: any[] };

  const form = useForm<SimpleClientFormData>({
    resolver: zodResolver(simpleClientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      businessName: "",
      status: "active",
      contactOwner: "",
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: SimpleClientFormData) => {
      const clientData: InsertClient = {
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        phone: data.phone,
        company: data.businessName,
        status: data.status,
        contactType: "client",
        contactOwner: data.contactOwner === "unassigned" ? null : data.contactOwner || null,
        tags: [],
        customFieldValues: {
          "817cf194-9aa7-4963-9530-65c496457d53": data.firstName, // First Name
          "46c68705-55d7-4fc7-bce3-bae600a619d2": data.lastName,  // Last Name
          "d3d222e1-6df4-44f5-b65b-e82be49cfb94": data.email,     // Email
          "76c9f453-33e0-49fa-a2b8-0574fb97b1dd": data.phone,     // Phone
          "26ca3019-98c8-4424-b629-249d6765f1dd": data.businessName, // Business Name
        },
        // Set remaining fields to defaults
        position: null,
        contactSource: null,
        address: null,
        address2: null,
        city: null,
        state: null,
        zipCode: null,
        website: null,
        notes: null,
        clientVertical: null,
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
        description: "The client has been successfully created.",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      const errorMessage = error.status === 409 
        ? "A client with this email already exists. Please use a different email address."
        : error.message || "Failed to create client. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SimpleClientFormData) => {
    createClientMutation.mutate(data);
  };

  const isLoading = createClientMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="Enter first name"
              />
              {form.formState.errors.firstName && (
                <p className="text-sm text-red-600">{form.formState.errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Enter last name"
              />
              {form.formState.errors.lastName && (
                <p className="text-sm text-red-600">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="example@domain.com"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              {...form.register("phone")}
              placeholder="(123) 456-7890"
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              {...form.register("businessName")}
              placeholder="Enter business name"
            />
            {form.formState.errors.businessName && (
              <p className="text-sm text-red-600">{form.formState.errors.businessName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status *</Label>
              <Select onValueChange={(value) => form.setValue("status", value as any)} defaultValue="active">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Contact Owner</Label>
              <Select onValueChange={(value) => form.setValue("contactOwner", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">None</SelectItem>
                  {staff.map((staffMember: any) => (
                    <SelectItem key={staffMember.id} value={staffMember.id}>
                      {staffMember.firstName} {staffMember.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Client"}
            </Button>
          </div>
    </form>
  );
}