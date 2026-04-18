import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | TARMAC',
  description: 'Privacy Policy for TARMAC — FAA Private Pilot exam prep platform.',
}

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-extrabold text-[#0A2463] mb-2">Privacy Policy</h1>
        <p className="text-[#0A2463]/50 text-sm mb-12">Last updated: {updated}</p>

        <div className="space-y-10 text-[#1e3a6e] leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">1. Information We Collect</h2>
            <p>We collect the following information when you use TARMAC:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Account information:</strong> Name, email address, and password (hashed — we never store it in plain text).</li>
              <li><strong>Usage data:</strong> Practice sessions, questions answered, scores, and AI chat conversations — used to power your personalized study experience.</li>
              <li><strong>Payment information:</strong> Billing is handled entirely by Stripe. We do not store your credit card number. We receive a Stripe customer ID and subscription status only.</li>
              <li><strong>Device/browser data:</strong> Standard server logs including IP address, browser type, and pages visited, used for security and performance monitoring.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>To provide and improve the Service (personalized practice, weak-area detection, AI tutoring)</li>
              <li>To manage your account and subscription</li>
              <li>To send transactional emails (exam results, billing receipts)</li>
              <li>To monitor for abuse and maintain security</li>
              <li>To analyze aggregate usage patterns to improve the platform</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">3. Third-Party Services</h2>
            <p>We use the following trusted third parties to operate the Service:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li><strong>Supabase</strong> — database and authentication hosting</li>
              <li><strong>Stripe</strong> — payment processing</li>
              <li><strong>Anthropic</strong> — AI-powered explanations and tutoring (your messages may be processed by Anthropic's API)</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
              <li><strong>Vercel</strong> — application hosting and edge infrastructure</li>
            </ul>
            <p className="mt-3">Each of these providers has their own privacy policy governing data they receive.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">4. AI Chat and Data Processing</h2>
            <p>When you use the AI Tutor, your messages are sent to Anthropic's API for processing. We do not use your chat history to train AI models. Conversations are stored in our database to provide session continuity and are associated with your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">5. Data Retention</h2>
            <p>We retain your account data for as long as your account is active. If you delete your account, we will delete your personal information within 30 days, except where retention is required by law or for legitimate business purposes (e.g., billing records).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">6. Cookies and Local Storage</h2>
            <p>We use session cookies required for authentication (via Supabase). We also use browser localStorage to track free-tier usage limits (e.g., AI message count). We do not use third-party advertising cookies or tracking pixels.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your data in a portable format (upon request)</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email us at <a href="mailto:mewing713@gmail.com" className="text-[#3E92CC] underline">mewing713@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">8. Security</h2>
            <p>We use industry-standard security measures including HTTPS encryption, hashed passwords, and row-level security in our database. No method of transmission over the internet is 100% secure — we cannot guarantee absolute security, but we take reasonable precautions to protect your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">9. Children's Privacy</h2>
            <p>TARMAC is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, contact us and we will delete it promptly.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Last updated" date. Continued use of the Service constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-[#0A2463] mb-3">11. Contact</h2>
            <p>Questions or concerns about your privacy? Contact us at <a href="mailto:mewing713@gmail.com" className="text-[#3E92CC] underline">mewing713@gmail.com</a>.</p>
          </section>

        </div>

        <div className="mt-16 pt-8 border-t border-[#0A2463]/10 flex flex-col md:flex-row gap-4 justify-between items-center text-sm text-[#0A2463]/50">
          <span>© {new Date().getFullYear()} TARMAC. Not affiliated with the FAA.</span>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-[#0A2463] transition-colors">Terms of Service</Link>
            <Link href="/" className="hover:text-[#0A2463] transition-colors">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
