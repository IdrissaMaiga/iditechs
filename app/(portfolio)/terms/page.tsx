import Link from "next/link";



export const metadata = {
  title: "Terms of Service | Idrissa Maiga",
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl prose prose-gray dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="text-sm text-gray-500">Last updated: June 17, 2026</p>

        <h2>Acceptance of Terms</h2>
        <p>
          By accessing and using this website (<strong>idrissamaiga.iditechs.com</strong>),
          you agree to these terms of service. If you do not agree, please do not use the
          site.
        </p>

        <h2>Use of the Website</h2>
        <p>
          This is a personal portfolio and blog. You may browse content freely without an
          account. To interact (comment on posts, like posts), you must sign in with a
          Google account.
        </p>

        <h2>User Content</h2>
        <p>When you post comments, you agree to:</p>
        <ul>
          <li>Not post content that is abusive, hateful, harassing, or illegal</li>
          <li>Not post spam, advertisements, or misleading content</li>
          <li>Not impersonate others or misrepresent your identity</li>
          <li>Respect other users and engage in constructive discussion</li>
        </ul>
        <p>
          We reserve the right to remove any content that violates these guidelines and to
          suspend accounts that repeatedly violate them.
        </p>

        <h2>Intellectual Property</h2>
        <p>
          All original content on this website (blog posts, code, design) is the property
          of Idrissa Maiga unless otherwise stated. You may share links to content but may
          not reproduce it without permission.
        </p>

        <h2>Disclaimer</h2>
        <p>
          This website is provided &quot;as is&quot; without warranties of any kind. Blog posts
          represent personal opinions and are for informational purposes only. Code examples
          are provided without guarantee of fitness for any particular purpose.
        </p>

        <h2>Limitation of Liability</h2>
        <p>
          Idrissa Maiga shall not be liable for any damages arising from the use of this
          website or reliance on its content.
        </p>

        <h2>Changes to Terms</h2>
        <p>
          These terms may be updated at any time. Continued use of the website after
          changes constitutes acceptance of the new terms.
        </p>

        <h2>Contact</h2>
        <p>
          For questions about these terms, contact{" "}
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
