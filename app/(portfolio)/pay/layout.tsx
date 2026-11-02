import "../mail/mail.css";

export default function PayLayout({ children }: { children: React.ReactNode }) {
  return <div className="mailapp" style={{ overflowY: "auto" }}>{children}</div>;
}
