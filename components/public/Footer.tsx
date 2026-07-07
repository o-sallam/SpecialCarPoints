export default function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] mt-auto">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            © {new Date().getFullYear()} Special Car. جميع الحقوق محفوظة
          </p>
          <a
            href="https://specialcarsa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-primary)] hover:underline"
          >
            specialcarsa.com
          </a>
        </div>
      </div>
    </footer>
  )
}
