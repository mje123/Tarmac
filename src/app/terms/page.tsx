import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | TARMAC',
  description: 'Terms of Service for TARMAC — FAA Private Pilot exam prep platform.',
}

export default function TermsPage() {
  const updated = 'April 18, 2026'

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-[#0A2463]/08 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-[#0A2463] text-lg">TARMAC</Link>
          <Link href="/login" className="text-sm text-[#0A2463]/60 hover:text-[#0A2463]">Sign In →</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold text-[#0A2463] mb-2">Terms of Service</h1>
        <p className="text-[#0A2463]/50 text-sm mb-12">Last updated: {updated}</p>

        <div className="space-y-10 text-[#1e3a6e] leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or accessing TARMAC ("the Service," "we," "us"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These Terms apply to all users, including free trial users and paying subscribers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">2. Description of Service</h2>
            <p>TARMAC is an independent, AI-powered educational platform designed to help student pilots prepare for the FAA Private Pilot Written Knowledge Test. The Service includes practice questions, simulated exams, and AI-generated explanations and tutoring.</p>
            <p className="mt-3 font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              TARMAC is NOT affiliated with, endorsed by, or approved by the Federal Aviation Administration (FAA) or any other government agency. We make no representation that our content is official FAA material.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">3. No Guarantee of Results</h2>
            <p>
              <strong>TARMAC makes no guarantee, warranty, or representation that use of the Service will result in passing the FAA Private Pilot Written Knowledge Test, obtaining a student pilot certificate, passing a checkride, or achieving any other aviation certification or licensure.</strong>
            </p>
            <p className="mt-3">Exam outcomes depend entirely on the user's individual effort, preparation, knowledge, and performance. Historical pass rates, average scores displayed on the platform, or marketing language such as "ace your test" are illustrative and aspirational — they are not guarantees of individual performance.</p>
            <p className="mt-3">You assume full responsibility for your own exam preparation and for any decisions you make based on your use of TARMAC.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">4. AI-Generated Content Disclaimer</h2>
            <p>Portions of the Service, including explanations, tutoring responses, and practice questions, are generated or assisted by artificial intelligence. <strong>AI-generated content may contain errors, inaccuracies, outdated information, or omissions.</strong> You should always verify critical aviation information against official FAA publications, including the FAR/AIM, Pilot's Handbook of Aeronautical Knowledge (PHAK), Airman Certification Standards (ACS), and other authoritative sources.</p>
            <p className="mt-3">Never rely solely on TARMAC for operational flight decisions. AI tutoring is for study purposes only.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">5. Subscriptions and Billing</h2>
            <p>TARMAC offers a free tier with limited access and a paid "Study Pass" subscription billed monthly. By subscribing, you authorize us to charge your payment method on a recurring basis until you cancel.</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Subscriptions automatically renew each billing period unless cancelled before the renewal date.</li>
              <li>You may cancel at any time through the billing portal in your account settings. Cancellation takes effect at the end of the current paid period — you retain access until then.</li>
              <li>Prices are subject to change with reasonable notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">6. No Refund Policy</h2>
            <p className="font-semibold">All payments for TARMAC subscriptions are final and non-refundable.</p>
            <p className="mt-3">We do not offer refunds, credits, or pro-rated charges for:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Partial months of service</li>
              <li>Periods where you did not use the Service</li>
              <li>Failure to pass an FAA exam or any other dissatisfaction with exam results</li>
              <li>Accidental purchases or renewals you forgot to cancel</li>
              <li>Account terminations due to violations of these Terms</li>
            </ul>
            <p className="mt-3">If you believe you were charged in error due to a technical fault on our end, contact us at <a href="mailto:mewing713@gmail.com" className="text-[#3E92CC] underline">mewing713@gmail.com</a> within 7 days of the charge and we will investigate.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Share your account credentials or allow others to access your account</li>
              <li>Scrape, copy, or redistribute our question bank, explanations, or any platform content</li>
              <li>Attempt to reverse-engineer, decompile, or circumvent any part of the Service</li>
              <li>Use the Service in any way that violates applicable law</li>
              <li>Impersonate another person or misrepresent your identity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">8. Intellectual Property</h2>
            <p>All content on TARMAC — including but not limited to questions, explanations, UI design, branding, and code — is owned by or licensed to TARMAC and protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial study purposes only.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">9. Disclaimers and Limitation of Liability</h2>
            <p className="font-semibold">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
            <p className="mt-3">To the maximum extent permitted by law, TARMAC and its owners, employees, and affiliates shall not be liable for:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of data, revenue, or profit</li>
              <li>Failure to pass any aviation examination or obtain any certification</li>
              <li>Reliance on AI-generated content that proves to be inaccurate</li>
              <li>Service interruptions, bugs, or data loss</li>
            </ul>
            <p className="mt-3">In no event shall our total liability to you exceed the amount you paid to TARMAC in the 30 days prior to the event giving rise to the claim, or $50, whichever is less.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">10. Indemnification</h2>
            <p>You agree to indemnify and hold harmless TARMAC and its owners, officers, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">11. Account Termination</h2>
            <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for violations of these Terms or for any other reason at our sole discretion. Upon termination, your right to access the Service ceases immediately. No refund will be issued upon termination for cause.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">12. Changes to These Terms</h2>
            <p>We may update these Terms from time to time. We will notify you of material changes by updating the "Last updated" date. Continued use of the Service after changes constitutes your acceptance of the revised Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">13. Governing Law</h2>
            <p>These Terms are governed by the laws of the United States. Any disputes arising under these Terms shall be resolved through binding individual arbitration, and you waive any right to participate in a class action lawsuit or class-wide arbitration.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">14. Contact</h2>
            <p>Questions about these Terms? Contact us at <a href="mailto:mewing713@gmail.com" className="text-[#3E92CC] underline">mewing713@gmail.com</a>.</p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-[#0A2463]/10 flex flex-col md:flex-row gap-4 justify-between items-center text-sm text-[#0A2463]/50">
          <span>© {new Date().getFullYear()} TARMAC. Not affiliated with the FAA.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#0A2463] transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-[#0A2463] transition-colors">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
