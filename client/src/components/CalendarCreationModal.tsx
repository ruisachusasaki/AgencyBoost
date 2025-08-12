import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, Settings, Clock, ArrowLeft, ArrowRight, Check, X } from "lucide-react";

interface CalendarCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCalendar: (calendarData: any) => void;
  staff: Array<{ id: string; firstName: string; lastName: string; email: string }>;
}

interface CalendarFormData {
  // Step 1
  type: "personal" | "round_robin" | "";
  
  // Step 2
  name: string;
  description: string;
  meetingInviteTitle: string;
  assignedStaff: string[];
  customUrl: string;
  location: "custom" | "google_meet" | "zoom";
  locationDetails: string;
  
  // Step 3
  weeklyHours: {
    [key: string]: { enabled: boolean; startTime: string; endTime: string };
  };
  slotInterval: { value: number; unit: "minutes" | "hours" };
  meetingDuration: { value: number; unit: "minutes" | "hours" };
  minimumNotice: { value: number; unit: "hours" | "days" | "weeks" };
  dateRange: { value: number; unit: "days" | "weeks" };
  maxBookingsPerDay: number;
  maxBookersPerSlot: number;
  preBufferTime: { value: number; unit: "minutes" | "hours" };
  postBufferTime: { value: number; unit: "minutes" | "hours" };
}

const defaultFormData: CalendarFormData = {
  type: "",
  name: "",
  description: "",
  meetingInviteTitle: "",
  assignedStaff: [],
  customUrl: "",
  location: "google_meet",
  locationDetails: "",
  weeklyHours: {
    monday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    tuesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    wednesday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    thursday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    friday: { enabled: true, startTime: "09:00", endTime: "17:00" },
    saturday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    sunday: { enabled: false, startTime: "09:00", endTime: "17:00" }
  },
  slotInterval: { value: 30, unit: "minutes" },
  meetingDuration: { value: 30, unit: "minutes" },
  minimumNotice: { value: 24, unit: "hours" },
  dateRange: { value: 60, unit: "days" },
  maxBookingsPerDay: 8,
  maxBookersPerSlot: 1,
  preBufferTime: { value: 15, unit: "minutes" },
  postBufferTime: { value: 15, unit: "minutes" }
};

