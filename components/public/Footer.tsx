import SocialIcons from './SocialIcons'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="container py-12 md:py-16">
        {/* brand / about + social — columns on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
          {/* brand & about */}
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/special-car-logo.avif"
                alt="Special Car"
                className="h-9 w-auto object-contain dark:hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/darkmode-special-car-logo.png"
                alt="Special Car"
                className="hidden h-9 w-auto object-contain dark:block"
              />
              <span className="text-lg font-extrabold tracking-tight text-[var(--color-text)]">
                Special Car
              </span>
            </div>
            {/* TODO: insert approved About copy */}
            <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">
              الشبكة الرسمية لنقاط بيع Special Car المعتمدة في المملكة العربية السعودية — تصفّح
              نقاط البيع حسب المنطقة أو على الخريطة، وحدّد موقعك للوصول إلى الأقرب إليك.
            </p>
          </div>

          {/* social */}
          <div className="space-y-3 md:space-y-4">
            <h3 className="text-sm font-bold text-[var(--color-text)]">تابعنا</h3>
            {/* TODO: add real social URLs — safe placeholders rendered for now */}
            <SocialIcons
              links={{
                x: '#', // TODO: real X profile URL
                facebook: '#', // TODO: real Facebook page URL
                snapchat: '#', // TODO: real Snapchat profile
                whatsapp: '0000000000', // TODO: real support WhatsApp number
                email: '#', // TODO: real support email
              }}
            />
          </div>
        </div>

        {/* legal row */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-5 md:mt-10 md:pt-6 md:flex-row">
          <p className="text-sm text-[var(--color-text-secondary)]">
            © {new Date().getFullYear()} Special Car. جميع الحقوق محفوظة
          </p>
          <a
            href="https://specialcarsa.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            specialcarsa.com
          </a>
        </div>
      </div>
    </footer>
  )
}