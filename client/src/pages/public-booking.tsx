import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, User, Mail, Phone } from "lucide-react";
import { format, addDays, startOfWeek, isAfter, isBefore, startOfDay, addMinutes } from "date-fns";

interface CalendarData {
  id: string;
  name: string;
  description?: string;
  type: string;
  customUrl: string;
  duration: number;
  location?: string;
  locationDetails?: string;
  bufferTime: number;
  scheduleWindowStart: number;
  scheduleWindowEnd: number;
  isActive: boolean;
  color: string;
  publicUrl: string;
  createdAt: string;
}

interface BookingForm {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function PublicBooking() {
  const [match, params] = useRoute("/book/:customUrl");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [step, setStep] = useState(1); // 1: Select Time, 2: Enter Details, 3: Confirmation

  const customUrl = params?.customUrl;

  // Fetch calendar data by custom URL
  const { data: calendar, isLoading, error } = useQuery<CalendarData>({
    queryKey: ["/api/calendars/by-url", customUrl],
    queryFn: async () => {
      const response = await fetch(`/api/calendars/by-url/${customUrl}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Calendar not found');
        }
        throw new Error('Failed to fetch calendar');
      }
      return response.json();
    },
    enabled: !!customUrl,
  });

  // Generate available dates (next 30 days, excluding weekends for demo)
  const generateAvailableDates = () => {
    const dates = [];
    const startDate = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = addDays(startDate, i);
      // Skip weekends for demo purposes
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date);
      }
    }
    return dates;
  };

  // Generate time slots for selected date
  const generateTimeSlots = () => {
    if (!selectedDate) return [];
    
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const duration = calendar?.duration || 30;
    const interval = 30; // 30-minute intervals
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    
    return slots;
  };

  const handleBooking = async () => {
    if (!calendar || !selectedDate || !selectedTime) {
      return;
    }

    try {
      const bookingData = {
        date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD format
        time: selectedTime,
        name: bookingForm.name,
        email: bookingForm.email,
        phone: bookingForm.phone,
        message: bookingForm.message
      };

      const response = await fetch(`/api/calendars/${calendar.customUrl}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }

      const result = await response.json();
      console.log('Booking created successfully:', result);
      setStep(3);
    } catch (error) {
      console.error('Booking error:', error);
      // You could add error handling here, like showing a toast notification
      alert('Failed to create booking. Please try again.');
    }
  };

  if (!match) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !calendar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Calendar Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                The calendar you're looking for doesn't exist or is no longer available.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!calendar.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Calendar Unavailable
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                This calendar is currently not accepting bookings.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div 
              className="w-3 h-3 rounded-full mr-3"
              style={{ backgroundColor: calendar.color }}
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {calendar.name}
            </h1>
          </div>
          {calendar.description && (
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {calendar.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Info Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Meeting Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{calendar.duration} minutes</span>
                </div>
                
                {calendar.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">
                      {calendar.location === 'google_meet' && 'Google Meet'}
                      {calendar.location === 'zoom' && 'Zoom'}
                      {calendar.location === 'custom' && (calendar.locationDetails || 'Custom Location')}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500">
                    Select a time that works for you and we'll send you a confirmation with all the details.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Booking Area */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {step === 1 && "Select a Date & Time"}
                  {step === 2 && "Enter Your Details"}
                  {step === 3 && "Booking Confirmed"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Step 1: Date & Time Selection */}
                {step === 1 && (
                  <div className="space-y-6">
                    {/* Date Selection */}
                    <div>
                      <Label className="text-base font-medium mb-3 block">Choose a Date</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {generateAvailableDates().map((date) => (
                          <Button
                            key={date.toISOString()}
                            variant={selectedDate?.toDateString() === date.toDateString() ? "default" : "outline"}
                            className="h-auto p-3 flex flex-col"
                            onClick={() => setSelectedDate(date)}
                          >
                            <span className="text-xs text-gray-500">
                              {format(date, 'EEE')}
                            </span>
                            <span className="text-sm font-medium">
                              {format(date, 'MMM d')}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Time Selection */}
                    {selectedDate && (
                      <div>
                        <Label className="text-base font-medium mb-3 block">
                          Available Times for {format(selectedDate, 'MMMM d, yyyy')}
                        </Label>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                          {generateTimeSlots().map((time) => (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedTime(time)}
                            >
                              {time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDate && selectedTime && (
                      <div className="flex justify-end pt-4">
                        <Button onClick={() => setStep(2)}>
                          Continue
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Contact Details */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm">
                        <strong>{calendar.name}</strong> on {format(selectedDate!, 'MMMM d, yyyy')} at {selectedTime}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={bookingForm.name}
                          onChange={(e) => setBookingForm(prev => ({...prev, name: e.target.value}))}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={bookingForm.email}
                          onChange={(e) => setBookingForm(prev => ({...prev, email: e.target.value}))}
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={bookingForm.phone}
                        onChange={(e) => setBookingForm(prev => ({...prev, phone: e.target.value}))}
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <Label htmlFor="message">Additional Message (Optional)</Label>
                      <Textarea
                        id="message"
                        value={bookingForm.message}
                        onChange={(e) => setBookingForm(prev => ({...prev, message: e.target.value}))}
                        placeholder="Anything you'd like to mention about this meeting?"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button 
                        onClick={handleBooking}
                        disabled={!bookingForm.name || !bookingForm.email}
                      >
                        Book Meeting
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                      <Calendar className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Meeting Booked Successfully!
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        We've sent a confirmation email to {bookingForm.email}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-left">
                      <h4 className="font-medium mb-2">Meeting Details:</h4>
                      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>Event:</strong> {calendar.name}</p>
                        <p><strong>Date:</strong> {format(selectedDate!, 'MMMM d, yyyy')}</p>
                        <p><strong>Time:</strong> {selectedTime}</p>
                        <p><strong>Duration:</strong> {calendar.duration} minutes</p>
                        <p><strong>Attendee:</strong> {bookingForm.name}</p>
                      </div>
                    </div>

                    <Button onClick={() => {
                      setStep(1);
                      setSelectedDate(null);
                      setSelectedTime("");
                      setBookingForm({name: "", email: "", phone: "", message: ""});
                    }}>
                      Book Another Meeting
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}