export function CalendarCreationModal({ isOpen, onClose, onCreateCalendar, staff }: CalendarCreationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CalendarFormData>(defaultFormData);

  const handleClose = () => {
    setCurrentStep(1);
    setFormData(defaultFormData);
    onClose();
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Convert form data to API format
    const calendarData = {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      customUrl: formData.customUrl || `calendar-${Date.now()}`,
      duration: formData.meetingDuration.unit === "hours" 
        ? formData.meetingDuration.value * 60 
        : formData.meetingDuration.value,
      durationUnit: "minutes",
      location: formData.location,
      locationDetails: formData.locationDetails,
      bufferTime: formData.preBufferTime.unit === "hours"
        ? formData.preBufferTime.value * 60
        : formData.preBufferTime.value,
      scheduleWindowStart: formData.minimumNotice.unit === "days"
        ? formData.minimumNotice.value * 24
        : formData.minimumNotice.unit === "weeks"
        ? formData.minimumNotice.value * 24 * 7
        : formData.minimumNotice.value,
      scheduleWindowEnd: formData.dateRange.unit === "weeks"
        ? formData.dateRange.value * 24 * 7
        : formData.dateRange.value * 24,
      isActive: true,
      customFieldIds: [],
      createdBy: "9788c16a-ba2a-40cb-af7b-26d2816d6390" // TODO: Use actual current user
    };

    onCreateCalendar(calendarData);
    handleClose();
  };

  const updateFormData = (updates: Partial<CalendarFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const canProceedFromStep1 = formData.type !== "";
  const canProceedFromStep2 = formData.name.trim() !== "" && formData.customUrl.trim() !== "" && 
    (formData.type === "personal" ? formData.assignedStaff.length === 1 : formData.assignedStaff.length > 0);

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Choose Your Calendar Type</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select the type of calendar that best fits your needs
        </p>
      </div>
      
      <div className="grid gap-4">
        <Card 
          className={`cursor-pointer transition-all ${
            formData.type === "personal" 
              ? "border-primary bg-primary/5" 
              : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
          }`}
          onClick={() => updateFormData({ type: "personal", maxBookersPerSlot: 1 })}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Personal Booking Calendar</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Schedules one-on-one meetings with a specific team member.
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-xs">Client meetings</Badge>
                  <Badge variant="outline" className="text-xs">Private consultations</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            formData.type === "round_robin" 
              ? "border-primary bg-primary/5" 
              : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
          }`}
          onClick={() => updateFormData({ type: "round_robin" })}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Round Robin Calendar</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Distributes appointments among team members in a rotating order.
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="outline" className="text-xs">Sales calls</Badge>
                  <Badge variant="outline" className="text-xs">Onboarding sessions</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Calendar Settings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure your calendar details and settings
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="calendar-name">Calendar Name *</Label>
          <Input
            id="calendar-name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            placeholder="Enter calendar name"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="calendar-description">Description</Label>
          <Textarea
            id="calendar-description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Brief description of this calendar"
            rows={2}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="meeting-title">Meeting Invite Title</Label>
          <Input
            id="meeting-title"
            value={formData.meetingInviteTitle}
            onChange={(e) => updateFormData({ meetingInviteTitle: e.target.value })}
            placeholder="Meeting with {CONTACT_NAME}"
          />
          <p className="text-xs text-gray-500">Supports merge tags like {"{CONTACT_NAME}"}, {"{CONTACT_EMAIL}"}</p>
        </div>

        <div className="grid gap-2">
          <Label>Assign Staff Members *</Label>
          <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
            {staff.map((member) => (
              <div key={member.id} className="flex items-center space-x-2 py-1">
                <Checkbox
                  checked={formData.assignedStaff.includes(member.id)}
                  onCheckedChange={(checked) => {
                    if (formData.type === "personal") {
                      // Personal booking: only one staff member
                      updateFormData({ assignedStaff: checked ? [member.id] : [] });
                    } else {
                      // Round robin: multiple staff members
                      const newStaff = checked 
                        ? [...formData.assignedStaff, member.id]
                        : formData.assignedStaff.filter(id => id !== member.id);
                      updateFormData({ assignedStaff: newStaff });
                    }
                  }}
                />
                <Label className="text-sm">
                  {member.firstName} {member.lastName} ({member.email})
                </Label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {formData.type === "personal" 
              ? "Select one team member for personal bookings"
              : "Select multiple team members for round robin distribution"
            }
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="custom-url">Custom URL *</Label>
          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md">
              /book/
            </span>
            <Input
              id="custom-url"
              value={formData.customUrl}
              onChange={(e) => updateFormData({ customUrl: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              placeholder="my-calendar"
              className="rounded-l-none"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Meeting Location</Label>
          <Select value={formData.location} onValueChange={(value: "custom" | "google_meet" | "zoom") => updateFormData({ location: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google_meet">Google Meet</SelectItem>
              <SelectItem value="zoom">Zoom</SelectItem>
              <SelectItem value="custom">Custom Location</SelectItem>
            </SelectContent>
          </Select>
          {formData.location === "custom" && (
            <Input
              value={formData.locationDetails}
              onChange={(e) => updateFormData({ locationDetails: e.target.value })}
              placeholder="Enter custom location details"
            />
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Availability Settings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure when and how bookings can be made
        </p>
      </div>

      {/* Weekly Hours */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Weekly Available Hours</Label>
        <div className="grid gap-2">
          {Object.entries(formData.weeklyHours).map(([day, hours]) => (
            <div key={day} className="flex items-center gap-3 p-2 border rounded-lg">
              <Checkbox
                checked={hours.enabled}
                onCheckedChange={(checked) => 
                  updateFormData({
                    weeklyHours: {
                      ...formData.weeklyHours,
                      [day]: { ...hours, enabled: !!checked }
                    }
                  })
                }
              />
              <div className="w-20 text-sm capitalize">{day}</div>
              {hours.enabled && (
                <div className="flex gap-2 items-center">
                  <Input
                    type="time"
                    value={hours.startTime}
                    onChange={(e) => 
                      updateFormData({
                        weeklyHours: {
                          ...formData.weeklyHours,
                          [day]: { ...hours, startTime: e.target.value }
                        }
                      })
                    }
                    className="w-24"
                  />
                  <span className="text-xs text-gray-500">to</span>
                  <Input
                    type="time"
                    value={hours.endTime}
                    onChange={(e) => 
                      updateFormData({
                        weeklyHours: {
                          ...formData.weeklyHours,
                          [day]: { ...hours, endTime: e.target.value }
                        }
                      })
                    }
                    className="w-24"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Time Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Slot Interval</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={formData.slotInterval.value}
              onChange={(e) => updateFormData({
                slotInterval: { ...formData.slotInterval, value: parseInt(e.target.value) || 1 }
              })}
              className="flex-1"
            />
            <Select 
              value={formData.slotInterval.unit} 
              onValueChange={(value: "minutes" | "hours") => 
                updateFormData({ slotInterval: { ...formData.slotInterval, unit: value } })
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Min</SelectItem>
                <SelectItem value="hours">Hrs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Meeting Duration</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={formData.meetingDuration.value}
              onChange={(e) => updateFormData({
                meetingDuration: { ...formData.meetingDuration, value: parseInt(e.target.value) || 1 }
              })}
              className="flex-1"
            />
            <Select 
              value={formData.meetingDuration.unit} 
              onValueChange={(value: "minutes" | "hours") => 
                updateFormData({ meetingDuration: { ...formData.meetingDuration, unit: value } })
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Min</SelectItem>
                <SelectItem value="hours">Hrs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Minimum Scheduling Notice</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={formData.minimumNotice.value}
              onChange={(e) => updateFormData({
                minimumNotice: { ...formData.minimumNotice, value: parseInt(e.target.value) || 1 }
              })}
              className="flex-1"
            />
            <Select 
              value={formData.minimumNotice.unit} 
              onValueChange={(value: "hours" | "days" | "weeks") => 
                updateFormData({ minimumNotice: { ...formData.minimumNotice, unit: value } })
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Hrs</SelectItem>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Wks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Date Range</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              value={formData.dateRange.value}
              onChange={(e) => updateFormData({
                dateRange: { ...formData.dateRange, value: parseInt(e.target.value) || 1 }
              })}
              className="flex-1"
            />
            <Select 
              value={formData.dateRange.unit} 
              onValueChange={(value: "days" | "weeks") => 
                updateFormData({ dateRange: { ...formData.dateRange, unit: value } })
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">Days</SelectItem>
                <SelectItem value="weeks">Wks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Booking Limits */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Max Bookings Per Day</Label>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateFormData({ maxBookingsPerDay: Math.max(1, formData.maxBookingsPerDay - 1) })}
              disabled={formData.maxBookingsPerDay <= 1}
            >
              -
            </Button>
            <Input
              type="number"
              min="1"
              value={formData.maxBookingsPerDay}
              onChange={(e) => updateFormData({ maxBookingsPerDay: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-16 text-center"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateFormData({ maxBookingsPerDay: formData.maxBookingsPerDay + 1 })}
            >
              +
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Max Bookers Per Slot</Label>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateFormData({ maxBookersPerSlot: Math.max(1, formData.maxBookersPerSlot - 1) })}
              disabled={formData.maxBookersPerSlot <= 1 || formData.type === "personal"}
            >
              -
            </Button>
            <Input
              type="number"
              min="1"
              value={formData.maxBookersPerSlot}
              onChange={(e) => updateFormData({ maxBookersPerSlot: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-16 text-center"
              disabled={formData.type === "personal"}
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => updateFormData({ maxBookersPerSlot: formData.maxBookersPerSlot + 1 })}
              disabled={formData.type === "personal"}
            >
              +
            </Button>
          </div>
          {formData.type === "personal" && (
            <p className="text-xs text-gray-500">Fixed at 1 for personal bookings</p>
          )}
        </div>
      </div>

      {/* Buffer Times */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm">Pre-Buffer Time</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              value={formData.preBufferTime.value}
              onChange={(e) => updateFormData({
                preBufferTime: { ...formData.preBufferTime, value: parseInt(e.target.value) || 0 }
              })}
              className="flex-1"
            />
            <Select 
              value={formData.preBufferTime.unit} 
              onValueChange={(value: "minutes" | "hours") => 
                updateFormData({ preBufferTime: { ...formData.preBufferTime, unit: value } })
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Min</SelectItem>
                <SelectItem value="hours">Hrs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Post-Buffer Time</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0"
              value={formData.postBufferTime.value}
              onChange={(e) => updateFormData({
                postBufferTime: { ...formData.postBufferTime, value: parseInt(e.target.value) || 0 }
              })}
              className="flex-1"
            />
            <Select 
              value={formData.postBufferTime.unit} 
              onValueChange={(value: "minutes" | "hours") => 
                updateFormData({ postBufferTime: { ...formData.postBufferTime, unit: value } })
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minutes">Min</SelectItem>
                <SelectItem value="hours">Hrs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Create New Calendar
            <span className="text-sm font-normal text-gray-500">
              Step {currentStep} of 3
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep > step 
                  ? "bg-primary text-white" 
                  : currentStep === step 
                  ? "bg-primary text-white" 
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500"
              }`}>
                {currentStep > step ? <Check className="h-4 w-4" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-0.5 ${
                  currentStep > step ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            )}
            
            {currentStep < 3 ? (
              <Button 
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !canProceedFromStep1) ||
                  (currentStep === 2 && !canProceedFromStep2)
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit}>
                <Check className="h-4 w-4 mr-2" />
                Create Calendar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}