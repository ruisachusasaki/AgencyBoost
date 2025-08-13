import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function BookingEmbed() {
  const { customUrl } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const { data: calendar, isLoading } = useQuery({
    queryKey: ["/api/calendars/by-url", customUrl],
    enabled: !!customUrl
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!calendar) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold mb-2">Calendar Not Found</h1>
            <p className="text-muted-foreground">
              The booking calendar you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDateTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setCurrentStep(2);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would save the booking to the database
    setCurrentStep(3);
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      slots.push(`${hour}:00`);
      slots.push(`${hour}:30`);
    }
    return slots;
  };

  const generateDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{calendar.name}</CardTitle>
          {calendar.description && (
            <p className="text-muted-foreground mt-2">{calendar.description}</p>
          )}
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-2">
            <Clock className="h-4 w-4" />
            <span>{calendar.duration || 30} minutes</span>
          </div>
        </CardHeader>

        <CardContent>
          {/* Step 1: Date & Time Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4">Select Date & Time</h3>
              </div>

              {/* Date Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Available Dates</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {generateDates().map((date) => {
                    const dateObj = new Date(date);
                    const isSelected = selectedDate === date;
                    return (
                      <Button
                        key={date}
                        variant={isSelected ? "default" : "outline"}
                        className="h-auto p-3 flex flex-col"
                        onClick={() => setSelectedDate(date)}
                        data-testid={`button-date-${date}`}
                      >
                        <span className="font-semibold">
                          {dateObj.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div>
                  <Label className="text-sm font-medium mb-3 block">Available Times</Label>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                    {generateTimeSlots().map((time) => (
                      <Button
                        key={time}
                        variant="outline"
                        onClick={() => handleDateTimeSelect(selectedDate, time)}
                        data-testid={`button-time-${time}`}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Your Information</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {selectedTime}
                </p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    data-testid="input-phone"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Tell us about your project or any specific requirements..."
                    data-testid="textarea-message"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    data-testid="button-back"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" data-testid="button-book">
                    Book Appointment
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 3 && (
            <div className="text-center space-y-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-xl font-semibold mb-2">Booking Confirmed!</h3>
                <p className="text-muted-foreground">
                  Your appointment has been scheduled for{" "}
                  <strong>
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} at {selectedTime}
                  </strong>
                </p>
              </div>
              <div className="bg-muted p-4 rounded-lg text-sm">
                <p><strong>What's next?</strong></p>
                <p>You'll receive a confirmation email shortly with all the details and next steps.</p>
              </div>
              <Button
                onClick={() => {
                  setCurrentStep(1);
                  setSelectedDate("");
                  setSelectedTime("");
                  setFormData({ name: "", email: "", phone: "", message: "" });
                }}
                data-testid="button-book-another"
              >
                Book Another Appointment
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}