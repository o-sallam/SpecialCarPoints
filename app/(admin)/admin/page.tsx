import { connectToDatabase } from '@/lib/mongodb'
import StatCard from '@/components/admin/StatCard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const { db } = await connectToDatabase()

  const totalPoints = await db.collection('sales_points').countDocuments()
  const vipCount = await db.collection('sales_points').countDocuments({ vip: true })
  const lastPoint = await db
    .collection('sales_points')
    .findOne({}, { sort: { updatedAt: -1 }, projection: { updatedAt: 1 } })

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">لوحة التحكم</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="إجمالي نقاط البيع"
          value={totalPoints}
          description="جميع نقاط البيع المسجلة"
        />
        <StatCard
          title="نقاط VIP"
          value={vipCount}
          description={`${totalPoints > 0 ? Math.round((vipCount / totalPoints) * 100) : 0}% من الإجمالي`}
        />
        <StatCard
          title="آخر تحديث"
          value={lastPoint?.updatedAt ? new Date(lastPoint.updatedAt).toLocaleDateString('ar-SA') : '-'}
          description="آخر تعديل لنقطة بيع"
        />
      </div>
    </div>
  )
}
