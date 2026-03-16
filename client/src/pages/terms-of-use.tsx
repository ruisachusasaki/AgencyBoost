import { Link } from "wouter";
import { ArrowLeft, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfUsePage() {
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
              <Link href="/privacy">
                <span className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer hidden sm:inline">Privacy</span>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">Login</Button>
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

          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Use</h1>
          <p className="text-gray-500 mb-10">Last Updated: March 16, 2026</p>

          <div className="prose prose-gray max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Use ("Terms") constitute a legally binding agreement between you ("User," 
                "you," or "your") and Media Optimizers, LLC ("Company," "we," "us," or "our"), governing 
                your access to and use of the AgencyBoost platform (accessible at agencyboost.app), 
                including all associated services, features, and content (collectively, the "Service"). 
                By creating an account, accessing, or using the Service, you acknowledge that you have 
                read, understood, and agree to be bound by these Terms and our Privacy Policy. If you 
                do not agree to these Terms, you must not access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed">
                AgencyBoost is a cloud-based customer relationship management (CRM) and agency operations 
                platform designed for marketing agencies. The Service provides tools for client management, 
                lead tracking, sales pipeline management, task automation, time tracking, calendar scheduling, 
                reporting, team management, workflow automation, knowledge base management, training, 
                ticketing, and other operational functions. We reserve the right to modify, update, or 
                discontinue any feature or aspect of the Service at any time without prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Account Registration and Security</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You must provide accurate, current, and complete information during registration and keep your account information updated.</li>
                <li>You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</li>
                <li>You must notify us immediately of any unauthorized access to or use of your account.</li>
                <li>You may not share your account credentials with unauthorized individuals or allow others to access the Service through your account without proper authorization.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms or that we reasonably believe have been compromised.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Permitted Use</h2>
              <p className="text-gray-700 leading-relaxed mb-3">You agree to use the Service only for lawful purposes and in accordance with these Terms. You may not:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Use the Service in any way that violates any applicable federal, state, local, or international law or regulation</li>
                <li>Use the Service to store, transmit, or distribute any malware, viruses, or harmful code</li>
                <li>Attempt to gain unauthorized access to any part of the Service, other users' accounts, or any systems or networks connected to the Service</li>
                <li>Use the Service to send unsolicited communications, spam, or engage in any form of harassment</li>
                <li>Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code of the Service</li>
                <li>Reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service without our express written permission</li>
                <li>Use any automated system, including bots, scrapers, or data mining tools, to access the Service</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
                <li>Impersonate any person or entity, or falsely state or misrepresent your affiliation with any person or entity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. User Data and Content</h2>
              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">5.1 Your Data</h3>
              <p className="text-gray-700 leading-relaxed">
                You retain all ownership rights to the data and content you input into the Service ("User Data"). 
                By using the Service, you grant us a limited, non-exclusive license to use, store, process, and 
                display your User Data solely for the purpose of providing and improving the Service.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">5.2 Data Responsibility</h3>
              <p className="text-gray-700 leading-relaxed">
                You are solely responsible for the accuracy, quality, legality, and appropriateness of all 
                User Data. You represent and warrant that you have all necessary rights and consents to 
                input data into the Service, including any personal information of your clients, leads, 
                employees, or contractors.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">5.3 Data Backup</h3>
              <p className="text-gray-700 leading-relaxed">
                While we implement reasonable measures to protect your data, you are responsible for 
                maintaining your own backups of User Data. We are not liable for any loss or corruption 
                of User Data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                The Service and its original content, features, and functionality are and will remain the 
                exclusive property of Media Optimizers, LLC. The Service is protected by copyright, trademark, 
                trade secret, and other intellectual property laws. The AgencyBoost name, logo, and all 
                related names, logos, product and service names, designs, and slogans are trademarks of 
                Media Optimizers, LLC. You may not use these marks without our prior written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Third-Party Integrations</h2>
              <p className="text-gray-700 leading-relaxed">
                The Service may allow you to connect with third-party services and applications. Your use 
                of any third-party integration is subject to that third party's terms of service and privacy 
                policy. We do not endorse, control, or assume responsibility for any third-party services. 
                You acknowledge that connecting third-party services may involve sharing data with those 
                services in accordance with their respective policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Payment and Billing</h2>
              <p className="text-gray-700 leading-relaxed">
                If the Service includes paid features or subscription plans, you agree to pay all applicable 
                fees as described at the time of purchase. All payments are non-refundable except as required 
                by law or as explicitly stated in a separate written agreement. We reserve the right to 
                change our pricing at any time, with reasonable notice provided to existing subscribers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Service Availability and Modifications</h2>
              <p className="text-gray-700 leading-relaxed">
                We strive to ensure the Service is available at all times but do not guarantee uninterrupted 
                access. The Service may be temporarily unavailable due to maintenance, updates, or 
                circumstances beyond our control. We reserve the right to modify, suspend, or discontinue 
                any part of the Service at any time, with or without notice, and without liability to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Disclaimer of Warranties</h2>
              <p className="text-gray-700 leading-relaxed uppercase font-medium">
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY 
                KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT 
                WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, THAT DEFECTS WILL 
                BE CORRECTED, OR THAT THE SERVICE IS FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BOOST MODE MEDIA LLC AND ITS OFFICERS, 
                DIRECTORS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, 
                DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR 
                USE OF OR INABILITY TO USE THE SERVICE, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING 
                NEGLIGENCE), OR ANY OTHER LEGAL THEORY. IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED 
                THE AMOUNTS PAID BY YOU TO US IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO 
                THE CLAIM.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify, defend, and hold harmless Media Optimizers, LLC, its officers, 
                directors, employees, agents, and affiliates from and against any and all claims, damages, 
                losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out 
                of or related to your use of the Service, your violation of these Terms, your violation of 
                any rights of another party, or your User Data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Termination</h2>
              <p className="text-gray-700 leading-relaxed">
                We may terminate or suspend your access to the Service immediately, without prior notice or 
                liability, for any reason, including if you breach these Terms. Upon termination, your right 
                to use the Service will immediately cease. You may terminate your account at any time by 
                contacting us. All provisions of these Terms that by their nature should survive termination 
                shall survive, including ownership provisions, warranty disclaimers, indemnification, and 
                limitations of liability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">14. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of 
                Florida, United States, without regard to its conflict of law principles. Any disputes 
                arising out of or relating to these Terms or the Service shall be resolved exclusively in 
                the state or federal courts located in the State of Florida. You consent to the personal 
                jurisdiction of such courts and waive any objection to venue in such courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">15. Changes to These Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to update or modify these Terms at any time. We will notify you of 
                material changes by posting the updated Terms on this page and updating the "Last Updated" 
                date. Your continued use of the Service after any changes are posted constitutes your 
                acceptance of the revised Terms. We encourage you to review these Terms periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">16. Severability</h2>
              <p className="text-gray-700 leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid by a court of 
                competent jurisdiction, that provision shall be limited or eliminated to the minimum extent 
                necessary, and the remaining provisions of these Terms shall remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">17. Entire Agreement</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms, together with our Privacy Policy and any other legal notices or agreements 
                published by us on the Service, constitute the entire agreement between you and Boost Mode 
                Media LLC regarding your use of the Service and supersede all prior agreements and 
                understandings, whether written or oral.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">18. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-6 bg-gray-50 rounded-lg border border-gray-100">
                <p className="font-semibold text-gray-900">Media Optimizers, LLC</p>
                <p className="text-gray-700 mt-1">Email: joe@boostmode.com</p>
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
