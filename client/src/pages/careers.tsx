import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Briefcase, MapPin, DollarSign, Building2, Clock, CheckCircle } from "lucide-react";
import JobApplicationFormSimple from "@/components/forms/job-application-form-simple";

function stripHtml(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
}

function lightenColor(hex: string, amount: number): string {
  if (!hex || hex.length < 7) return '#ffffff';
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

interface JobOpening {
  id: string;
  departmentName: string;
  positionTitle: string;
  employmentType: string;
  location?: string;
  compensation?: string;
  compensationType?: string;
  jobDescription?: string;
  benefits?: string;
  status: string;
  approvalStatus: string;
}

interface CareersConfig {
  fields?: any[];
  branding?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
    pageHeading?: string;
    pageDescription?: string;
    applyButtonText?: string;
    successHeading?: string;
    successDescription?: string;
    whyWorkHeading?: string;
    benefit1Title?: string;
    benefit1Description?: string;
    benefit2Title?: string;
    benefit2Description?: string;
    benefit3Title?: string;
    benefit3Description?: string;
  };
}

const defaults = {
  primaryColor: '#2563eb',
  pageHeading: 'Join Our Team',
  pageDescription: "We're looking for talented individuals to help us build the future. Explore our open positions and become part of something amazing.",
  applyButtonText: 'Apply Now',
  successHeading: 'Application Submitted Successfully!',
  successDescription: 'Thank you for your interest. We\'ll review your application and get back to you soon.',
  whyWorkHeading: 'Why Work With Us?',
  benefit1Title: 'Growth Opportunities',
  benefit1Description: 'We invest in our people with continuous learning and career development programs.',
  benefit2Title: 'Great Benefits',
  benefit2Description: 'Comprehensive health coverage, flexible time off, and competitive compensation packages.',
  benefit3Title: 'Great Culture',
  benefit3Description: 'Join a collaborative team that values innovation, creativity, and work-life balance.',
};

export default function CareersPage() {
  const [selectedPosition, setSelectedPosition] = useState<JobOpening | null>(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const { data: jobOpenings, isLoading } = useQuery<JobOpening[]>({
    queryKey: ["/api/job-openings/public"],
    retry: false,
  });

  const { data: configData } = useQuery<CareersConfig>({
    queryKey: ["/api/job-application-form-config"],
    retry: false,
  });

  const b = configData?.branding || {};
  const primaryColor = b.primaryColor || defaults.primaryColor;
  const pageHeading = b.pageHeading || defaults.pageHeading;
  const pageDescription = b.pageDescription || defaults.pageDescription;
  const applyButtonText = b.applyButtonText || defaults.applyButtonText;
  const successHeading = b.successHeading || defaults.successHeading;
  const successDescription = b.successDescription || defaults.successDescription;
  const whyWorkHeading = b.whyWorkHeading || defaults.whyWorkHeading;
  const benefit1Title = b.benefit1Title || defaults.benefit1Title;
  const benefit1Description = b.benefit1Description || defaults.benefit1Description;
  const benefit2Title = b.benefit2Title || defaults.benefit2Title;
  const benefit2Description = b.benefit2Description || defaults.benefit2Description;
  const benefit3Title = b.benefit3Title || defaults.benefit3Title;
  const benefit3Description = b.benefit3Description || defaults.benefit3Description;

  const openPositions = jobOpenings || [];

  const handleApplicationSuccess = () => {
    setApplicationSubmitted(true);
    setSelectedPosition(null);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${lightenColor(primaryColor, 200)} 0%, ${lightenColor(primaryColor, 180)} 100%)` }}
      >
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2" style={{ color: primaryColor }} />
          <p className="text-gray-600">Loading available positions...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: `linear-gradient(135deg, ${lightenColor(primaryColor, 200)} 0%, ${lightenColor(primaryColor, 180)} 100%)` }}
    >
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            {(b.logoUrl || b.companyName) && (
              <div className="flex items-center justify-center gap-3 mb-4">
                {b.logoUrl && (
                  <img src={b.logoUrl} alt="Company logo" className="h-12 w-auto object-contain" />
                )}
                {b.companyName && (
                  <span className="text-xl font-semibold text-gray-800">{b.companyName}</span>
                )}
              </div>
            )}
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{pageHeading}</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {pageDescription}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {applicationSubmitted && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <p className="font-semibold">{successHeading}</p>
            </div>
            <p className="text-green-700 mt-1">
              {successDescription}
            </p>
          </div>
        )}

        {openPositions.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Open Positions</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              We don't have any open positions at the moment, but we're always looking for great talent. 
              Check back soon for new opportunities!
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Open Positions</h2>
              <p className="text-gray-600">
                Found {openPositions.length} open position{openPositions.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid gap-6">
              {openPositions.map((position) => (
                <Card key={position.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{position.positionTitle}</CardTitle>
                        <CardDescription className="flex items-center gap-4 text-base">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            {position.departmentName}
                          </div>
                          {position.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {position.location}
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      
                      <Dialog
                        open={selectedPosition?.id === position.id}
                        onOpenChange={(open) => setSelectedPosition(open ? position : null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            data-testid={`button-apply-${position.id}`}
                            style={{ backgroundColor: primaryColor }}
                            className="text-white hover:opacity-90"
                          >
                            {applyButtonText}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Apply for {position.positionTitle}</DialogTitle>
                            <DialogDescription>
                              Fill out the application form below to apply for this position.
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedPosition && (
                            <JobApplicationFormSimple
                              preSelectedPosition={selectedPosition.id}
                              onSuccess={handleApplicationSuccess}
                            />
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="secondary" className="capitalize">
                        {position.employmentType.replace('_', ' ')}
                      </Badge>
                      {position.compensation && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {position.compensation} {position.compensationType === 'hourly' ? '/hour' : '/year'}
                        </Badge>
                      )}
                    </div>

                    {position.jobDescription && (
                      <div className="text-sm text-gray-600 line-clamp-3">
                        {stripHtml(position.jobDescription)}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        <div className="mt-16 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Apply for a Position</h2>
            <p className="text-gray-600">
              Ready to join our team? Fill out the application form below to get started.
            </p>
          </div>
          <JobApplicationFormSimple onSuccess={handleApplicationSuccess} />
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{whyWorkHeading}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: lightenColor(primaryColor, 200) }}
              >
                <Briefcase className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{benefit1Title}</h3>
              <p className="text-gray-600">{benefit1Description}</p>
            </div>
            
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: lightenColor(primaryColor, 200) }}
              >
                <CheckCircle className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{benefit2Title}</h3>
              <p className="text-gray-600">{benefit2Description}</p>
            </div>
            
            <div className="text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: lightenColor(primaryColor, 200) }}
              >
                <Building2 className="h-8 w-8" style={{ color: primaryColor }} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{benefit3Title}</h3>
              <p className="text-gray-600">{benefit3Description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
