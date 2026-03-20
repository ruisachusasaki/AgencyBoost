import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building, Upload, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UploadResult } from "@uppy/core";

export default function BusinessProfile() {
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState<string>("");
  
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    phone: "",
    website: "",
    timeZone: "America/New_York",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: ""
  });

  // Fetch business profile data
  const { data: businessProfileData, isLoading } = useQuery({
    queryKey: ['/api/business-profile'],
  });

  // Update form data when profile is loaded
  useEffect(() => {
    if (businessProfileData) {
      setFormData({
        companyName: businessProfileData.companyName || "",
        email: businessProfileData.email || "",
        phone: businessProfileData.phone || "",
        website: businessProfileData.website || "",
        timeZone: businessProfileData.timezone || "America/New_York",
        address: businessProfileData.address || "",
        city: businessProfileData.city || "",
        state: businessProfileData.state || "",
        zipCode: businessProfileData.zipCode || "",
        country: businessProfileData.country || ""
      });
      if (businessProfileData.logo) {
        setLogoUrl(businessProfileData.logo);
      }
    }
  }, [businessProfileData]);

  const profileImageMutation = useMutation({
    mutationFn: async (imageURL: string) => {
      const response = await fetch("/api/profile-images", {
        method: "PUT",
        body: JSON.stringify({ profileImageURL: imageURL }),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to save image");
      return response.json();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PUT", "/api/business-profile", {
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        website: data.website,
        timezone: data.timeZone,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        logo: logoUrl
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/business-profile'] });
      toast({
        title: "Success",
        variant: "default",
        description: "Business profile updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update business profile. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading business profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Back to Settings */}
      <div className="mb-4">
        <Link href="/settings">
          <Button variant="outline" size="sm" className="flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Settings</span>
          </Button>
        </Link>
      </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Building className="h-8 w-8 text-primary" />
            Business Profile
          </h1>
          <p className="text-gray-600 mt-2">Manage your company information and branding</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Company Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Company logo" 
                      className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <Building className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760} // 10MB
                    onGetUploadParameters={async () => {
                      const response = await fetch("/api/objects/upload", { method: "POST" });
                      const data = await response.json();
                      return { method: "PUT" as const, url: data.uploadURL };
                    }}
                    onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                      const uploadedFile = result.successful[0];
                      if (uploadedFile?.uploadURL) {
                        profileImageMutation.mutate(uploadedFile.uploadURL as string, {
                          onSuccess: async (data) => {
                            setLogoUrl(data.objectPath);
                            
                            // Auto-save the logo to the business profile
                            try {
                              await apiRequest("PUT", "/api/business-profile", {
                                ...formData,
                                timezone: formData.timeZone,
                                logo: data.objectPath
                              });
                              
                              toast({
                                title: "Success",
                                variant: "default",
                                description: "Company logo uploaded and saved successfully.",
                              });
                              
                              // Invalidate the business profile cache to refresh the data
                              queryClient.invalidateQueries({ queryKey: ['/api/business-profile'] });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Logo uploaded but failed to save to profile. Please click Save Changes.",
                                variant: "destructive",
                              });
                            }
                          },
                          onError: () => {
                            toast({
                              title: "Error",
                              description: "Failed to save logo. Please try again.",
                              variant: "destructive",
                            });
                          }
                        });
                      }
                    }}
                    buttonClassName="mb-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </ObjectUploader>
                  <p className="text-sm text-gray-500">
                    Recommended: 500x500px, PNG or JPG, max 10MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Business Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Business Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="timeZone">Time Zone</Label>
                <Select value={formData.timeZone} onValueChange={(value) => handleInputChange('timeZone', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                    <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
    </div>
  );
}