import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, Mail, MessageCircle, Folder, FolderPlus, FolderOpen, MoreHorizontal, Copy, Tag, Megaphone, FileText, ChevronUp, ChevronDown, ExternalLink, ArrowLeft, ClipboardList, Globe, BarChart3, Code } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import type { TemplateFolder, EmailTemplate, SmsTemplate } from "@shared/schema";

export default function Campaigns() {
  const [emailSearchTerm, setEmailSearchTerm] = useState("");
  const [smsSearchTerm, setSmsSearchTerm] = useState("");
  // Initialize activeTab based on URL params to prevent double render
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      return (tab && ['email', 'sms', 'forms', 'surveys'].includes(tab)) ? tab : "email";
    }
    return "email";
  });
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedSmsFolder, setSelectedSmsFolder] = useState<string | null>(null);
  
  // Handle URL parameters for tab switching
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['email', 'sms', 'forms', 'surveys'].includes(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, []); // Remove dependency to prevent re-running
  const [isCreateFolderDialogOpen, setIsCreateFolderDialogOpen] = useState(false);
  const [isCreateFormFolderDialogOpen, setIsCreateFormFolderDialogOpen] = useState(false);
  const [isCreateTemplateDialogOpen, setIsCreateTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | SmsTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [smsContent, setSmsContent] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailPreviewText, setEmailPreviewText] = useState("");
  const [moveToFolderDialogOpen, setMoveToFolderDialogOpen] = useState(false);
  const [formToMove, setFormToMove] = useState<any>(null);
  const [moveEmailToFolderDialogOpen, setMoveEmailToFolderDialogOpen] = useState(false);
  const [emailTemplateToMove, setEmailTemplateToMove] = useState<EmailTemplate | null>(null);
  const [moveSmsToFolderDialogOpen, setMoveSmsToFolderDialogOpen] = useState(false);
  const [smsTemplateToMove, setSmsTemplateToMove] = useState<SmsTemplate | null>(null);
  const [formSearchTerm, setFormSearchTerm] = useState("");
  const [selectedFormFolder, setSelectedFormFolder] = useState<string | null>(null);
  const [selectedSurveyFolder, setSelectedSurveyFolder] = useState<string | null>(null);
  const [isCreateSurveyFolderDialogOpen, setIsCreateSurveyFolderDialogOpen] = useState(false);
  const [surveySearchTerm, setSurveySearchTerm] = useState("");
  const [moveSurveyToFolderDialogOpen, setMoveSurveyToFolderDialogOpen] = useState(false);
  const [surveyToMove, setSurveyToMove] = useState<any>(null);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [surveyToEmbed, setSurveyToEmbed] = useState<any>(null);
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<any>(null);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{ id: string; type: string; name: string } | null>(null);
  const [formToDelete, setFormToDelete] = useState<{ id: string; name: string } | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<{ id: string; name: string; type: string } | null>(null);
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  
  // Sorting state for each tab
  const [emailSortField, setEmailSortField] = useState<'name' | 'subject' | null>(null);
  const [emailSortDirection, setEmailSortDirection] = useState<'asc' | 'desc'>('asc');
  const [smsSortField, setSmsSortField] = useState<'name' | 'content' | null>(null);
  const [smsSortDirection, setSmsSortDirection] = useState<'asc' | 'desc'>('asc');
  const [formsSortField, setFormsSortField] = useState<'name' | 'lastUpdated' | null>(null);
  const [formsSortDirection, setFormsSortDirection] = useState<'asc' | 'desc'>('asc');
  const [surveySortField, setSurveySortField] = useState<'name' | 'status' | 'createdBy' | null>(null);
  const [surveySortDirection, setSurveySortDirection] = useState<'asc' | 'desc'>('asc');
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch custom fields for dynamic merge tags
  const { data: customFields = [] } = useQuery({
    queryKey: ["/api/custom-fields"],
  });

  // Fetch forms for forms tab count (always load to show correct count)
  const { data: formsData = [] } = useQuery({
    queryKey: ["/api/forms"],
  });

  // Fetch form folders data (always load to show correct count)
  const { data: formFolders = [] } = useQuery<Array<{id: string; name: string; description?: string; order: number}>>({
    queryKey: ['/api/form-folders'],
  });

  // Fetch surveys for surveys tab
  const { data: surveysData = [] } = useQuery<Array<{id: string; name: string; description?: string; status: string; shortCode: string; folderId?: string; createdAt: string; createdByName?: string}>>({
    queryKey: ['/api/surveys'],
  });

  // Fetch survey folders
  const { data: surveyFolders = [] } = useQuery<Array<{id: string; name: string; description?: string; order: number}>>({
    queryKey: ['/api/survey-folders'],
  });

  // Define available merge tags based on client schema - dynamic with custom fields
  const [mergeTagSearch, setMergeTagSearch] = useState("");

  const mergeTagGroups = [
    {
      label: "Contact Information",
      tags: [
        { label: "Full Name", value: "{{name}}" },
        { label: "Email", value: "{{email}}" },
        { label: "Phone", value: "{{phone}}" },
        { label: "Company", value: "{{company}}" },
        { label: "Position / Title", value: "{{position}}" },
        { label: "Website", value: "{{website}}" },
        { label: "Status", value: "{{status}}" },
        { label: "Contact Source", value: "{{contactSource}}" },
        { label: "Tags", value: "{{tags}}" },
      ]
    },
    {
      label: "Address",
      tags: [
        { label: "Street Address", value: "{{address}}" },
        { label: "Address Line 2", value: "{{address2}}" },
        { label: "City", value: "{{city}}" },
        { label: "State", value: "{{state}}" },
        { label: "Zip Code", value: "{{zipCode}}" },
      ]
    },
    {
      label: "Billing & Revenue",
      tags: [
        { label: "Monthly Revenue (MRR)", value: "{{mrr}}" },
        { label: "Payment Terms", value: "{{paymentTerms}}" },
        { label: "Invoicing Contact", value: "{{invoicingContact}}" },
        { label: "Invoicing Email", value: "{{invoicingEmail}}" },
        { label: "Upside Bonus %", value: "{{upsideBonus}}" },
      ]
    },
    {
      label: "Client Resources",
      tags: [
        { label: "Growth OS Dashboard", value: "{{growthOsDashboard}}" },
        { label: "StoryBrand", value: "{{storyBrand}}" },
        { label: "Style Guide", value: "{{styleGuide}}" },
        { label: "Google Drive Folder", value: "{{googleDriveFolder}}" },
        { label: "Testing Log", value: "{{testingLog}}" },
        { label: "Cornerstone Blueprint", value: "{{cornerstoneBlueprint}}" },
        { label: "Custom GPT", value: "{{customGpt}}" },
      ]
    },
    {
      label: "Lead Fields",
      tags: [
        { label: "Lead Source", value: "{{leadSource}}" },
        { label: "Lead Value", value: "{{leadValue}}" },
        { label: "Lead Probability %", value: "{{leadProbability}}" },
        { label: "Projected Close Date", value: "{{projectedCloseDate}}" },
      ]
    },
    {
      label: "Sender / User Fields",
      tags: [
        { label: "User First Name", value: "{{user_first_name}}" },
        { label: "User Last Name", value: "{{user_last_name}}" },
        { label: "User Full Name", value: "{{user_full_name}}" },
        { label: "User Email", value: "{{user_email}}" },
        { label: "User Phone", value: "{{user_phone}}" },
      ]
    },
    {
      label: "Company Info",
      tags: [
        { label: "Company Name", value: "{{company_name}}" },
        { label: "Company Phone", value: "{{company_phone}}" },
        { label: "Company Email", value: "{{company_email}}" },
        { label: "Company Website", value: "{{company_website}}" },
        { label: "Company Address", value: "{{company_address}}" },
        { label: "Company City", value: "{{company_city}}" },
        { label: "Company State", value: "{{company_state}}" },
        { label: "Company Zip", value: "{{company_zip}}" },
      ]
    },
    {
      label: "Dates",
      tags: [
        { label: "Current Date", value: "{{current_date}}" },
        { label: "Current Year", value: "{{current_year}}" },
      ]
    },
    {
      label: "Other",
      tags: [
        { label: "Notes", value: "{{notes}}" },
        { label: "Client Vertical", value: "{{clientVertical}}" },
        { label: "Onboarding Start Date", value: "{{onboardingStartDate}}" },
      ]
    },
    ...(Array.isArray(customFields) && customFields.length > 0 ? [{
      label: "Custom Fields",
      tags: customFields.map((field: any) => ({
        label: field.name,
        value: `{{custom.${field.name.toLowerCase().replace(/\s+/g, '_')}}}`
      }))
    }] : [])
  ];

  // Fetch data
  const { data: templateFolders = [], isLoading: loadingFolders } = useQuery<TemplateFolder[]>({
    queryKey: ["/api/template-folders"],
  });

  const { data: emailTemplates = [], isLoading: loadingEmailTemplates } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/email-templates"],
  });

  const { data: smsTemplates = [], isLoading: loadingSmsTemplates } = useQuery<SmsTemplate[]>({
    queryKey: ["/api/sms-templates"],
  });

  // Sorting handlers
  const handleEmailSort = (field: 'name' | 'subject') => {
    if (emailSortField === field) {
      setEmailSortDirection(emailSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setEmailSortField(field);
      setEmailSortDirection('asc');
    }
  };

  const handleSmsSort = (field: 'name' | 'content') => {
    if (smsSortField === field) {
      setSmsSortDirection(smsSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSmsSortField(field);
      setSmsSortDirection('asc');
    }
  };

  const handleFormsSort = (field: 'name' | 'lastUpdated') => {
    if (formsSortField === field) {
      setFormsSortDirection(formsSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setFormsSortField(field);
      setFormsSortDirection('asc');
    }
  };

  const handleSurveySort = (field: 'name' | 'status' | 'responses' | 'created') => {
    if (surveySortField === field) {
      setSurveySortDirection(surveySortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSurveySortField(field);
      setSurveySortDirection('asc');
    }
  };

  // Filter folders by type
  const emailFolders = templateFolders.filter(folder => folder.type === "email" || folder.type === "both");
  const smsFolders = templateFolders.filter(folder => folder.type === "sms" || folder.type === "both");

  // Filter and sort templates with tab-specific search terms
  const filteredEmailTemplates = emailTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                         template.subject.toLowerCase().includes(emailSearchTerm.toLowerCase()) ||
                         (template.tags && template.tags.some(tag => tag.toLowerCase().includes(emailSearchTerm.toLowerCase())));
    // Show templates without folders when no folder is selected, or templates in selected folder
    const matchesFolder = selectedFolder ? template.folderId === selectedFolder : !template.folderId;
    return matchesSearch && matchesFolder;
  }).sort((a, b) => {
    if (!emailSortField) return 0;
    
    let aValue = '';
    let bValue = '';
    
    if (emailSortField === 'name') {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    } else if (emailSortField === 'subject') {
      aValue = a.subject.toLowerCase();
      bValue = b.subject.toLowerCase();
    }
    
    if (emailSortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  const filteredSmsTemplates = smsTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(smsSearchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(smsSearchTerm.toLowerCase()) ||
                         (template.tags && template.tags.some(tag => tag.toLowerCase().includes(smsSearchTerm.toLowerCase())));
    // Show templates without folders when no folder is selected, or templates in selected folder
    const matchesFolder = selectedSmsFolder ? template.folderId === selectedSmsFolder : !template.folderId;
    return matchesSearch && matchesFolder;
  }).sort((a, b) => {
    if (!smsSortField) return 0;
    
    let aValue = '';
    let bValue = '';
    
    if (smsSortField === 'name') {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    } else if (smsSortField === 'content') {
      aValue = a.content.toLowerCase();
      bValue = b.content.toLowerCase();
    }
    
    if (smsSortDirection === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; description?: string }) => {
      return await apiRequest("POST", "/api/template-folders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/template-folders"] });
      toast({ title: "Success", description: "Folder created successfully" });
      setIsCreateFolderDialogOpen(false);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to create folder" });
    }
  });

  // Create form folder mutation
  const createFormFolderMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/form-folders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/form-folders"] });
      toast({ title: "Success", description: "Form folder created successfully" });
      setIsCreateFormFolderDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create form folder",
        variant: "destructive",
      });
    },
  });

  // Create survey folder mutation
  const createSurveyFolderMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/survey-folders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/survey-folders"] });
      toast({ title: "Success", description: "Survey folder created successfully" });
      setIsCreateSurveyFolderDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create survey folder",
        variant: "destructive",
      });
    },
  });

  // Move survey to folder mutation
  const moveSurveyToFolderMutation = useMutation({
    mutationFn: async ({ surveyId, folderId }: { surveyId: string; folderId: string | null }) => {
      return await apiRequest("PUT", `/api/surveys/${surveyId}`, { folderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({ title: "Success", description: "Survey moved successfully" });
      setMoveSurveyToFolderDialogOpen(false);
      setSurveyToMove(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to move survey",
        variant: "destructive",
      });
    },
  });

  // Delete survey mutation
  const deleteSurveyMutation = useMutation({
    mutationFn: async (surveyId: string) => {
      return await apiRequest("DELETE", `/api/surveys/${surveyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({ title: "Success", description: "Survey deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete survey",
        variant: "destructive",
      });
    },
  });

  // Create email template mutation
  const createEmailTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Frontend: Creating email template with data:", data);
      return await apiRequest("POST", "/api/email-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({ title: "Success", description: "Email template created successfully" });
      handleDialogClose();
    },
    onError: (error: any) => {
      console.error("Frontend: Email template creation error:", error);
      const errorMessage = error?.message || "Failed to create email template";
      toast({ variant: "destructive", title: "Error", description: errorMessage });
    }
  });

  // Create SMS template mutation
  const createSmsTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/sms-templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      toast({ title: "Success", description: "SMS template created successfully" });
      handleDialogClose();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to create SMS template" });
    }
  });

  // Update email template mutation
  const updateEmailTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/email-templates/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({ title: "Success", description: "Email template updated successfully" });
      handleEditDialogClose();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update email template" });
    }
  });

  // Update SMS template mutation
  const updateSmsTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/sms-templates/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      toast({ title: "Success", description: "SMS template updated successfully" });
      handleEditDialogClose();
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update SMS template" });
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      const endpoint = type === "email" ? "/api/email-templates" : "/api/sms-templates";
      return await apiRequest("DELETE", `${endpoint}/${id}`);
    },
    onSuccess: (_, { type }) => {
      const queryKey = type === "email" ? ["/api/email-templates"] : ["/api/sms-templates"];
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Success", description: `${type === "email" ? "Email" : "SMS"} template deleted successfully` });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete template" });
    }
  });

  // Form-specific mutations
  const duplicateFormMutation = useMutation({
    mutationFn: async (formId: string) => {
      return await apiRequest("POST", `/api/forms/${formId}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({ title: "Success", description: "Form duplicated successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to duplicate form" });
    }
  });

  const moveFormToFolderMutation = useMutation({
    mutationFn: async ({ formId, folderId }: { formId: string; folderId: string | null }) => {
      return await apiRequest("PUT", `/api/forms/${formId}/move`, { folderId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({ title: "Success", description: "Form moved successfully" });
      setMoveToFolderDialogOpen(false);
      setFormToMove(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to move form" });
    }
  });

  // Move email template to folder mutation
  const moveEmailToFolderMutation = useMutation({
    mutationFn: async ({ templateId, folderId }: { templateId: string; folderId: string | null }) => {
      // Get the current template data first
      const currentTemplate = emailTemplates.find(t => t.id === templateId);
      if (!currentTemplate) throw new Error("Template not found");
      
      return await apiRequest("PATCH", `/api/email-templates/${templateId}`, {
        name: currentTemplate.name,
        subject: currentTemplate.subject,
        content: currentTemplate.content,
        previewText: currentTemplate.previewText || "",
        tags: currentTemplate.tags || [],
        folderId: folderId,
        createdBy: currentTemplate.createdBy
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      toast({ title: "Success", description: "Email template moved successfully" });
      setMoveEmailToFolderDialogOpen(false);
      setEmailTemplateToMove(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to move email template" });
    }
  });

  // Move SMS template to folder mutation
  const moveSmsToFolderMutation = useMutation({
    mutationFn: async ({ templateId, folderId }: { templateId: string; folderId: string | null }) => {
      // Get the current template data first
      const currentTemplate = smsTemplates.find(t => t.id === templateId);
      if (!currentTemplate) throw new Error("Template not found");
      
      return await apiRequest("PATCH", `/api/sms-templates/${templateId}`, {
        name: currentTemplate.name,
        content: currentTemplate.content,
        tags: currentTemplate.tags || [],
        folderId: folderId,
        createdBy: currentTemplate.createdBy
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      toast({ title: "Success", description: "SMS template moved successfully" });
      setMoveSmsToFolderDialogOpen(false);
      setSmsTemplateToMove(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to move SMS template" });
    }
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (formId: string) => {
      return await apiRequest("DELETE", `/api/forms/${formId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({ title: "Success", description: "Form deleted successfully" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete form" });
    }
  });

  const editFolderMutation = useMutation({
    mutationFn: async ({ folderId, name, description }: { folderId: string; name: string; description?: string }) => {
      return await apiRequest("PATCH", `/api/template-folders/${folderId}`, {
        name,
        description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/template-folders"] });
      toast({ title: "Success", description: "Folder updated successfully" });
      setIsEditFolderDialogOpen(false);
      setFolderToEdit(null);
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update folder" });
    }
  });

  // Delete folder mutation
  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const response = await apiRequest("DELETE", `/api/template-folders/${folderId}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete folder");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/template-folders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/email-templates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] });
      toast({ title: "Success", description: "Folder deleted successfully" });
      setDeleteFolderDialogOpen(false);
      setFolderToDelete(null);
      // Reset folder selection if deleted folder was selected
      if (folderToDelete?.type === 'email') {
        setSelectedFolder(null);
      } else if (folderToDelete?.type === 'sms') {
        setSelectedSmsFolder(null);
      }
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete folder" });
    }
  });

  // Event handlers
  const handleCreateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      type: activeTab,
      description: formData.get("description") as string || undefined,
    };
    createFolderMutation.mutate(data);
  };

  const handleCreateFormFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    createFormFolderMutation.mutate({
      name,
      description,
      order: formFolders.length, // Add to end
    });
  };

  const handleCreateSurveyFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    createSurveyFolderMutation.mutate({
      name,
      description,
      order: surveyFolders.length,
    });
  };

  const handleSurveyFolderClick = (folderId: string) => {
    setSelectedSurveyFolder(folderId);
  };

  const handleClearSurveyFolderFilter = () => {
    setSelectedSurveyFolder(null);
  };

  const handleCreateEmailTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tagsValue = formData.get("tags") as string;
    const tags = tagsValue && typeof tagsValue === 'string' ? tagsValue.split(",").map(tag => tag.trim()).filter(Boolean) : [];
    
    const data = {
      name: formData.get("name") as string,
      subject: emailSubject, // Use controlled state value
      content: emailContent,
      previewText: emailPreviewText || "", // Use controlled state value
      tags,
      folderId: selectedFolder || undefined,
      // createdBy will be set by the backend from authenticated user session
    };
    createEmailTemplateMutation.mutate(data);
  };

  const handleCreateSmsTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tagsValue = formData.get("tags") as string;
    const tags = tagsValue && typeof tagsValue === 'string' ? tagsValue.split(",").map(tag => tag.trim()).filter(Boolean) : [];
    
    const data = {
      name: formData.get("name") as string,
      content: smsContent,
      tags,
      folderId: selectedSmsFolder || undefined,
      // createdBy will be set by the backend from authenticated user session
    };
    createSmsTemplateMutation.mutate(data);
  };

  const handleDialogClose = () => {
    setIsCreateTemplateDialogOpen(false);
    setEmailContent("");
    setEmailSubject("");
    setEmailPreviewText("");
    setSmsContent("");
  };

  const handleEditTemplate = (template: EmailTemplate | SmsTemplate) => {
    setEditingTemplate(template);
    if ((template as any).subject) {
      // Email template
      setEmailContent((template as EmailTemplate).content || "");
    } else {
      // SMS template
      setSmsContent((template as SmsTemplate).content || "");
    }
    setIsEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setIsEditDialogOpen(false);
    setEditingTemplate(null);
    setEmailContent("");
    setSmsContent("");
  };

  const handleUpdateEmailTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTemplate) return;
    
    const formData = new FormData(e.currentTarget);
    const tagsValue = formData.get("tags") as string;
    const tags = tagsValue && typeof tagsValue === 'string' ? tagsValue.split(",").map(tag => tag.trim()).filter(Boolean) : [];
    
    const data = {
      id: editingTemplate.id,
      name: formData.get("name") as string,
      subject: formData.get("subject") as string,
      content: emailContent,
      previewText: formData.get("previewText") as string || "",
      tags,
      folderId: editingTemplate.folderId,
    };
    updateEmailTemplateMutation.mutate(data);
  };

  const handleUpdateSmsTemplate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTemplate) return;
    
    const formData = new FormData(e.currentTarget);
    const tagsValue = formData.get("tags") as string;
    const tags = tagsValue && typeof tagsValue === 'string' ? tagsValue.split(",").map(tag => tag.trim()).filter(Boolean) : [];
    
    const data = {
      id: editingTemplate.id,
      name: formData.get("name") as string,
      content: smsContent,
      tags,
      folderId: editingTemplate.folderId,
    };
    updateSmsTemplateMutation.mutate(data);
  };

  const handleDeleteTemplate = (id: string, type: string, name: string) => {
    setTemplateToDelete({ id, type, name });
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteTemplate = () => {
    if (templateToDelete) {
      deleteTemplateMutation.mutate({ id: templateToDelete.id, type: templateToDelete.type });
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleDuplicateTemplate = async (template: EmailTemplate | SmsTemplate) => {
    const isEmail = (template as any).subject !== undefined;
    
    if (isEmail) {
      const emailTemplate = template as EmailTemplate;
      const data = {
        name: `${emailTemplate.name} (Copy)`,
        subject: emailTemplate.subject,
        content: emailTemplate.content,
        previewText: emailTemplate.previewText || "",
        tags: emailTemplate.tags || [],
        folderId: emailTemplate.folderId,
        // createdBy will be set by the backend from authenticated user session
      };
      createEmailTemplateMutation.mutate(data);
    } else {
      const smsTemplate = template as SmsTemplate;
      const data = {
        name: `${smsTemplate.name} (Copy)`,
        content: smsTemplate.content,
        tags: smsTemplate.tags || [],
        folderId: smsTemplate.folderId,
        // createdBy will be set by the backend from authenticated user session
      };
      createSmsTemplateMutation.mutate(data);
    }
  };

  const handleEditFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!folderToEdit) return;
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    editFolderMutation.mutate({
      folderId: folderToEdit.id,
      name,
      description,
    });
  };

  const insertMergeTagIntoEmail = (tag: string) => {
    setEmailContent(prev => prev + tag);
  };

  const insertMergeTagIntoSubject = (tag: string) => {
    setEmailSubject(prev => prev + tag);
  };

  const insertMergeTagIntoPreviewText = (tag: string) => {
    setEmailPreviewText(prev => prev + tag);
  };

  const insertMergeTagIntoSms = (tag: string) => {
    setSmsContent(prev => prev + tag);
  };

  // Form-specific handlers
  const handleDuplicateForm = (form: any) => {
    duplicateFormMutation.mutate(form.id);
  };

  const handleMoveToFolder = (form: any) => {
    setFormToMove(form);
    setMoveToFolderDialogOpen(true);
  };

  const handleConfirmMoveToFolder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formToMove) return;
    
    const formData = new FormData(e.currentTarget);
    const folderId = formData.get("folderId") as string;
    
    moveFormToFolderMutation.mutate({
      formId: formToMove.id,
      folderId: folderId === "no-folder" ? null : folderId
    });
  };

  const handleDeleteForm = (form: any) => {
    setFormToDelete({ id: form.id, name: form.name });
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteForm = () => {
    if (formToDelete) {
      deleteFormMutation.mutate(formToDelete.id);
      setDeleteDialogOpen(false);
      setFormToDelete(null);
    }
  };

  // Filter and sort forms with search and folder selection - handle formsData being unknown type
  const filteredForms = Array.isArray(formsData) ? formsData.filter((form: any) => {
    const matchesSearch = form.name.toLowerCase().includes(formSearchTerm.toLowerCase()) ||
                          (form.description && form.description.toLowerCase().includes(formSearchTerm.toLowerCase()));
    const matchesFolder = !selectedFormFolder || form.folderId === selectedFormFolder;
    return matchesSearch && matchesFolder;
  }).sort((a: any, b: any) => {
    if (!formsSortField) return 0;
    
    let aValue = '';
    let bValue = '';
    
    if (formsSortField === 'name') {
      aValue = a.name.toLowerCase();
      bValue = b.name.toLowerCase();
    } else if (formsSortField === 'lastUpdated') {
      // Use updatedAt or createdAt as fallback
      const aDate = new Date(a.updatedAt || a.createdAt);
      const bDate = new Date(b.updatedAt || b.createdAt);
      
      if (formsSortDirection === 'asc') {
        return aDate.getTime() - bDate.getTime();
      } else {
        return bDate.getTime() - aDate.getTime();
      }
    }
    
    if (formsSortField === 'name') {
      if (formsSortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    }
    
    return 0;
  }) : [];

  // Handle folder navigation
  const handleViewFolder = (folderId: string) => {
    setSelectedFormFolder(folderId);
  };

  const handleClearFolderFilter = () => {
    setSelectedFormFolder(null);
  };

  // Sortable header components
  const EmailSortableHeader = ({ field, children }: { field: 'name' | 'subject'; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleEmailSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col ml-1">
          <ChevronUp 
            className={`h-3 w-3 ${
              emailSortField === field && emailSortDirection === 'asc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              emailSortField === field && emailSortDirection === 'desc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  const SmsSortableHeader = ({ field, children }: { field: 'name' | 'content'; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleSmsSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col ml-1">
          <ChevronUp 
            className={`h-3 w-3 ${
              smsSortField === field && smsSortDirection === 'asc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              smsSortField === field && smsSortDirection === 'desc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  const FormsSortableHeader = ({ field, children }: { field: 'name' | 'lastUpdated'; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleFormsSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col ml-1">
          <ChevronUp 
            className={`h-3 w-3 ${
              formsSortField === field && formsSortDirection === 'asc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              formsSortField === field && formsSortDirection === 'desc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  const SurveySortableHeader = ({ field, children }: { field: 'name' | 'status' | 'createdBy'; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50 select-none"
      onClick={() => handleSurveySort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <div className="flex flex-col ml-1">
          <ChevronUp 
            className={`h-3 w-3 ${
              surveySortField === field && surveySortDirection === 'asc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              surveySortField === field && surveySortDirection === 'desc' 
                ? 'text-blue-600' 
                : 'text-gray-400'
            }`} 
          />
        </div>
      </div>
    </TableHead>
  );

  // Combine forms and folders for table display
  const getTableData = () => {
    const items: any[] = [];
    
    // If a folder is selected, only show forms from that folder
    if (selectedFormFolder) {
      filteredForms.forEach((form: any) => {
        if (form.folderId === selectedFormFolder) {
          items.push({
            type: 'form',
            id: form.id,
            name: form.name,
            description: form.description,
            status: form.status,
            lastUpdated: form.updatedAt || form.createdAt,
            updatedBy: form.updatedByName || 'System',
            originalForm: form
          });
        }
      });
    } else {
      // Add folders
      formFolders.forEach((folder: any) => {
        const folderForms = Array.isArray(formsData) ? formsData.filter((form: any) => form.folderId === folder.id) : [];
        items.push({
          type: 'folder',
          id: folder.id,
          name: folder.name,
          description: folder.description,
          itemCount: folderForms.length,
          lastUpdated: folder.createdAt || new Date().toISOString(),
          updatedBy: 'System' // Folders don't have updatedBy yet
        });
      });
      
      // Add forms without folders
      filteredForms.forEach((form: any) => {
        if (!form.folderId) {
          items.push({
            type: 'form',
            id: form.id,
            name: form.name,
            description: form.description,
            status: form.status,
            lastUpdated: form.updatedAt || form.createdAt,
            updatedBy: form.updatedByName || 'System',
            originalForm: form
          });
        }
      });
    }
    
    return items;
  };

  // Merge Tags Dropdown Component
  const MergeTagsDropdown = ({ onInsert, buttonText = "Insert Merge Tag", inline = false }: { onInsert: (tag: string) => void; buttonText?: string; inline?: boolean }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredGroups = mergeTagGroups.map(group => ({
      ...group,
      tags: group.tags.filter(tag =>
        tag.label.toLowerCase().includes(search.toLowerCase()) ||
        tag.value.toLowerCase().includes(search.toLowerCase())
      )
    })).filter(group => group.tags.length > 0);

    return (
      <div className={inline ? "absolute right-1 top-1/2 -translate-y-1/2" : "relative"}>
        {inline ? (
          <Button variant="ghost" size="sm" type="button" className="h-7 w-7 p-0" onClick={() => { setOpen(!open); setSearch(""); }}>
            <Tag className="h-4 w-4 text-gray-500 hover:text-gray-700" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" type="button" onClick={() => { setOpen(!open); setSearch(""); }}>
            <Tag className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        )}
        {open && (
          <div className="absolute right-0 top-full mt-1 w-80 bg-popover border rounded-md shadow-lg p-2 z-[200]" onClick={(e) => e.stopPropagation()}>
            <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Click to insert merge tag</p>
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search merge tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 pl-7 text-xs"
                autoFocus
              />
            </div>
            <div className="max-h-72 overflow-y-auto overscroll-contain">
              <div className="space-y-0.5">
                {filteredGroups.map(group => (
                  <div key={group.label}>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-1.5 pb-0.5">{group.label}</p>
                    {group.tags.map(tag => (
                      <button
                        key={tag.value}
                        type="button"
                        className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent text-sm flex items-center justify-between"
                        onClick={() => { onInsert(tag.value); setOpen(false); }}
                      >
                        <span className="font-medium truncate mr-2">{tag.label}</span>
                        <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">{tag.value}</code>
                      </button>
                    ))}
                  </div>
                ))}
                {filteredGroups.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">No merge tags found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-3">
          <Megaphone className="h-8 w-8 text-primary" />
          <span>Marketing</span>
        </h1>
        <p className="text-muted-foreground">
          Manage your email and SMS templates with organized folder structure
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 mt-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "email", name: "Email", icon: Mail, count: emailTemplates.length },
            { id: "sms", name: "SMS", icon: MessageCircle, count: smsTemplates.length },
            { id: "forms", name: "Forms", icon: FileText, count: Array.isArray(formsData) ? formsData.length : 0 },
            { id: "surveys", name: "Surveys", icon: ClipboardList, count: surveysData.length }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.name} ({tab.count})
              </button>
            );
          })}
        </nav>
      </div>



      {/* Email Tab */}
      {activeTab === "email" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search email templates..."
                  value={emailSearchTerm}
                  onChange={(e) => setEmailSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateFolder} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Folder Name</label>
                      <Input name="name" placeholder="Enter folder name" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Input name="description" placeholder="Optional description" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateFolderDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createFolderMutation.isPending}>
                        Create Folder
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateTemplateDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  handleDialogClose();
                } else {
                  setIsCreateTemplateDialogOpen(true);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 h-10" size="sm" onClick={() => setIsCreateTemplateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Email Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Email Template</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateEmailTemplate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Template Name</label>
                      <Input name="name" placeholder="Enter template name" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Subject Line</label>
                      <div className="relative flex items-center">
                        <Input 
                          name="subject" 
                          value={emailSubject}
                          onChange={(e) => setEmailSubject(e.target.value)}
                          placeholder="Email subject" 
                          className="pr-10"
                          required 
                        />
                        <MergeTagsDropdown onInsert={insertMergeTagIntoSubject} inline />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Preview Text</label>
                      <div className="relative flex items-center">
                        <Input 
                          name="previewText" 
                          value={emailPreviewText}
                          onChange={(e) => setEmailPreviewText(e.target.value)}
                          placeholder="Preview text (optional)"
                          className="pr-10"
                        />
                        <MergeTagsDropdown onInsert={insertMergeTagIntoPreviewText} inline />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">Email Content</label>
                        <MergeTagsDropdown onInsert={insertMergeTagIntoEmail} />
                      </div>
                      <div className="border rounded-md overflow-hidden">
                        <ReactQuill
                          theme="snow"
                          value={emailContent}
                          onChange={setEmailContent}
                          modules={{
                            toolbar: [
                              [{ 'header': '1' }, { 'header': '2' }, 'bold', 'italic', 'underline'],
                              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                              ['link', 'clean']
                            ],
                          }}
                          formats={[
                            'header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'
                          ]}
                          placeholder="Enter your email content with rich formatting..."
                          style={{ 
                            minHeight: '250px',
                            border: 'none'
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tags</label>
                      <Input name="tags" placeholder="Comma-separated tags" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createEmailTemplateMutation.isPending}>
                        Create Template
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Breadcrumb navigation when viewing a specific folder */}
          {selectedFolder && (
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedFolder(null)}
                className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
                data-testid="button-all-emails"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                All Email Templates
              </Button>
            </div>
          )}

          {/* Email Templates and Folders Table */}
          {filteredEmailTemplates.length === 0 && emailFolders.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No email templates found</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first email template.
              </p>
              <Button 
                onClick={() => setIsCreateTemplateDialogOpen(true)}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-create-first-email"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Email Template
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white">
              <Table className="bg-white">
                <TableHeader>
                  <TableRow>
                    <EmailSortableHeader field="name">Name</EmailSortableHeader>
                    <EmailSortableHeader field="subject">Subject</EmailSortableHeader>
                    <TableHead className="w-[15%]">Created by</TableHead>
                    <TableHead className="w-[15%]">Type</TableHead>
                    <TableHead className="w-[10%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Show folders first (if not in a specific folder view) */}
                  {!selectedFolder && emailFolders.map((folder) => (
                    <TableRow key={folder.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-blue-500" />
                          <button
                            onClick={() => setSelectedFolder(folder.id)}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            data-testid={`folder-link-${folder.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {folder.name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {folder.description || "No description"}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          Folder
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`folder-actions-${folder.name.toLowerCase().replace(/\s+/g, '-')}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedFolder(folder.id)}>
                              <FolderOpen className="h-4 w-4 mr-2" />
                              View Folder
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setFolderToEdit(folder);
                              setIsEditFolderDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Folder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setFolderToDelete({ id: folder.id, name: folder.name, type: 'email' });
                                setDeleteFolderDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Folder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Show email templates */}
                  {filteredEmailTemplates.map((template) => (
                    <TableRow key={template.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-green-500" />
                          <div>
                            <div 
                              className="font-medium text-primary hover:underline cursor-pointer"
                              onClick={() => handleEditTemplate(template)}
                            >
                              {template.name}
                            </div>
                            {template.tags && template.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {template.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs px-1">
                                    {tag}
                                  </Badge>
                                ))}
                                {template.tags.length > 2 && (
                                  <Badge variant="secondary" className="text-xs px-1">
                                    +{template.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 truncate max-w-xs">
                          {template.subject}
                        </div>
                        {template.previewText && (
                          <div className="text-xs text-gray-500 truncate max-w-xs mt-1">
                            {template.previewText}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{(template as any).createdByName || 'Unknown'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          Email Template
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`template-actions-${template.name.toLowerCase().replace(/\s+/g, '-')}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setEmailTemplateToMove(template);
                              setMoveEmailToFolderDialogOpen(true);
                            }}>
                              <Folder className="h-4 w-4 mr-2" />
                              Move to Folder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTemplate(template.id, "email", template.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}


        </div>
      )}

      {/* SMS Tab */}
      {activeTab === "sms" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search SMS templates..."
                  value={smsSearchTerm}
                  onChange={(e) => setSmsSearchTerm(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <Dialog open={isCreateFolderDialogOpen} onOpenChange={setIsCreateFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateFolder} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Folder Name</label>
                      <Input name="name" placeholder="Enter folder name" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Input name="description" placeholder="Optional description" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateFolderDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createFolderMutation.isPending}>
                        Create Folder
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateTemplateDialogOpen} onOpenChange={(open) => {
                if (!open) {
                  handleDialogClose();
                } else {
                  setIsCreateTemplateDialogOpen(true);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 h-10" size="sm" onClick={() => setIsCreateTemplateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New SMS Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New SMS Template</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateSmsTemplate} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Template Name</label>
                      <Input name="name" placeholder="Enter template name" required />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">SMS Content</label>
                        <MergeTagsDropdown onInsert={insertMergeTagIntoSms} />
                      </div>
                      <textarea 
                        name="content" 
                        value={smsContent}
                        onChange={(e) => setSmsContent(e.target.value)}
                        className="w-full h-32 p-3 border rounded-md" 
                        placeholder="Enter SMS content (160 characters recommended)"
                        required
                      />
                      <div className="flex justify-end mt-1">
                        <div className={`text-xs ${smsContent.length > 160 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {smsContent.length}/160 characters
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tags</label>
                      <Input name="tags" placeholder="Comma-separated tags" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={handleDialogClose}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createSmsTemplateMutation.isPending}>
                        Create Template
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Breadcrumb navigation when viewing a specific folder */}
          {selectedSmsFolder && (
            <div className="mb-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedSmsFolder(null)}
                className="text-blue-600 hover:text-blue-800 p-0 h-auto font-normal"
                data-testid="button-all-sms"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                All SMS Templates
              </Button>
            </div>
          )}

          {/* SMS Templates and Folders Table */}
          {filteredSmsTemplates.length === 0 && smsFolders.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No SMS templates found</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first SMS template.
              </p>
              <Button 
                onClick={() => setIsCreateTemplateDialogOpen(true)}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-create-first-sms"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First SMS Template
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white">
              <Table className="bg-white">
                <TableHeader>
                  <TableRow>
                    <SmsSortableHeader field="name">Name</SmsSortableHeader>
                    <SmsSortableHeader field="content">Content Preview</SmsSortableHeader>
                    <TableHead className="w-[15%]">Created by</TableHead>
                    <TableHead className="w-[15%]">Type</TableHead>
                    <TableHead className="w-[10%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Show folders first (if not in a specific folder view) */}
                  {!selectedSmsFolder && smsFolders.map((folder) => (
                    <TableRow key={folder.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-blue-500" />
                          <button
                            onClick={() => setSelectedSmsFolder(folder.id)}
                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                            data-testid={`folder-link-${folder.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            {folder.name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">
                        {folder.description || "No description"}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          Folder
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`folder-actions-${folder.name.toLowerCase().replace(/\s+/g, '-')}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedSmsFolder(folder.id)}>
                              <FolderOpen className="h-4 w-4 mr-2" />
                              View Folder
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setFolderToEdit(folder);
                              setIsEditFolderDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Folder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                setFolderToDelete({ id: folder.id, name: folder.name, type: 'sms' });
                                setDeleteFolderDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Folder
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Show SMS templates */}
                  {filteredSmsTemplates.map((template) => (
                    <TableRow key={template.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-green-500" />
                          <div>
                            <div 
                              className="font-medium text-primary hover:underline cursor-pointer"
                              onClick={() => handleEditTemplate(template)}
                            >
                              {template.name}
                            </div>
                            {template.tags && template.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {template.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs px-1">
                                    {tag}
                                  </Badge>
                                ))}
                                {template.tags.length > 2 && (
                                  <Badge variant="secondary" className="text-xs px-1">
                                    +{template.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900 truncate max-w-xs">
                          {template.content.substring(0, 100)}...
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {template.content.length} characters
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{(template as any).createdByName || 'Unknown'}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          SMS Template
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`template-actions-${template.name.toLowerCase().replace(/\s+/g, '-')}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              setSmsTemplateToMove(template);
                              setMoveSmsToFolderDialogOpen(true);
                            }}>
                              <Folder className="h-4 w-4 mr-2" />
                              Move to Folder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteTemplate(template.id, "sms", template.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}



      {/* Edit Template Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {editingTemplate && (editingTemplate as any).subject ? "Email" : "SMS"} Template</DialogTitle>
          </DialogHeader>
          {editingTemplate && (editingTemplate as any).subject ? (
            // Email template edit form
            <form onSubmit={handleUpdateEmailTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template Name</label>
                <Input name="name" placeholder="Enter template name" defaultValue={editingTemplate.name} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject Line</label>
                <Input name="subject" placeholder="Email subject" defaultValue={(editingTemplate as any).subject} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preview Text</label>
                <Input name="previewText" placeholder="Preview text (optional)" defaultValue={(editingTemplate as any).previewText || ""} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Email Content</label>
                  <MergeTagsDropdown onInsert={insertMergeTagIntoEmail} />
                </div>
                <div className="border rounded-md overflow-hidden">
                  <ReactQuill
                    theme="snow"
                    value={emailContent}
                    onChange={setEmailContent}
                    modules={{
                      toolbar: [
                        [{ 'header': '1' }, { 'header': '2' }, 'bold', 'italic', 'underline'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['link', 'clean']
                      ],
                    }}
                    formats={[
                      'header', 'bold', 'italic', 'underline', 'list', 'bullet', 'link'
                    ]}
                    placeholder="Enter your email content with rich formatting..."
                    style={{ 
                      minHeight: '250px',
                      border: 'none'
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <Input name="tags" placeholder="Comma-separated tags" defaultValue={editingTemplate.tags?.join(", ") || ""} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleEditDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateEmailTemplateMutation.isPending}>
                  Update Template
                </Button>
              </div>
            </form>
          ) : (
            // SMS template edit form
            <form onSubmit={handleUpdateSmsTemplate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Template Name</label>
                <Input name="name" placeholder="Enter template name" defaultValue={editingTemplate?.name || ""} required />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">SMS Content</label>
                  <MergeTagsDropdown onInsert={insertMergeTagIntoSms} />
                </div>
                <textarea 
                  name="content" 
                  value={smsContent}
                  onChange={(e) => setSmsContent(e.target.value)}
                  className="w-full h-32 p-3 border rounded-md" 
                  placeholder="Enter SMS content (160 characters recommended)"
                  required
                />
                <div className="flex justify-end mt-1">
                  <div className={`text-xs ${smsContent.length > 160 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {smsContent.length}/160 characters
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <Input name="tags" placeholder="Comma-separated tags" defaultValue={editingTemplate?.tags?.join(", ") || ""} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleEditDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateSmsTemplateMutation.isPending}>
                  Update Template
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Forms Tab */}
      {activeTab === "forms" && (
        <div>
          {/* Breadcrumb for folder navigation */}
          {selectedFormFolder && (
            <div className="mb-4">
              <nav className="flex items-center space-x-2 text-sm">
                <button
                  onClick={handleClearFolderFilter}
                  className="text-primary hover:text-primary/90 flex items-center gap-1"
                  data-testid="button-back-to-all-forms"
                >
                  <ArrowLeft className="h-4 w-4" />
                  All Forms
                </button>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium">
                  {formFolders.find(folder => folder.id === selectedFormFolder)?.name || 'Unknown Folder'}
                </span>
              </nav>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={selectedFormFolder ? "Search forms in folder..." : "Search forms..."}
                  value={formSearchTerm}
                  onChange={(e) => setFormSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                  data-testid="input-search-forms"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isCreateFormFolderDialogOpen} onOpenChange={setIsCreateFormFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Form Folder</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateFormFolder} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Folder Name</label>
                      <Input name="name" placeholder="Enter folder name" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Input name="description" placeholder="Optional description" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateFormFolderDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createFormFolderMutation.isPending}>
                        Create Folder
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button 
                asChild
                className="bg-primary hover:bg-primary/90 h-10" 
                size="sm"
                data-testid="button-create-form"
              >
                <a href="/form-builder">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Form
                </a>
              </Button>
            </div>
          </div>

          {/* Forms and Folders Table */}
          {!Array.isArray(formsData) || (formsData.length === 0 && formFolders.length === 0) ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
              <p className="text-gray-500 mb-4">
                Get started by creating your first form.
              </p>
              <Button 
                asChild
                className="bg-primary hover:bg-primary/90"
                data-testid="button-create-first-form"
              >
                <a href="/form-builder">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Form
                </a>
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-white">
              <Table className="bg-white">
                <TableHeader>
                  <TableRow>
                    <FormsSortableHeader field="name">Name</FormsSortableHeader>
                    <FormsSortableHeader field="lastUpdated">Last Updated</FormsSortableHeader>
                    <TableHead className="w-[20%]">Created by</TableHead>
                    <TableHead className="w-[15%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getTableData().map((item) => (
                    <TableRow key={`${item.type}-${item.id}`} className="group hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {item.type === 'folder' ? (
                            <div className="flex items-center gap-2">
                              <FolderOpen className="h-4 w-4 text-blue-500" />
                              <div>
                                <button
                                  onClick={() => handleViewFolder(item.id)}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                  data-testid={`folder-${item.id}`}
                                >
                                  {item.name}
                                </button>
                                <div className="text-sm text-gray-500">
                                  {item.itemCount} {item.itemCount === 1 ? 'form' : 'forms'}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-green-500" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={`/form-builder/${item.id}`} 
                                    className="font-medium text-primary hover:underline cursor-pointer"
                                    data-testid={`link-edit-form-${item.id}`}
                                  >
                                    {item.name}
                                  </a>
                                  {item.status && (
                                    <Badge 
                                      variant={item.status === 'published' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {item.status}
                                    </Badge>
                                  )}
                                </div>
                                {item.description && (
                                  <div className="text-sm text-gray-500 truncate max-w-xs">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(item.lastUpdated).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{item.createdBy || item.updatedBy || 'Unknown'}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              data-testid={`button-${item.type}-menu-${item.id}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {item.type === 'form' ? (
                              <>
                                <DropdownMenuItem asChild>
                                  <a href={`/form-builder/${item.id}`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateForm(item.originalForm)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleMoveToFolder(item.originalForm)}>
                                  <Folder className="h-4 w-4 mr-2" />
                                  Move to Folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteForm(item.originalForm)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => handleViewFolder(item.id)}
                                  data-testid={`button-view-folder-${item.id}`}
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Folder
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Rename Folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Folder
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Surveys Tab */}
      {activeTab === "surveys" && (
        <div>
          {/* Breadcrumb for folder navigation */}
          {selectedSurveyFolder && (
            <div className="mb-4">
              <nav className="flex items-center space-x-2 text-sm">
                <button
                  onClick={handleClearSurveyFolderFilter}
                  className="text-primary hover:text-primary/90 flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  All Surveys
                </button>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {surveyFolders.find(folder => folder.id === selectedSurveyFolder)?.name || 'Unknown Folder'}
                </span>
              </nav>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={selectedSurveyFolder ? "Search surveys in folder..." : "Search surveys..."}
                  value={surveySearchTerm}
                  onChange={(e) => setSurveySearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isCreateSurveyFolderDialogOpen} onOpenChange={setIsCreateSurveyFolderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-10">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Survey Folder</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateSurveyFolder} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Folder Name</label>
                      <Input name="name" placeholder="Enter folder name" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Input name="description" placeholder="Optional description" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateSurveyFolderDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createSurveyFolderMutation.isPending}>
                        Create Folder
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button
                onClick={() => window.location.href = '/survey-builder/new'}
                className="bg-primary hover:bg-primary/90 h-10"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Survey
              </Button>
            </div>
          </div>

          {surveysData.length === 0 && surveyFolders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No surveys yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first survey to start collecting responses
                </p>
                <Button
                  onClick={() => window.location.href = '/survey-builder/new'}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Survey
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="bg-background dark:bg-gray-900 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SurveySortableHeader field="name">Name</SurveySortableHeader>
                    <SurveySortableHeader field="status">Status</SurveySortableHeader>
                    <TableHead>Public URL</TableHead>
                    <SurveySortableHeader field="createdBy">Created by</SurveySortableHeader>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Show folders first when not inside a folder */}
                  {!selectedSurveyFolder && surveyFolders
                    .filter(folder => folder.name.toLowerCase().includes(surveySearchTerm.toLowerCase()))
                    .map((folder) => {
                      const surveysInFolder = surveysData.filter(s => s.folderId === folder.id);
                      return (
                        <TableRow key={`folder-${folder.id}`} className="bg-muted/30 hover:bg-muted/50">
                          <TableCell>
                            <button
                              onClick={() => handleSurveyFolderClick(folder.id)}
                              className="flex items-center gap-2 text-left hover:text-primary"
                            >
                              <FolderOpen className="h-5 w-5 text-primary" />
                              <div>
                                <span className="font-medium">{folder.name}</span>
                                <div className="text-sm text-muted-foreground">
                                  {surveysInFolder.length} survey{surveysInFolder.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </button>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">Folder</Badge>
                          </TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>-</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleSurveyFolderClick(folder.id)}>
                                  <FolderOpen className="h-4 w-4 mr-2" />
                                  Open Folder
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Rename Folder
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Folder
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                  {/* Show surveys */}
                  {surveysData
                    .filter(survey => {
                      const matchesSearch = survey.name.toLowerCase().includes(surveySearchTerm.toLowerCase());
                      const matchesFolder = selectedSurveyFolder 
                        ? survey.folderId === selectedSurveyFolder
                        : !survey.folderId;
                      return matchesSearch && matchesFolder;
                    })
                    .sort((a, b) => {
                      if (!surveySortField) return 0;
                      
                      let aVal: string | number = '';
                      let bVal: string | number = '';
                      
                      if (surveySortField === 'name') {
                        aVal = a.name.toLowerCase();
                        bVal = b.name.toLowerCase();
                      } else if (surveySortField === 'status') {
                        aVal = a.status.toLowerCase();
                        bVal = b.status.toLowerCase();
                      } else if (surveySortField === 'createdBy') {
                        aVal = (a.createdByName || '').toLowerCase();
                        bVal = (b.createdByName || '').toLowerCase();
                      }
                      
                      if (aVal < bVal) return surveySortDirection === 'asc' ? -1 : 1;
                      if (aVal > bVal) return surveySortDirection === 'asc' ? 1 : -1;
                      return 0;
                    })
                    .map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell>
                        <div>
                          <Link href={`/survey-builder/${survey.id}`}>
                            <span className="font-medium text-primary hover:underline cursor-pointer">
                              {survey.name}
                            </span>
                          </Link>
                          {survey.description && (
                            <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {survey.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={survey.status === 'published' ? 'default' : 'secondary'}>
                          {survey.status === 'published' ? (
                            <>
                              <Globe className="h-3 w-3 mr-1" />
                              Published
                            </>
                          ) : (
                            'Draft'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {survey.status === 'published' ? (
                          <button
                            onClick={() => {
                              const url = `${window.location.origin}/s/${survey.shortCode}`;
                              navigator.clipboard.writeText(url);
                              toast({
                                title: "URL copied",
                                description: "Survey URL copied to clipboard",
                              });
                            }}
                            className="text-primary hover:underline flex items-center gap-1 text-sm"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Copy Link
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not published</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {survey.createdByName || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => window.location.href = `/survey-builder/${survey.id}`}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.location.href = `/survey-builder/${survey.id}?tab=submissions`}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Submissions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSurveyToMove(survey);
                                setMoveSurveyToFolderDialogOpen(true);
                              }}
                            >
                              <Folder className="h-4 w-4 mr-2" />
                              Move to Folder
                            </DropdownMenuItem>
                            {survey.status === 'published' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSurveyToEmbed(survey);
                                  setEmbedDialogOpen(true);
                                }}
                              >
                                <Code className="h-4 w-4 mr-2" />
                                Get Embed Code
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteSurveyMutation.mutate(survey.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Move Survey to Folder Dialog */}
      <Dialog open={moveSurveyToFolderDialogOpen} onOpenChange={setMoveSurveyToFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Survey to Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a folder to move "{surveyToMove?.name}" to:
            </p>
            <div className="space-y-2">
              <Button
                variant={surveyToMove?.folderId === null ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => moveSurveyToFolderMutation.mutate({ surveyId: surveyToMove?.id, folderId: null })}
              >
                <Folder className="h-4 w-4 mr-2" />
                No Folder (Root)
              </Button>
              {surveyFolders.map((folder) => (
                <Button
                  key={folder.id}
                  variant={surveyToMove?.folderId === folder.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => moveSurveyToFolderMutation.mutate({ surveyId: surveyToMove?.id, folderId: folder.id })}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {folder.name}
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Survey Embed Code Dialog */}
      <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embed Survey: {surveyToEmbed?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Direct URL</label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={`${window.location.origin}/s/${surveyToEmbed?.shortCode}`}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/s/${surveyToEmbed?.shortCode}`);
                    toast({ title: "Copied", description: "Survey URL copied to clipboard" });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Embed Code (iframe)</label>
              <div className="flex gap-2">
                <Textarea
                  readOnly
                  value={`<iframe src="${window.location.origin}/embed/survey/${surveyToEmbed?.shortCode}" width="100%" height="600" frameborder="0" style="border: none;"></iframe>`}
                  className="font-mono text-xs"
                  rows={3}
                />
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(`<iframe src="${window.location.origin}/embed/survey/${surveyToEmbed?.shortCode}" width="100%" height="600" frameborder="0" style="border: none;"></iframe>`);
                    toast({ title: "Copied", description: "Embed code copied to clipboard" });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Paste this code into your website's HTML to embed the survey. Adjust the height value as needed.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog open={moveToFolderDialogOpen} onOpenChange={setMoveToFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Form to Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmMoveToFolder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Move "{formToMove?.name}" to folder:
              </label>
              <Select name="folderId" defaultValue={formToMove?.folderId || "no-folder"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-folder">No folder</SelectItem>
                  {formFolders.map((folder: any) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setMoveToFolderDialogOpen(false);
                setFormToMove(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={moveFormToFolderMutation.isPending}>
                Move Form
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Email Template to Folder Dialog */}
      <Dialog open={moveEmailToFolderDialogOpen} onOpenChange={setMoveEmailToFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Email Template to Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const folderId = formData.get("folderId") as string;
            if (emailTemplateToMove) {
              moveEmailToFolderMutation.mutate({
                templateId: emailTemplateToMove.id,
                folderId: folderId === "no-folder" ? null : folderId
              });
            }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Move "{emailTemplateToMove?.name}" to folder:
              </label>
              <Select name="folderId" defaultValue={emailTemplateToMove?.folderId || "no-folder"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-folder">No folder</SelectItem>
                  {emailFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setMoveEmailToFolderDialogOpen(false);
                setEmailTemplateToMove(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={moveEmailToFolderMutation.isPending}>
                Move Template
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move SMS Template to Folder Dialog */}
      <Dialog open={moveSmsToFolderDialogOpen} onOpenChange={setMoveSmsToFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move SMS Template to Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const folderId = formData.get("folderId") as string;
            if (smsTemplateToMove) {
              moveSmsToFolderMutation.mutate({
                templateId: smsTemplateToMove.id,
                folderId: folderId === "no-folder" ? null : folderId
              });
            }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Move "{smsTemplateToMove?.name}" to folder:
              </label>
              <Select name="folderId" defaultValue={smsTemplateToMove?.folderId || "no-folder"}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a folder" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-folder">No folder</SelectItem>
                  {smsFolders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setMoveSmsToFolderDialogOpen(false);
                setSmsTemplateToMove(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={moveSmsToFolderMutation.isPending}>
                Move Template
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) {
          setTemplateToDelete(null);
          setFormToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {templateToDelete 
                ? `This will permanently delete the ${templateToDelete.type} template "${templateToDelete.name}". This action cannot be undone.`
                : formToDelete 
                  ? `This will permanently delete the form "${formToDelete.name}". This action cannot be undone.`
                  : 'This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (templateToDelete) {
                  confirmDeleteTemplate();
                } else if (formToDelete) {
                  confirmDeleteForm();
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Folder Dialog */}
      <Dialog open={isEditFolderDialogOpen} onOpenChange={setIsEditFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditFolder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Folder Name</label>
              <Input name="name" defaultValue={folderToEdit?.name || ""} placeholder="Enter folder name" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input name="description" defaultValue={folderToEdit?.description || ""} placeholder="Optional description" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditFolderDialogOpen(false);
                setFolderToEdit(null);
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={editFolderMutation.isPending}>
                Update Folder
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Folder Confirmation Dialog */}
      <AlertDialog open={deleteFolderDialogOpen} onOpenChange={(open) => {
        setDeleteFolderDialogOpen(open);
        if (!open) {
          setFolderToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              {folderToDelete 
                ? `This will permanently delete the folder "${folderToDelete.name}". Templates in this folder will be moved to no folder. This action cannot be undone.`
                : 'This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (folderToDelete) {
                  deleteFolderMutation.mutate(folderToDelete.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

