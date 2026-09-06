import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | TARMAC',
  description: 'Privacy Policy for TARMAC — The community that makes you a better pilot.',
}

export default function PrivacyPage() {
  const updated = 'June 13, 2026'

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

          <p className="text-sm text-[#0A2463]/60 mb-8">TARMAC is operated by <strong>Legion Systems LLC</strong>. This policy describes how we collect, use, and protect your data when you use TARMAC — including our Ground School, Accident Debrief, Ask a CFI, Weather Room, and other community features.</p>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">1. Information We Collect</h2>
            <p>We collect the following information when you use TARMAC:</p>

            <p className="mt-3 font-semibold">Account &amp; Profile</p>
            <ul className="list-disc pl-6 mt-1 space-y-1">
              <li>Name and email address (provided at signup)</li>
              <li>Password (hashed — never stored in plain text)</li>
              <li><strong>Callsign</strong> — a community display name you choose (3–12 alphanumeric characters). Visible to other TARMAC members.</li>
              <li><strong>CFI status</strong> — a self-reported boolean indicating whether you are a Certificated Flight Instructor. We do not verify this claim.</li>
              <li><strong>Debrief anonymity preference</strong> — whether you prefer to post in Accident Debrief using your callsign or anonymously.</li>
              <li>Profile avatar (if uploaded)</li>
            </ul>

            <p className="mt-3 font-semibold">Ground School Usage Data</p>
            <ul className="list-disc pl-6 mt-1 space-y-1">
              <li>Practice sessions, questions answered, scores, quiz results, and exam performance — used to power your personalized study experience and spaced repetition system.</li>
              <li>AI Tutor chat conversations — stored to provide session continuity and personalized tutoring.</li>
            </ul>

            <p className="mt-3 font-semibold">Community Content</p>
            <ul className="list-disc pl-6 mt-1 space-y-1">
              <li>Comments you post in Accident Debrief</li>
              <li>Questions and answers you post in Ask a CFI</li>
              <li>Weather scenarios and vote choices you submit in Weather Room</li>
              <li>Route critiques you submit</li>
              <li>Votes, flags, and reactions on community content</li>
              <li>Feedback and suggestions submitted via the in-app suggestion box</li>
            </ul>
            <p className="mt-2 text-sm" style={{ color: '#0A2463', opacity: 0.6 }}>Community content may be visible to other TARMAC members. Anonymous posting options in Accident Debrief display your chosen callsign rather than your real name.</p>

            <p className="mt-3 font-semibold">Payment Information</p>
            <p className="mt-1">Billing is handled entirely by Stripe. We do not store your credit card number or full payment details. We receive a Stripe customer ID, subscription status, and subscription metadata only.</p>

            <p className="mt-3 font-semibold">Device &amp; Technical Data</p>
            <p className="mt-1">Standard server logs including IP address, browser type, and pages visited — used for security, error monitoring, and performance analysis.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>To provide, operate, and improve the Service — including personalized Ground School practice, weak-area detection, AI tutoring, and community features</li>
              <li>To display your callsign and participation in community features to other TARMAC members</li>
              <li>To moderate community content using automated AI systems (see Section 4)</li>
              <li>To manage your account, subscription, and billing</li>
              <li>To send transactional emails (billing receipts, account alerts)</li>
              <li>To monitor for abuse, spam, fraud, and Terms of Service violations</li>
              <li>To analyze aggregate usage patterns to improve the platform</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to third parties. We do not use your data to train AI models.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">3. Third-Party Services</h2>
            <p>We use the following trusted third parties to operate the Service:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Supabase</strong> — database hosting and authentication</li>
              <li><strong>Stripe</strong> — payment processing and subscription management</li>
              <li><strong>Anthropic</strong> — AI-powered explanations, tutoring, accident anonymization, and community content moderation (your messages and community posts may be processed by Anthropic's API)</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
              <li><strong>Vercel</strong> — application hosting and edge infrastructure</li>
              <li><strong>NTSB / Socrata</strong> — public aviation accident data used to populate Accident Debrief scenarios</li>
            </ul>
            <p className="mt-3">Each of these providers has their own privacy policy governing data they receive. We encourage you to review them.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">4. AI Processing of Community Content</h2>
            <p>TARMAC uses AI (powered by Anthropic) in several ways that may involve your content:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Content moderation:</strong> Community posts (Accident Debrief comments, CFI answers, Weather Room scenarios) are reviewed by an AI system before being published to check for policy violations.</li>
              <li><strong>NTSB anonymization:</strong> Raw NTSB accident records are processed by AI to remove or alter identifying information (names, tail numbers, specific airport codes) before being presented as community scenarios.</li>
              <li><strong>AI Tutor:</strong> Your chat messages in the AI Tutor are sent to Anthropic's API for processing. We do not use these to train AI models.</li>
              <li><strong>Community summaries:</strong> Top community comments on Accident Debrief scenarios may be synthesized by AI into educational summaries.</li>
            </ul>
            <p className="mt-3">Anthropic processes your content in accordance with their privacy policy and API usage terms. Anthropic does not use API inputs to train their models by default.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">5. Community Content Visibility</h2>
            <p>Content you post in TARMAC community features may be visible to other TARMAC members. Specifically:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Your <strong>callsign</strong> is displayed alongside your community contributions by default.</li>
              <li>In <strong>Accident Debrief</strong>, you may choose to post with your callsign or anonymously. Admins can always see the author regardless of anonymity setting.</li>
              <li><strong>Ask a CFI</strong> questions and answers are attributed to your callsign.</li>
              <li><strong>Weather Room</strong> vote choices (go/no-go) are aggregated; individual votes may be visible to other members.</li>
              <li>Your <strong>CFI status</strong> badge is visible if you have marked yourself as a CFI in your profile.</li>
            </ul>
            <p className="mt-3">Community content you have posted remains stored in our database even if you later change your callsign or anonymity settings. To request removal of specific posts, contact us at <a href="mailto:support@tarmac.study" className="text-[#3E92CC] underline">support@tarmac.study</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">6. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. Community content you have posted (comments, answers, scenarios) may remain visible after account deletion if it has received meaningful engagement, though it will be disassociated from your personal account. If you delete your account, we will delete your personal profile information within 30 days, except where retention is required by law or for legitimate business purposes (such as billing records and fraud prevention).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">7. Cookies and Local Storage</h2>
            <p>We use session cookies required for authentication (via Supabase). We may also use browser localStorage for UI state and free-tier usage tracking. We do not use third-party advertising cookies or tracking pixels.</p>
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
            <p>We use industry-standard security measures including HTTPS encryption, hashed passwords, and row-level security policies in our database. Access to community content and user data is restricted by authentication and authorization controls. No method of transmission over the internet is 100% secure — we cannot guarantee absolute security, but we take reasonable precautions to protect your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">10. Children's Privacy</h2>
            <p>TARMAC is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, contact us and we will delete it promptly.</p>
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
