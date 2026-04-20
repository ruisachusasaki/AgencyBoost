import { Link } from "wouter";
import { ArrowLeft, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">AgencyBoost</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button size="sm" className="text-white font-semibold" style={{ backgroundColor: "#00C7C4" }}>Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/">
            <span className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </span>
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-10">Last Updated: March 16, 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Media Optimizers, LLC ("Company," "we," "us," or "our") operates the AgencyBoost platform 
                (accessible at agencyboost.app), a customer relationship management and agency operations 
                platform ("Service"). This Privacy Policy explains how we collect, use, disclose, and 
                safeguard your information when you use our Service. By accessing or using AgencyBoost, 
                you agree to the terms of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.1 Information You Provide</h3>
              <p className="text-gray-700 leading-relaxed mb-3">We collect information that you voluntarily provide when using our Service, including:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Account Information:</strong> Name, email address, phone number, company name, job title, and login credentials.</li>
                <li><strong>Client Data:</strong> Information about your clients that you input into the platform, including names, contact details, project information, billing data, and communications.</li>
                <li><strong>Lead Data:</strong> Information about prospective clients including names, contact information, source data, and notes.</li>
                <li><strong>Financial Information:</strong> Quotes, invoices, payment information, and billing details you manage through the platform.</li>
                <li><strong>Communications:</strong> Messages, notes, comments, and any other content you submit through the platform.</li>
                <li><strong>Employment Data:</strong> Information related to staff management, including employee details, contractor information, and HR records you manage through the platform.</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">2.2 Information Collected Automatically</h3>
              <p className="text-gray-700 leading-relaxed mb-3">When you access our Service, we automatically collect certain information, including:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Log Data:</strong> IP address, browser type, operating system, referring URLs, pages viewed, access times, and dates.</li>
                <li><strong>Usage Data:</strong> Features used, actions taken, time spent on pages, and interaction patterns.</li>
                <li><strong>Device Information:</strong> Device type, screen resolution, and unique device identifiers.</li>
                <li><strong>Cookies and Similar Technologies:</strong> We use cookies and similar tracking technologies to maintain sessions, remember preferences, and analyze usage patterns.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">We use the information we collect for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>To provide, operate, and maintain the AgencyBoost platform</li>
                <li>To create and manage your account</li>
                <li>To process transactions and manage billing</li>
                <li>To send administrative communications, including updates, security alerts, and support messages</li>
                <li>To respond to your inquiries, comments, or questions</li>
                <li>To improve and personalize the Service</li>
                <li>To monitor and analyze usage patterns and trends</li>
                <li>To detect, prevent, and address technical issues, fraud, or security breaches</li>
                <li>To comply with legal obligations and enforce our terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-3">We do not sell your personal information. We may share your information in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Service Providers:</strong> We share information with third-party vendors who assist us in operating the platform (e.g., hosting providers, payment processors, email services). These providers are contractually bound to protect your data and use it only for the services they provide to us.</li>
                <li><strong>Within Your Organization:</strong> Information you enter into AgencyBoost may be visible to other authorized users within your organization based on the roles and permissions configured by your administrator.</li>
                <li><strong>Legal Requirements:</strong> We may disclose your information if required by law, subpoena, or other legal process, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</li>
                <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</li>
                <li><strong>With Your Consent:</strong> We may share information for other purposes with your explicit consent.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement commercially reasonable technical and organizational security measures to protect 
                your information against unauthorized access, alteration, disclosure, or destruction. These 
                measures include encryption of data in transit and at rest, access controls, regular security 
                assessments, and secure authentication mechanisms. However, no method of transmission over 
                the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide the 
                Service. We may also retain information as necessary to comply with legal obligations, resolve 
                disputes, and enforce our agreements. When data is no longer needed, we will securely delete 
                or anonymize it. You may request deletion of your account and associated data at any time by 
                contacting us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-3">Depending on your location, you may have certain rights regarding your personal information:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Access:</strong> You may request a copy of the personal information we hold about you.</li>
                <li><strong>Correction:</strong> You may request that we correct inaccurate or incomplete information.</li>
                <li><strong>Deletion:</strong> You may request that we delete your personal information, subject to certain exceptions.</li>
                <li><strong>Data Portability:</strong> You may request a copy of your data in a structured, machine-readable format.</li>
                <li><strong>Opt-Out:</strong> You may opt out of receiving promotional communications by following the unsubscribe instructions in those messages.</li>
                <li><strong>Cookie Preferences:</strong> You can manage cookie preferences through your browser settings.</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                To exercise any of these rights, please contact us at the information provided below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Third-Party Integrations</h2>
              <p className="text-gray-700 leading-relaxed">
                AgencyBoost may integrate with third-party services (e.g., Google Calendar, Slack, Stripe, 
                email providers). When you connect these services, you may be sharing data with those third 
                parties in accordance with their own privacy policies. We encourage you to review the privacy 
                policies of any third-party services you connect. We are not responsible for the data 
                practices of third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                AgencyBoost is not intended for use by individuals under the age of 18. We do not knowingly 
                collect personal information from children. If we learn that we have collected personal 
                information from a child under 18, we will take steps to delete that information promptly. 
                If you believe a child has provided us with personal information, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be stored and processed in the United States or other countries where 
                our service providers maintain facilities. By using the Service, you consent to the transfer 
                of your information to countries that may have different data protection laws than your 
                country of residence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material 
                changes by posting the updated policy on this page and updating the "Last Updated" date. 
                Your continued use of the Service after changes are posted constitutes your acceptance 
                of the revised Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Google API Services User Data Policy Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                AgencyBoost's use and transfer of information received from Google APIs to any other
                app will adhere to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:underline"
                >
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">What Google data we access</h3>
              <p className="text-gray-700 leading-relaxed mb-2">
                When you connect your Google account to AgencyBoost, we request the following scopes:
              </p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 mb-4">
                <li><strong>Google Calendar (read &amp; write):</strong> calendar events, event details (titles, descriptions, times, attendees, locations), and calendar metadata.</li>
                <li><strong>Basic profile (email &amp; name):</strong> used solely to identify your Google account within AgencyBoost.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">How we use Google data</h3>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 mb-4">
                <li>Display your Google Calendar events inside AgencyBoost's calendar views.</li>
                <li>Create, update, and delete events in your Google Calendar when you book or modify appointments in AgencyBoost.</li>
                <li>Check your real-time availability to prevent double-bookings.</li>
                <li>Trigger AgencyBoost workflows based on calendar activity (only when you enable this).</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">Limited Use commitment</h3>
              <p className="text-gray-700 leading-relaxed mb-2">We commit to the following:</p>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 mb-4">
                <li>We do <strong>not</strong> use Google user data for advertising or to build advertising profiles.</li>
                <li>We do <strong>not</strong> sell, rent, or share Google user data with third parties for their own purposes.</li>
                <li>We do <strong>not</strong> allow humans to read your Google data, except: (a) with your explicit prior consent, (b) when necessary for security investigations or to comply with applicable law, or (c) when the data has been aggregated and anonymized.</li>
                <li>We use Google user data <strong>only</strong> to provide and improve user-facing features of AgencyBoost — never for unrelated purposes.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">Storage, retention, and deletion</h3>
              <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-1 mb-4">
                <li>OAuth access and refresh tokens are encrypted at rest in our database.</li>
                <li>Calendar event data is stored only for as long as your Google account remains connected to AgencyBoost.</li>
                <li>You can disconnect your Google Calendar at any time from <em>Settings &rarr; Calendar Settings &rarr; Integrations</em>. Disconnecting revokes our access tokens with Google and removes the cached calendar data from our system.</li>
                <li>You can also revoke AgencyBoost's access directly at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">myaccount.google.com/permissions</a>.</li>
                <li>To request full deletion of all data associated with your account, email <a href="mailto:support@themediaoptimizers.com" className="text-teal-600 hover:underline">support@themediaoptimizers.com</a>.</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2">Security</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Google data is transmitted over TLS, stored in an access-controlled PostgreSQL
                database, and OAuth credentials are encrypted using industry-standard encryption
                before being written to disk.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our 
                data practices, please contact us at:
              </p>
              <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-100">
                <p className="font-semibold text-gray-900">Media Optimizers, LLC</p>
                <p className="text-gray-700 mt-1">Email: support@themediaoptimizers.com</p>
                <p className="text-gray-700">Website: agencyboost.app</p>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "hsl(179, 100%, 39%)" }}>
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-white">AgencyBoost</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/privacy"><span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span></Link>
            <Link href="/terms"><span className="hover:text-white cursor-pointer transition-colors">Terms of Use</span></Link>
            <Link href="/login"><span className="hover:text-white cursor-pointer transition-colors">Login</span></Link>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-gray-800 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Media Optimizers, LLC. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
