import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'نقاط بيع معتمدة',
  description:
    'منتجات Special Car الآن أقرب لك — أكثر من 20 مدينة وأكثر من 60 نقطة بيع معتمدة حول المملكة. اعثر على أقرب وكيل معتمد.',
}

export default function SalesPointsPartnersPage() {
  return (
    <div className="container max-w-4xl space-y-6 py-10 md:space-y-8 md:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-text)] md:text-4xl">
        نقاط بيع معتمدة
      </h1>

      <p className="text-lg font-bold text-[var(--color-primary)] md:text-xl">
        منتجات Special Car الآن أقرب لك
      </p>

      <div className="space-y-4 text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base">
        <p>
          بحمد الله قدرنا نتوسع ونتواجد في أكثر من 20 مدينة حول المملكة من خلال أكثر من 60 نقطة
          بيع معتمدة
        </p>
        <p>وين ما كنت، بتلقى منتجاتنا الأصلية متوفرة عند أقرب وكيل معتمد</p>
        <p>
          وبعض هذه النقاط مميزة بوصف VIP لأنها تقدم مجموعة أوسع من المنتجات
        </p>
      </div>

      <p className="text-sm font-medium text-[var(--color-text)]">
        للوصول الى جميع نقاط البيع اضغط على الرابط في الاسفل
      </p>

      <Button asChild size="lg" className="shadow-[var(--shadow-md)]">
        {/* Internal link: the home page IS the sales-points locator. */}
        <Link href="/">جميع نقاط البيع</Link>
      </Button>
    </div>
  )
}