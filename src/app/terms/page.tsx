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
      <nav className="sticky top-0 z-50 bg-white border-b border-[#0A2463]/08 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-[#0A2463] text-lg">TARMAC</Link>
          <Link href="/login" className="text-sm text-[#0A2463]/60 hover:text-[#0A2463]">Sign In →</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold text-[#0A2463] mb-2">Terms of Service</h1>
        <p className="text-[#0A2463]/50 text-sm mb-8">Last updated: {updated}</p>

        {/* Critical notices up front */}
        <div className="rounded-xl border-2 border-red-300 bg-red-50 px-6 py-5 mb-10 space-y-3">
          <p className="font-extrabold text-red-700 text-base uppercase tracking-wide">Please Read Before Using TARMAC</p>
          <ul className="list-disc pl-5 space-y-2 text-red-800 text-sm font-medium">
            <li>TARMAC is an independent study tool. We are <strong>not affiliated with, endorsed by, or approved by the FAA</strong>.</li>
            <li>We make <strong>no guarantee</strong> that you will pass any FAA exam or receive any aviation certification.</li>
            <li><strong>All sales are final. We do not issue refunds under any circumstances.</strong></li>
            <li>By creating an account or making a purchase, you agree to be bound by these Terms in full.</li>
          </ul>
        </div>

        <div className="space-y-10 text-[#1e3a6e] leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using TARMAC (the "Service," "we," "us," "our"), creating an account, or completing a purchase, you acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service ("Terms"). If you do not agree to every provision of these Terms, you must immediately stop using the Service. These Terms apply to all users, including free-tier users and paying subscribers.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">2. Nature of the Service — Educational Tool Only</h2>
            <p>TARMAC is an <strong>independent, self-study educational platform</strong> that helps student pilots prepare for the FAA Private Pilot Written Knowledge Test. The Service includes practice questions, simulated exams, and AI-assisted explanations and tutoring.</p>
            <div className="mt-3 font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
              TARMAC is NOT a flight school, certified aviation training program, FAA-approved ground school, or Part 141 or Part 61 training provider. TARMAC is NOT affiliated with, endorsed by, sponsored by, or approved by the Federal Aviation Administration (FAA), the Department of Transportation (DOT), or any other government agency or aviation authority. Nothing on this platform constitutes official FAA instructional material.
            </div>
            <p className="mt-3">TARMAC is currently offered as a <strong>BETA</strong> product. Features may be incomplete, unavailable, or changed without notice. Beta status does not affect your payment obligations or the no-refund policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">3. No Guarantee of Exam Results or Certification</h2>
            <p className="font-bold uppercase tracking-wide text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
              TARMAC MAKES NO GUARANTEE, WARRANTY, PROMISE, OR REPRESENTATION — EXPRESS OR IMPLIED — THAT USE OF THE SERVICE WILL RESULT IN: PASSING THE FAA PRIVATE PILOT WRITTEN KNOWLEDGE TEST OR ANY OTHER FAA EXAMINATION; OBTAINING A STUDENT PILOT CERTIFICATE, PRIVATE PILOT CERTIFICATE, OR ANY OTHER AVIATION CERTIFICATION OR LICENSE; OR PASSING A CHECKRIDE OR PRACTICAL TEST.
            </p>
            <p className="mt-3">Exam outcomes depend entirely on each individual's effort, preparation, prior knowledge, test-taking ability, and performance on the day of the exam. Any statistics displayed on our platform (such as average scores or pass rates) reflect aggregate historical data and do not predict or guarantee your individual result.</p>
            <p className="mt-3">You assume full and sole responsibility for your own exam preparation, your performance on any FAA examination, and any decisions — financial or otherwise — you make in reliance on your use of TARMAC. A poor exam result does not entitle you to a refund or any other remedy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">4. AI-Generated Content — Accuracy Disclaimer</h2>
            <p>Portions of the Service — including explanations, tutoring responses, and some practice questions — are generated or assisted by artificial intelligence (AI). <strong>AI-generated content may contain errors, inaccuracies, outdated information, hallucinations, or omissions.</strong></p>
            <p className="mt-3">You must always verify critical aviation information against official, authoritative FAA publications, including but not limited to: the FAR/AIM, Pilot's Handbook of Aeronautical Knowledge (PHAK), Airplane Flying Handbook (AFH), Airman Certification Standards (ACS), and Advisory Circulars.</p>
            <p className="mt-3 font-semibold">TARMAC AI content is for study purposes only. Never use TARMAC explanations to make real-world flight decisions. Doing so would be dangerous and irresponsible. TARMAC accepts no liability for any outcome resulting from reliance on AI-generated content for operational purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">5. Subscriptions and Billing</h2>
            <p>TARMAC offers a free tier with limited access and a paid "Study Pass" subscription billed on a recurring monthly basis. By subscribing, you authorize TARMAC (via its payment processor, Stripe) to charge your payment method automatically at the start of each billing period until you cancel.</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Subscriptions automatically renew each billing period unless cancelled before the renewal date.</li>
              <li>You may cancel at any time through the billing portal in your account settings. Cancellation takes effect at the end of the current paid period — you retain full access until that date.</li>
              <li>Prices are listed in USD and are subject to change with reasonable advance notice.</li>
              <li>Promotional or discounted pricing applies only to the period specified at the time of purchase.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">6. No Refund Policy</h2>
            <div className="font-bold text-red-700 bg-red-50 border-2 border-red-300 rounded-lg px-4 py-4 text-sm uppercase tracking-wide">
              All payments to TARMAC are final and non-refundable. No exceptions.
            </div>
            <p className="mt-3">TARMAC does not issue refunds, credits, partial refunds, or pro-rated charges for any reason, including but not limited to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Failure to pass any FAA examination or obtain any aviation certification</li>
              <li>Dissatisfaction with the content, features, AI explanations, or overall quality of the Service</li>
              <li>Partial use of a subscription period or failure to use the Service during a paid period</li>
              <li>Accidental purchases, forgotten cancellations, or automatic renewals</li>
              <li>Technical issues, downtime, or bugs experienced during your subscription</li>
              <li>Account suspension or termination for violations of these Terms</li>
              <li>Changes to features, pricing, or availability of the Service</li>
              <li>Beta status of the product or any incomplete features</li>
            </ul>
            <p className="mt-3">If you believe a charge occurred due to a verified technical error on our end (not user error), you may contact us at <a href="mailto:mewing713@gmail.com" className="text-[#3E92CC] underline">mewing713@gmail.com</a> within 7 days of the charge with documentation. We will investigate at our sole discretion. Contacting us does not guarantee any remedy.</p>
            <p className="mt-3 font-semibold">By completing a purchase, you expressly acknowledge and agree to this no-refund policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">7. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Share account credentials or allow any other person to access your account</li>
              <li>Scrape, copy, reproduce, redistribute, or resell any content from the Service, including the question bank, explanations, or any part of the platform</li>
              <li>Attempt to reverse-engineer, decompile, or circumvent any security or access restriction of the Service</li>
              <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation</li>
              <li>Impersonate another person or misrepresent your identity or affiliation</li>
              <li>Submit false, misleading, or harmful content through any input feature of the Service</li>
            </ul>
            <p className="mt-3">We reserve the right to terminate access to any user who violates these provisions, without refund.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">8. Intellectual Property</h2>
            <p>All content on TARMAC — including questions, explanations, UI design, branding, logos, and underlying code — is owned by or licensed to TARMAC and protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your own personal, non-commercial study purposes only. No other rights are granted.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">9. Disclaimer of Warranties</h2>
            <p className="font-semibold uppercase tracking-wide text-sm">THE SERVICE IS PROVIDED STRICTLY "AS IS" AND "AS AVAILABLE," WITHOUT ANY WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, TARMAC EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO: IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, COMPLETENESS, AND NON-INFRINGEMENT. TARMAC DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">10. Limitation of Liability</h2>
            <p className="font-semibold uppercase tracking-wide text-sm">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, TARMAC AND ITS OWNERS, OPERATORS, EMPLOYEES, CONTRACTORS, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES OF ANY KIND, INCLUDING BUT NOT LIMITED TO:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2 font-semibold text-sm uppercase">
              <li>Failure to pass any aviation examination or obtain any certification or license</li>
              <li>Loss of revenue, profit, data, or opportunity</li>
              <li>Reliance on AI-generated content that is inaccurate or incomplete</li>
              <li>Service interruptions, outages, bugs, or data loss</li>
              <li>Any outcome resulting from use or inability to use the Service</li>
            </ul>
            <p className="mt-4 font-bold">In no event shall TARMAC's total cumulative liability to you for any and all claims exceed the lesser of: (a) the total amount you paid to TARMAC in the 30 days immediately preceding the event giving rise to the claim, or (b) $10.00 (ten U.S. dollars).</p>
            <p className="mt-3">These limitations apply even if TARMAC has been advised of the possibility of such damages and even if any remedy fails of its essential purpose.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">11. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold harmless TARMAC and its owners, officers, employees, contractors, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) any content you submit to the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">12. Account Termination</h2>
            <p>TARMAC reserves the right to suspend or permanently terminate your account at any time, with or without notice, for any reason, including violations of these Terms, suspected fraud, or at our sole discretion. Upon termination, your right to access the Service immediately ceases. No refund will be issued upon termination for any reason, including termination for cause.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">13. Dispute Resolution and Arbitration</h2>
            <p>Any dispute, claim, or controversy arising out of or relating to these Terms or your use of TARMAC shall be resolved exclusively through binding individual arbitration, not in court. <strong>You waive any right to a jury trial and any right to participate in a class action lawsuit, class-wide arbitration, or representative action.</strong></p>
            <p className="mt-3">Arbitration shall be conducted on an individual basis. You and TARMAC each waive the right to bring or participate in any class, collective, consolidated, or representative proceeding.</p>
            <p className="mt-3">Before initiating arbitration, you must first send written notice of your dispute to <a href="mailto:mewing713@gmail.com" className="text-[#3E92CC] underline">mewing713@gmail.com</a> and allow 30 days for informal resolution.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">14. Governing Law</h2>
            <p>These Terms are governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles. To the extent any court action is permitted, you consent to the exclusive jurisdiction of courts located in the United States.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">15. Severability</h2>
            <p>If any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it enforceable.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">16. Entire Agreement</h2>
            <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and TARMAC with respect to the Service and supersede all prior or contemporaneous agreements, understandings, or representations.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">17. Changes to These Terms</h2>
            <p>TARMAC reserves the right to modify these Terms at any time. We will update the "Last updated" date at the top of this page. Your continued use of the Service after any modification constitutes your acceptance of the revised Terms. It is your responsibility to review these Terms periodically.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">18. Contact</h2>
            <p>Questions about these Terms may be directed to: <a href="mailto:mewing713@gmail.com" className="text-[#3E92CC] underline">mewing713@gmail.com</a></p>
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
