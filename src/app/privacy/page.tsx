import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Social Dashboard",
  description: "Privacy Policy for Social Dashboard application",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <a
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block"
        >
          &larr; Back to Dashboard
        </a>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: July 1, 2026
        </p>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Introduction</h2>
            <p>
              Welcome to Social Dashboard (&quot;we,&quot; &quot;our,&quot; or
              &quot;us&quot;). This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our
              application. Social Dashboard is a personal social media management
              tool that allows users to publish content to multiple social media
              platforms from a single interface.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              2. Information We Collect
            </h2>
            <p className="mb-3">
              We collect only the minimum information necessary to provide the
              service:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                <strong>Social Media Tokens:</strong> OAuth access tokens
                provided by Facebook, LinkedIn, Twitter (X), and Reddit when you
                connect your accounts. These tokens are stored securely and used
                solely to post content on your behalf.
              </li>
              <li>
                <strong>Basic Profile Data:</strong> Your name and profile
                information retrieved from connected social media platforms for
                display purposes.
              </li>
              <li>
                <strong>Post Content:</strong> Text content you compose and
                submit through the dashboard for publishing to connected
                platforms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              3. How We Use Your Information
            </h2>
            <p className="mb-3">
              The information we collect is used exclusively for:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Authenticating and connecting your social media accounts</li>
              <li>
                Publishing posts to your connected social media platforms on
                your behalf
              </li>
              <li>Displaying your connected accounts and post history</li>
              <li>
                Providing customer support and improving the application
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              4. How We Share Your Information
            </h2>
            <p>
              We do not sell, rent, or share your personal information with
              third parties for marketing purposes. Your social media tokens and
              post content are shared only with the respective social media
              platforms (Facebook, Instagram, LinkedIn, Twitter/X, Reddit) as
              required to publish your content. We do not access, read, or store
              your private messages or non-public social media data beyond what
              is necessary for posting.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Data Storage</h2>
            <p>
              All data is stored securely on encrypted servers. OAuth tokens are
              stored in a private database and are never exposed to third
              parties. Your social media credentials (usernames and passwords)
              are never stored in our system &mdash; we use industry-standard
              OAuth 2.0 authentication protocols to connect to your accounts
              without accessing your passwords.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              6. Third-Party Services
            </h2>
            <p className="mb-3">
              Our application integrates with the following third-party platforms.
              Each platform has its own privacy policy:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>
                Facebook / Instagram:{" "}
                <a
                  href="https://www.facebook.com/privacy/policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  facebook.com/privacy/policy
                </a>
              </li>
              <li>
                LinkedIn:{" "}
                <a
                  href="https://www.linkedin.com/legal/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  linkedin.com/legal/privacy-policy
                </a>
              </li>
              <li>
                Twitter / X:{" "}
                <a
                  href="https://x.com/en/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  x.com/en/privacy
                </a>
              </li>
              <li>
                Reddit:{" "}
                <a
                  href="https://www.reddit.com/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  reddit.com/policies/privacy-policy
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              7. Data Retention and Deletion
            </h2>
            <p>
              You can disconnect any social media account at any time through the
              dashboard, which will delete the associated tokens from our
              database. If you wish to have all your data completely removed,
              please contact us at the email provided below. We will permanently
              delete all stored data within 30 days of your request.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Security</h2>
            <p>
              We implement industry-standard security measures to protect your
              information, including encrypted data storage, secure OAuth token
              handling, and HTTPS encryption for all communications. However, no
              method of transmission over the internet is 100% secure, and we
              encourage you to regularly review your connected social media
              accounts and revoke access if needed.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              9. Children&apos;s Privacy
            </h2>
            <p>
              This application is not intended for use by children under the age
              of 13. We do not knowingly collect information from children under
              13. If you believe a child has provided us with personal
              information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">
              10. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify
              you of any material changes by updating the &quot;Last
              updated&quot; date at the top of this page. Your continued use of
              the application after any changes constitutes your acceptance of
              the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or your data,
              please contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:mitianraushan@gmail.com"
                className="underline hover:text-foreground"
              >
                mitianraushan@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}