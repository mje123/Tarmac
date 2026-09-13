import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How TARMAC collects, uses, and protects your information while you prepare for the FAA written test.',
}

export default function PrivacyPage() {
  const updated = 'September 12, 2026'

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
        <h1 className="text-4xl font-extrabold text-[#0A2463] mb-2">Privacy Policy</h1>
        <p className="text-[#0A2463]/50 text-sm mb-12">Last updated: {updated}</p>

        <div className="space-y-10 text-[#1e3a6e] leading-relaxed">

          <p className="text-sm text-[#0A2463]/60 mb-8">TARMAC is operated by <strong>Legion Systems LLC</strong>. This policy describes how we collect, use, and protect your data when you use TARMAC's FAA written-test preparation tools — including Diagnostic, Test Runway, Practice, Learn, Transfer, Weakness Attack, Prove It, spaced review, full practice exams, and Tarmac Readiness — as well as certain legacy community features that remain accessible to some users.</p>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">1. Information We Collect</h2>
            <p>We collect the following information when you use TARMAC:</p>

            <p className="mt-3 font-semibold">Account &amp; Profile</p>
            <ul className="list-disc pl-6 mt-1 space-y-1">
              <li>Name and email address (provided at signup)</li>
              <li>Password (hashed — never stored in plain text)</li>
              <li>Your selected exam type (Private Pilot or Instrument Rating) and, if provided, your target FAA test date and daily study-time preference</li>
              <li>The date and Terms of Service version you accepted at signup</li>
              <li><strong>CFI status</strong> — a self-reported boolean relevant only if you use the legacy Ask a CFI feature. We do not verify this claim.</li>
              <li><strong>Debrief anonymity preference</strong> — relevant only if you use the legacy Accident Debrief feature.</li>
              <li>Profile avatar (if uploaded)</li>
            </ul>

            <p className="mt-3 font-semibold">Study &amp; Practice Data</p>
            <ul className="list-disc pl-6 mt-1 space-y-1">
              <li>Your Diagnostic results, and your answers, confidence selections, and results across Practice, Learn, Transfer, Weakness Attack, Quiz, and full practice exam sessions</li>
              <li>Concept mastery and spaced-review scheduling data, used to personalize what you study next</li>
              <li>Test Runway / Study Plan progress — your current study phase, daily plan, and completion status</li>
              <li>Your Tarmac Readiness score and its underlying components</li>
              <li>Questions you have saved to study later</li>
              <li>AI Tutor conversations — including the question text, your selected answer, and whether it was correct, which are sent along with your chat messages to generate a relevant response</li>
              <li>If you choose to report it, your actual FAA exam outcome (pass/fail, score, and how it compared to your practice) — this is entirely optional and self-reported</li>
            </ul>

            <p className="mt-3 font-semibold">Community Content (legacy features)</p>
            <ul className="list-disc pl-6 mt-1 space-y-1">
              <li>Comments you post in Accident Debrief</li>
              <li>Questions and answers you post in Ask a CFI</li>
              <li>Weather scenarios and vote choices you submit in Weather Room</li>
              <li>Route critiques you submit</li>
              <li>Votes, flags, and reactions on community content</li>
              <li>Feedback and suggestions submitted via the in-app suggestion box</li>
            </ul>
            <p className="mt-2 text-sm" style={{ color: '#0A2463', opacity: 0.6 }}>Community content may be visible to other TARMAC members. Anonymous posting options in Accident Debrief display &quot;Anonymous Pilot&quot; rather than your real name.</p>

            <p className="mt-3 font-semibold">Payment Information</p>
            <p className="mt-1">Billing is handled entirely by Stripe. We do not store your credit card number or full payment details. We receive a Stripe customer ID, subscription status, and subscription metadata only.</p>

            <p className="mt-3 font-semibold">Support Requests</p>
            <p className="mt-1">If you contact us, report a bug, submit a suggestion, or apply to TARMAC's influencer/referral program, we collect the information you provide — such as your name, email, message, and the page you were on, and (for influencer applications) your social media handles and audience size.</p>

            <p className="mt-3 font-semibold">Device &amp; Technical Data</p>
            <p className="mt-1">TARMAC's application code does not itself collect or log your IP address, device information, or browsing activity. Our hosting provider, Vercel, may log standard technical information (such as IP address and browser type) as part of operating and securing its infrastructure, consistent with Vercel's own privacy policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>To provide, operate, and improve the Service — including your Diagnostic, Test Runway, personalized practice, concept mastery, spaced review, and Tarmac Readiness</li>
              <li>To generate and refine AI-assisted practice content</li>
              <li>To send transactional emails related to your account and study activity (such as billing receipts and quiz/exam results) — some of these emails include your specific answers and performance details</li>
              <li>To display your name and participation in legacy community features to other TARMAC members, if you choose to use them</li>
              <li>To moderate community content using automated AI systems (see Section 4)</li>
              <li>To manage your account, subscription, and billing</li>
              <li>To respond to support requests, bug reports, suggestions, and influencer program applications</li>
              <li>To monitor for abuse, spam, fraud, and Terms of Service violations</li>
              <li>To analyze aggregate usage patterns to improve the platform</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to third parties. We do not use your data to train our own AI models.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">3. Third-Party Services</h2>
            <p>We use the following trusted third parties to operate the Service:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Supabase</strong> — database hosting and authentication</li>
              <li><strong>Stripe</strong> — payment processing and subscription management (Stripe receives your email and an internal account identifier; TARMAC never receives or stores your full card details)</li>
              <li><strong>Anthropic</strong> — processes your AI Tutor conversations, including related question and performance context, to generate tutoring responses and explanations; also used for legacy community-content moderation and NTSB-data anonymization, where those features remain in use</li>
              <li><strong>OpenAI and Google (Gemini)</strong> — used internally to help generate practice question content. These providers do not receive your personal account information, answers, or activity — only non-personal question and concept material</li>
              <li><strong>Resend</strong> — transactional email delivery (some emails, such as quiz/exam results, include your performance details in the email content itself)</li>
              <li><strong>Vercel</strong> — application hosting and infrastructure</li>
              <li><strong>NTSB / Socrata</strong> — public aviation accident data used in the legacy Accident Debrief feature, where applicable</li>
            </ul>
            <p className="mt-3">Each of these providers has their own privacy policy governing data they receive. We encourage you to review them.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">4. AI Processing of Your Content and Data</h2>
            <p>TARMAC uses AI in several ways that may involve your content:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>AI Tutor and study support:</strong> when you ask the AI Tutor about a question, TARMAC sends that question's text and answer choices, your selected answer, whether it was correct, and your chat messages to Anthropic's API to generate a response.</li>
              <li><strong>Practice question generation:</strong> some practice questions, scenarios, and explanations are generated with the help of AI systems — including Anthropic, OpenAI, and Google's Gemini models — grounded in authoritative FAA source material and reviewed through TARMAC's validation process before publication. This generation process does not involve your personal data.</li>
              <li><strong>Content moderation (legacy features):</strong> community posts (Accident Debrief comments, CFI answers, Weather Room scenarios) are reviewed by an AI system before being published to check for policy violations.</li>
              <li><strong>NTSB anonymization (legacy):</strong> raw NTSB accident records are processed by AI to remove or alter identifying information (names, tail numbers, specific airport codes) before being presented as community scenarios.</li>
              <li><strong>Community summaries (legacy):</strong> top community comments on Accident Debrief scenarios may be synthesized by AI into educational summaries.</li>
            </ul>
            <p className="mt-3">Anthropic processes your content in accordance with their privacy policy and API usage terms. Anthropic does not use API inputs to train their models by default.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">5. Community Content Visibility (Legacy Features)</h2>
            <p>If you choose to use TARMAC's legacy community features, content you post there may be visible to other TARMAC members. Specifically:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Your <strong>name</strong> is displayed alongside your community contributions by default.</li>
              <li>In <strong>Accident Debrief</strong>, you may choose to post with your name or anonymously. Admins can always see the author regardless of anonymity setting.</li>
              <li><strong>Ask a CFI</strong> questions and answers are attributed to your name.</li>
              <li><strong>Weather Room</strong> vote choices (go/no-go) are aggregated; individual votes may be visible to other members.</li>
              <li>Your <strong>CFI status</strong> badge is visible if you have marked yourself as a CFI in your profile.</li>
            </ul>
            <p className="mt-3">Community content you have posted remains stored in our database even if you later change your name or anonymity settings. To request removal of specific posts, contact us at <a href="mailto:support@tarmac.study" className="text-[#3E92CC] underline">support@tarmac.study</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">6. Data Retention</h2>
            <p>We retain your account data, including your study and practice history, for as long as your account is active. Community content you have posted (comments, answers, scenarios) may remain visible after account deletion if it has received meaningful engagement, though it will be disassociated from your personal account. If you delete your account, we will delete your personal profile information within 30 days, except where retention is required by law or for legitimate business purposes (such as billing records and fraud prevention).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">7. Cookies and Local Storage</h2>
            <p>We use a session cookie required for authentication (via Supabase) and a cookie that remembers your selected exam type (Private Pilot or Instrument Rating). We may also use browser localStorage for UI state, session progress, and free-tier usage tracking. We do not use third-party advertising cookies or tracking pixels.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated personal data</li>
              <li>Export your data in a portable format (upon request)</li>
              <li>Request removal of specific community posts you have authored</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:support@tarmac.study" className="text-[#3E92CC] underline">support@tarmac.study</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">9. Security</h2>
            <p>We use industry-standard security measures including HTTPS encryption, hashed passwords, and row-level security policies in our database. Access to your data is restricted by authentication and authorization controls. No method of transmission over the internet is 100% secure — we cannot guarantee absolute security, but we take reasonable precautions to protect your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">10. Children's Privacy</h2>
            <p>TARMAC is not directed at children under 13, and use of TARMAC by anyone under 13 is prohibited. Users between 13 and 18 must have parental or guardian consent, as described in our Terms of Service. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, contact us and we will delete it promptly.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time to reflect new features or legal requirements. We will update the "Last updated" date at the top of this page. For material changes, we will make reasonable efforts to notify you. Continued use of the Service after changes are posted constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">12. Contact</h2>
            <p>Questions or concerns about your privacy? Contact us at <a href="mailto:support@tarmac.study" className="text-[#3E92CC] underline">support@tarmac.study</a>.</p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-[#0A2463]/10 flex flex-col md:flex-row gap-4 justify-between items-center text-sm text-[#0A2463]/50">
          <span>© {new Date().getFullYear()} Legion Systems LLC. TARMAC is not affiliated with the FAA.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-[#0A2463] transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-[#0A2463] transition-colors">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
