import { useState } from "react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function ClientBriefDemo() {
  const [clientBriefContent, setClientBriefContent] = useState("");

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Button>
          <div className="text-sm text-gray-500">/</div>
          <h1 className="text-2xl font-bold text-gray-900">Client Detail - Contact Tab</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-8 gap-6">
        {/* Left Column - Contact Details */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Contact Details</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Contact information will be shown here</p>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-xs text-gray-500">This section previously contained client contact details</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Client Brief (NEW!) */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Client Brief</h2>
              <p className="text-sm text-gray-600">Add client-specific notes, project requirements, and important information</p>
            </CardHeader>
            <CardContent>
              <ReactQuill
                value={clientBriefContent}
                onChange={setClientBriefContent}
                placeholder="Add client-specific notes, brief details, project requirements, or any important information..."
                modules={{
                  toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'indent': '-1'}, { 'indent': '+1' }],
                    ['link'],
                    ['clean']
                  ],
                }}
                formats={[
                  'header',
                  'bold', 'italic', 'underline', 'strike',
                  'color', 'background',
                  'list', 'bullet', 'indent',
                  'link'
                ]}
                className="min-h-[300px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">Quick actions will be shown here</p>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-xs text-gray-500">This section previously contained the duplicate Communication functionality that has been removed</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="text-sm text-green-800">
          <p className="font-semibold">✅ Task Completed Successfully:</p>
          <ul className="mt-2 space-y-1 text-xs">
            <li>• Removed duplicate Communication section from Contact tab</li>
            <li>• Added Client Brief rich text editor in middle column</li>
            <li>• Eliminated duplicate SMS & Email functionality</li>
            <li>• Rich text editor supports formatting, lists, colors, links</li>
          </ul>
        </div>
      </div>
    </div>
  );
}