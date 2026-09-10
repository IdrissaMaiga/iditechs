import Link from "next/link";



export const metadata = {
  title: "Privacy Policy | Idrissa Maiga",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl prose prose-gray dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="text-sm text-gray-500">Last updated: June 17, 2026</p>

        <h2>Overview</h2>
        <p>
          This website (<strong>idrissamaiga.iditechs.com</strong>) is a personal portfolio
          and blog operated by Idrissa Maiga. Your privacy matters, and this policy explains
          what data we collect and how we use it.
        </p>

        <h2>Information We Collect</h2>
        <h3>Google Sign-In</h3>
        <p>
          When you sign in with Google, we receive your <strong>name</strong>,{" "}
          <strong>email address</strong>, and <strong>profile picture</strong> from your
          Google account. We use this solely to identify you when you post comments or
          like blog posts.
        </p>

        <h3>Comments and Likes</h3>
        <p>
          When you comment on a blog post or like a post, we store that content along with
          your user profile information. Comments are publicly visible alongside your name
          and profile picture.
        </p>

        <h3>No Tracking or Analytics</h3>
        <p>
          We do not use cookies for tracking, advertising, or analytics. The only cookies
          used are essential session cookies required for authentication.
        </p>

        <h2>How We Use Your Data</h2>
        <ul>
          <li>Display your name and photo next to your comments</li>
          <li>Track which posts you have liked</li>
          <li>Authenticate your identity when posting</li>
        </ul>
        <p>We do <strong>not</strong> sell, share, or transfer your data to third parties.</p>

        <h2>Data Storage</h2>
        <p>
          Your data is stored securely in a PostgreSQL database hosted on Neon
          (neon.tech) with encrypted connections. The website is hosted on Vercel.
        </p>

        <h2>Data Deletion</h2>
        <p>
          You can request deletion of your account and all associated data by contacting{" "}
          <a href="mailto:idrissa.maiga@iditechs.com">idrissa.maiga@iditechs.com</a>. We will
          process deletion requests within 30 days.
        </p>

        <h2>Third-Party Services</h2>
        <ul>
          <li><strong>Google OAuth</strong> — for authentication (governed by Google&apos;s Privacy Policy)</li>
          <li><strong>Vercel</strong> — hosting provider</li>
          <li><strong>Neon</strong> — database hosting</li>
        </ul>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. Changes will be reflected on this
          page with an updated date.
        </p>

        <h2>Contact</h2>
        <p>
          For questions about this privacy policy, contact{" "}
          <a href="mailto:idrissa.maiga@iditechs.com">idrissa.maiga@iditechs.com</a>.
        </p>

        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-800">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline text-sm no-underline">
            &larr; Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
