import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | TARMAC',
  description: 'Terms of Service for TARMAC — FAA Private Pilot exam prep platform.',
}

export default function TermsPage() {
  const updated = 'April 28, 2026'

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

        {/* Critical notices */}
        <div className="rounded-xl border-2 border-red-300 bg-red-50 px-6 py-5 mb-10 space-y-3">
          <p className="font-extrabold text-red-700 text-base uppercase tracking-wide">Read This Before Using TARMAC</p>
          <ul className="list-disc pl-5 space-y-2 text-red-800 text-sm font-medium">
            <li>TARMAC is an <strong>independent study tool</strong>. We are <strong>not affiliated with, endorsed by, or approved by the FAA</strong> or any government agency.</li>
            <li>TARMAC questions are <strong>not official FAA questions</strong>. They are independently created practice questions designed to help you study.</li>
            <li>We make <strong>no guarantee</strong> that you will pass any FAA exam, written test, checkride, or receive any aviation certification.</li>
            <li>TARMAC is currently in <strong>BETA</strong>. Features may be incomplete, inaccurate, or change without notice.</li>
            <li><strong>All sales are final. No refunds under any circumstances.</strong></li>
            <li>By creating an account or making a purchase, you agree to these Terms in full.</li>
          </ul>
        </div>

        <div className="space-y-10 text-[#1e3a6e] leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">1. Acceptance of Terms</h2>
            <p>TARMAC is operated by <strong>Legion Systems LLC</strong> ("Company," "we," "us," "our"). By accessing or using TARMAC (the "Service"), creating an account, starting a free trial, or completing any purchase, you ("User," "you") acknowledge that you have read, understood, and agree to be legally bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to every provision, you must immediately stop using the Service. These Terms apply to all users, including free-tier users, trial users, and paying subscribers. Use of the Service by anyone under the age of 13 is prohibited. Users between 13 and 18 must have parental or guardian consent.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">2. Nature of the Service — Educational Study Tool Only</h2>
            <p>TARMAC is an <strong>independent, self-study educational platform</strong> designed to help student pilots prepare for the FAA Private Pilot Airman Knowledge Test. The Service includes practice questions, simulated exams, AI-assisted explanations, and tutoring features.</p>
            <div className="mt-3 font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
              TARMAC IS NOT a flight school, certified aviation training program, FAA-approved ground school, Part 141 provider, or Part 61 training provider. TARMAC IS NOT affiliated with, endorsed by, sponsored by, or approved by the Federal Aviation Administration (FAA), the Department of Transportation (DOT), or any other government agency or aviation authority. Nothing on this platform constitutes official FAA instructional material or certified ground training.
            </div>
            <p className="mt-3"><strong>TARMAC questions are not official FAA Airman Knowledge Test questions.</strong> They are independently authored practice questions created to help students study the subject matter covered by the FAA Private Pilot Airman Knowledge Test. The actual test questions used on FAA exams are proprietary to the FAA and its authorized testing vendors. We make no claim that our questions are identical to, sourced from, or represent the current official FAA test bank.</p>
            <p className="mt-3">The FAA updates its Airman Certification Standards (ACS) and test bank periodically. TARMAC does not guarantee that its question bank reflects the most current FAA test content at any given time. It is your responsibility to verify that your study materials are current and complete.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">3. Beta Product Disclosure</h2>
            <p>TARMAC is currently provided as a <strong>BETA</strong> product. You acknowledge and agree that:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>The Service may contain errors, bugs, inaccurate content, or incomplete features.</li>
              <li>Features may be modified, removed, or added at any time without notice.</li>
              <li>Downtime, data loss, or service interruptions may occur during the beta period.</li>
              <li>Beta status does not reduce, waive, or otherwise affect your payment obligations or the no-refund policy.</li>
              <li>Pricing during the beta period is promotional and subject to change. Continued use after a price change constitutes acceptance of the new pricing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">4. No Guarantee of Exam Results or Certification</h2>
            <p className="font-bold uppercase tracking-wide text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
              TARMAC MAKES NO GUARANTEE, WARRANTY, PROMISE, OR REPRESENTATION — EXPRESS OR IMPLIED — THAT USE OF THE SERVICE WILL RESULT IN: PASSING THE FAA PRIVATE PILOT AIRMAN KNOWLEDGE TEST OR ANY OTHER FAA EXAMINATION; OBTAINING A STUDENT PILOT CERTIFICATE, PRIVATE PILOT CERTIFICATE, OR ANY OTHER AVIATION CERTIFICATION OR LICENSE; PASSING A CHECKRIDE OR PRACTICAL TEST; OR ACHIEVING ANY SPECIFIC SCORE ON ANY EXAMINATION.
            </p>
            <p className="mt-3">Exam outcomes depend entirely on each individual's effort, preparation, prior knowledge, test-taking ability, health on the day of the exam, and other factors entirely outside our control. Any statistics displayed on our platform (such as average scores or pass rates) reflect aggregate historical data and do not predict, imply, or guarantee your individual result.</p>
            <p className="mt-3">You assume full and sole responsibility for your own exam preparation and performance. A poor exam result, a failing score, a required retake, or failure to obtain certification does not entitle you to a refund, credit, or any other remedy from TARMAC.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">5. AI-Generated Content — Accuracy Disclaimer</h2>
            <p>Portions of the Service — including explanations, tutoring responses, and some practice question content — are generated or assisted by artificial intelligence (AI) systems. <strong>AI-generated content may contain errors, inaccuracies, outdated information, hallucinations, fabrications, or omissions.</strong> TARMAC does not guarantee the accuracy, completeness, or currency of any AI-generated content.</p>
            <p className="mt-3">You must always verify critical aviation information against official, authoritative FAA publications, including but not limited to: the FAR/AIM, Pilot's Handbook of Aeronautical Knowledge (PHAK), Airplane Flying Handbook (AFH), Airman Certification Standards (ACS), and applicable Advisory Circulars.</p>
            <p className="mt-3 font-semibold">TARMAC AI content is for study purposes only. Never use TARMAC content, AI explanations, or any other part of this Service to make real-world flight planning or operational decisions. Doing so could be dangerous. TARMAC accepts no liability for any outcome resulting from reliance on AI-generated content for operational, flight planning, or real-world aviation purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">6. Free Trial</h2>
            <p>TARMAC may offer a free trial period for new subscribers ("Free Trial"). By starting a Free Trial, you agree to the following:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>You must provide a valid payment method to start a Free Trial. Your payment method will be charged at the standard subscription rate when the Free Trial ends, unless you cancel before the trial period expires.</li>
              <li>Free Trials are available to new customers only — one per person and one per household. You may not start a new Free Trial if you have previously had a Free Trial under any account or email address.</li>
              <li>Creating multiple accounts to obtain additional Free Trials is prohibited and constitutes fraud. We reserve the right to immediately terminate any such account without refund and to seek damages.</li>
              <li>If you cancel during a Free Trial, your access ends at the conclusion of the trial period. The no-refund policy applies if you do not cancel before the trial ends and are subsequently charged.</li>
              <li>We reserve the right to modify or discontinue the Free Trial offer at any time without notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">7. Subscriptions and Billing</h2>
            <p>TARMAC offers a paid Tarmac Membership subscription billed on a recurring monthly basis. By subscribing, you authorize TARMAC (via its payment processor, Stripe) to charge your payment method automatically at the start of each billing period until you cancel.</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Subscriptions automatically renew each billing period unless cancelled before the renewal date.</li>
              <li>You may cancel at any time through the billing portal in your account settings. Cancellation takes effect at the end of the current paid period — you retain access until that date.</li>
              <li>Prices are listed in USD and are subject to change. We will provide reasonable notice of price changes. Continued use after a price change constitutes acceptance.</li>
              <li>Promotional or discounted pricing (including promotional codes) applies only to the period specified at the time of purchase and does not carry forward to renewals unless explicitly stated.</li>
              <li>You are responsible for keeping your payment information accurate and up to date. Failed payments may result in immediate loss of access.</li>
              <li>All subscription fees are exclusive of any taxes, levies, or duties. You are solely responsible for all applicable taxes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">8. No Refund Policy</h2>
            <div className="font-bold text-red-700 bg-red-50 border-2 border-red-300 rounded-lg px-4 py-4 text-sm uppercase tracking-wide">
              All payments to TARMAC are final and non-refundable. No exceptions.
            </div>
            <p className="mt-3">TARMAC does not issue refunds, credits, partial refunds, or pro-rated charges for any reason, including but not limited to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Failure to pass any FAA examination, written test, checkride, or failure to obtain any aviation certification</li>
              <li>Dissatisfaction with the content, questions, AI explanations, features, or overall quality of the Service</li>
              <li>Partial use of a subscription period or failure to use the Service during a paid period</li>
              <li>Accidental purchases, forgotten cancellations, or automatic subscription renewals</li>
              <li>Technical issues, downtime, outages, bugs, or service interruptions experienced during your subscription</li>
              <li>Account suspension or termination for violations of these Terms</li>
              <li>Changes to features, pricing, content, or availability of the Service</li>
              <li>Beta status of the product or any incomplete, inaccurate, or missing features</li>
              <li>Inaccuracies in questions or explanations, including AI-generated content</li>
              <li>Questions or content not reflecting the most current FAA test bank or ACS</li>
              <li>Your failure to cancel before the end of a Free Trial period</li>
            </ul>
            <p className="mt-3">If you believe a charge occurred due to a verified technical error on our end (not user error), you may contact us at <a href="mailto:support@tarmac.study" className="text-[#3E92CC] underline">support@tarmac.study</a> within 7 days of the charge with supporting documentation. We will investigate at our sole discretion. Contacting us does not guarantee any remedy.</p>
            <p className="mt-3 font-semibold">By completing a purchase or allowing a Free Trial to convert, you expressly acknowledge and agree to this no-refund policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">9. Chargebacks and Disputes</h2>
            <p>You agree not to initiate a chargeback or payment dispute with your bank or credit card issuer for any charge that is consistent with these Terms. Initiating a chargeback for a valid charge constitutes a material breach of these Terms and may result in:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Immediate permanent termination of your account without notice</li>
              <li>Being banned from creating future accounts</li>
              <li>TARMAC pursuing recovery of the disputed amount plus any chargeback fees incurred</li>
            </ul>
            <p className="mt-3">If you have a billing concern, you must contact us first at <a href="mailto:support@tarmac.study" className="text-[#3E92CC] underline">support@tarmac.study</a> before initiating any payment dispute.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">10. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Share account credentials or allow any other person to access your account</li>
              <li>Create multiple accounts to circumvent access restrictions, obtain additional Free Trials, or abuse promotional offers</li>
              <li>Scrape, copy, reproduce, redistribute, publish, sell, or resell any content from the Service, including questions, explanations, or any part of the platform</li>
              <li>Attempt to reverse-engineer, decompile, or circumvent any security or access restriction of the Service</li>
              <li>Use the Service for any unlawful purpose or in violation of any applicable law or regulation</li>
              <li>Impersonate another person or misrepresent your identity or affiliation</li>
              <li>Submit false, misleading, abusive, or harmful content through any input feature of the Service</li>
              <li>Use the Service to develop competing products or services</li>
            </ul>
            <p className="mt-3">We reserve the right to terminate access to any user who violates these provisions, without refund.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">11. Intellectual Property</h2>
            <p>All content on TARMAC — including questions, explanations, UI design, branding, logos, and underlying code — is owned by or licensed to Legion Systems LLC and protected by applicable intellectual property laws. You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your own personal, non-commercial study purposes only. No other rights are granted. Any unauthorized use of TARMAC content will constitute infringement of our intellectual property rights.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">12. Communications and Email</h2>
            <p>By creating an account, you consent to receive transactional emails related to your account (such as exam results, billing notices, and account alerts). You may also receive occasional product-related emails. You may opt out of non-transactional emails at any time by following the unsubscribe link in any such email or contacting us directly. You may not opt out of emails that are required for the operation of your account (such as billing notices).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">13. Disclaimer of Warranties</h2>
            <p className="font-semibold uppercase tracking-wide text-sm">THE SERVICE IS PROVIDED STRICTLY "AS IS" AND "AS AVAILABLE," WITHOUT ANY WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, LEGION SYSTEMS LLC EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO: IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, COMPLETENESS, CURRENTNESS, AND NON-INFRINGEMENT. TARMAC DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. TARMAC DOES NOT WARRANT THAT ITS QUESTIONS REFLECT CURRENT FAA TEST CONTENT OR THAT USE OF THE SERVICE WILL PREPARE YOU ADEQUATELY FOR ANY EXAMINATION.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">14. Limitation of Liability</h2>
            <p className="font-semibold uppercase tracking-wide text-sm">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LEGION SYSTEMS LLC AND ITS OWNERS, OPERATORS, EMPLOYEES, CONTRACTORS, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES OF ANY KIND, INCLUDING BUT NOT LIMITED TO:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2 font-semibold text-sm uppercase">
              <li>Failure to pass any aviation examination, written test, checkride, or obtain any certification or license</li>
              <li>Cost of FAA exam retakes or any associated fees</li>
              <li>Loss of revenue, profit, data, business opportunity, or employment</li>
              <li>Reliance on AI-generated content that is inaccurate, incomplete, or outdated</li>
              <li>Reliance on any question, explanation, or content that is inaccurate or not reflective of current FAA standards</li>
              <li>Service interruptions, outages, bugs, or data loss</li>
              <li>Any outcome resulting from use or inability to use the Service</li>
              <li>Any flight-related incident, accident, injury, or death arising from reliance on content obtained through this Service</li>
            </ul>
            <p className="mt-4 font-bold">In no event shall TARMAC's total cumulative liability to you for any and all claims exceed the lesser of: (a) the total amount you paid to TARMAC in the 30 days immediately preceding the event giving rise to the claim, or (b) $10.00 (ten U.S. dollars).</p>
            <p className="mt-3">These limitations apply even if TARMAC has been advised of the possibility of such damages and even if any remedy fails of its essential purpose. Some jurisdictions do not allow exclusion of certain warranties or limitations of liability — in such jurisdictions, our liability is limited to the maximum extent permitted by law.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">15. Indemnification</h2>
            <p>You agree to defend, indemnify, and hold harmless Legion Systems LLC and its owners, officers, employees, contractors, and agents from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of or inability to use the Service; (b) your violation of these Terms; (c) your violation of any third-party rights; (d) any content you submit to the Service; or (e) your use of information obtained from the Service to make aviation decisions.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">16. Account Termination</h2>
            <p>TARMAC reserves the right to suspend or permanently terminate your account at any time, with or without notice, for any reason, including violations of these Terms, suspected fraud, trial abuse, chargeback initiation, or at our sole discretion. Upon termination, your right to access the Service immediately ceases. No refund will be issued upon termination for any reason, including termination for cause.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">17. Force Majeure</h2>
            <p>TARMAC shall not be liable for any failure or delay in performance resulting from causes beyond our reasonable control, including but not limited to: acts of God, natural disasters, pandemics, internet or infrastructure outages, third-party service failures (including Stripe, Supabase, or Vercel), government actions, cyberattacks, or other events outside our control. In such events, your payment obligations remain unaffected.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">18. Dispute Resolution and Arbitration</h2>
            <p>Any dispute, claim, or controversy arising out of or relating to these Terms or your use of TARMAC shall be resolved exclusively through binding individual arbitration, not in court. <strong>You waive any right to a jury trial and any right to participate in a class action lawsuit, class-wide arbitration, or representative action.</strong></p>
            <p className="mt-3">Arbitration shall be conducted on an individual basis under rules of a nationally recognized arbitration forum, at a location mutually agreed upon or conducted remotely. You and TARMAC each waive the right to bring or participate in any class, collective, consolidated, or representative proceeding.</p>
            <p className="mt-3">Before initiating arbitration, you must first send written notice of your dispute to <a href="mailto:support@tarmac.study" className="text-[#3E92CC] underline">support@tarmac.study</a> and allow 30 days for informal resolution. If the dispute involves a claim of $500 or less, either party may choose to resolve it in small claims court instead of arbitration.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">19. Governing Law</h2>
            <p>These Terms are governed by and construed in accordance with the laws of the United States and the state in which Legion Systems LLC is registered, without regard to conflict of law principles. To the extent any court action is permitted despite the arbitration clause above, you consent to the exclusive jurisdiction and venue of state or federal courts located in the state where Legion Systems LLC operates.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">20. Severability</h2>
            <p>If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court or arbitrator of competent jurisdiction, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it enforceable while preserving the original intent.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">21. Entire Agreement</h2>
            <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and TARMAC with respect to the Service and supersede all prior or contemporaneous agreements, understandings, representations, or communications, whether written or oral.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">22. Changes to These Terms</h2>
            <p>TARMAC reserves the right to modify these Terms at any time. We will update the "Last updated" date at the top of this page. For material changes, we will make reasonable efforts to notify you (such as via email or an in-app notice). Your continued use of the Service after any modification constitutes your acceptance of the revised Terms. It is your responsibility to review these Terms periodically. If you do not agree to the revised Terms, you must stop using the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">23. Contact</h2>
            <p>Questions about these Terms may be directed to: <a href="mailto:support@tarmac.study" className="text-[#3E92CC] underline">support@tarmac.study</a></p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-[#0A2463]/10 flex flex-col md:flex-row gap-4 justify-between items-center text-sm text-[#0A2463]/50">
          <span>© {new Date().getFullYear()} Legion Systems LLC. TARMAC is not affiliated with the FAA.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#0A2463] transition-colors">Privacy Policy</Link>
            <Link href="/" className="hover:text-[#0A2463] transition-colors">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
