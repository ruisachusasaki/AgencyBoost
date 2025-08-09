import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, Upload, Camera, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useMutation } from "@tanstack/react-query";
import type { UploadResult } from "@uppy/core";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function MyProfile() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signatureEnabled, setSignatureEnabled] = useState(true);
  
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@agencyflow.com",
    phone: "(555) 123-4567",
    extension: "101",
    calendar: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    signature: `<p><strong>Best regards,</strong></p><p>John Doe<br>AgencyFlow Marketing<br><a href="mailto:john@agencyflow.com">john@agencyflow.com</a><br>(555) 123-4567</p>`
  });

  const profileImageMutation = useMutation({
    mutationFn: async (imageURL: string) => {
      const response = await fetch("/api/profile-images", {
        method: "PUT",
        body: JSON.stringify({ imageURL }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to save image");
      return response.json();
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // TODO: Implement API call to save profile
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                My Profile
              </h1>
              <p className="text-gray-600 mt-2">Manage your personal profile and preferences</p>
            </div>
            <Link href="/settings">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Settings</span>
              </Button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {profileImageUrl ? (
                    <img 
                      src={profileImageUrl} 
                      alt="Profile photo" 
                      className="w-32 h-32 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB
                    onGetUploadParameters={async () => {
                      const response = await fetch("/api/objects/upload", { method: "POST" });
                      const data = await response.json();
                      return { method: "PUT" as const, url: data.uploadURL };
                    }}
                    onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                      const uploadedFile = result.successful[0];
                      if (uploadedFile?.uploadURL) {
                        profileImageMutation.mutate(uploadedFile.uploadURL as string, {
                          onSuccess: (data) => {
                            setProfileImageUrl(data.objectPath);
                            toast({
                              title: "Success",
                              description: "Profile photo uploaded successfully.",
                            });
                          },
                          onError: () => {
                            toast({
                              title: "Error",
                              description: "Failed to save photo. Please try again.",
                              variant: "destructive",
                            });
                          }
                        });
                      }
                    }}
                    buttonClassName="mb-2"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Upload Photo
                  </ObjectUploader>
                  <p className="text-sm text-gray-500">
                    Recommended: 500x500px, PNG or JPG, max 5MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="extension">Extension</Label>
                  <Input
                    id="extension"
                    value={formData.extension}
                    onChange={(e) => handleInputChange('extension', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="calendar">Internal Calendar</Label>
                <Select value={formData.calendar} onValueChange={(value) => handleInputChange('calendar', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a calendar (Coming Soon)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Calendar</SelectItem>
                    <SelectItem value="sales">Sales Calendar</SelectItem>
                    <SelectItem value="marketing">Marketing Calendar</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500 mt-1">
                  Calendar integration is coming soon
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Password Update */}
          <Card>
            <CardHeader>
              <CardTitle>Password Update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Password must be at least 8 characters long and include uppercase, lowercase, and numbers.
              </p>
            </CardContent>
          </Card>

          {/* Email Signature */}
          <Card>
            <CardHeader>
              <CardTitle>Email Signature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="signatureEnabled" className="text-sm font-medium">
                    Enable signature on all outgoing messages
                  </Label>
                  <Switch
                    id="signatureEnabled"
                    checked={signatureEnabled}
                    onCheckedChange={setSignatureEnabled}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Signature Content</Label>
                  <ReactQuill
                    value={formData.signature}
                    onChange={(value) => handleInputChange('signature', value)}
                    modules={{
                      toolbar: [
                        [{ 'header': [1, 2, false] }],
                        ['bold', 'italic', 'underline'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link'],
                        ['clean']
                      ],
                    }}
                    formats={[
                      'header', 'bold', 'italic', 'underline',
                      'color', 'background', 'list', 'bullet', 'link'
                    ]}
                    style={{ 
                      height: '200px',
                      marginBottom: '50px'
                    }}
                    className={!signatureEnabled ? 'opacity-50 pointer-events-none' : ''}
                  />
                </div>
                
                <p className="text-sm text-gray-500">
                  This signature will be automatically added to all outgoing emails when enabled.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}