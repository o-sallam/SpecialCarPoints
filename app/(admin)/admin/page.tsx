import { connectToDatabase } from '@/lib/mongodb'
import { getCitiesById } from '@/lib/data/cities'
import { getNeighborhoodsById } from '@/lib/data/neighborhoods'
import { composeDisplayName } from '@/lib/points'
import StatCard from '@/components/admin/StatCard'
import RecentActivity from '@/components/admin/RecentActivity'
import QuickActions from '@/components/admin/QuickActions'
import CityDistribution from '@/components/admin/CityDistribution'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const { db } = await connectToDatabase()

  // Parallel data fetching for performance
  const [
    totalPoints,
    vipCount,
    totalCities,
    totalNeighborhoods,
    pointsWithCoords,
    cityOnlyPoints,
    recentlyCreated,
    recentlyUpdated,
    salesPoints,
    citiesById,
    neighborhoodsById,
  ] = await Promise.all([
    db.collection('sales_points').countDocuments(),
    db.collection('sales_points').countDocuments({ vip: true }),
    db.collection('cities').countDocuments(),
    db.collection('neighborhoods').countDocuments(),
    db.collection('sales_points').countDocuments({
      lat: { $exists: true, $ne: null },
      lng: { $exists: true, $ne: null },
    }),
    db.collection('sales_points').countDocuments({ neighborhoodId: null }),
    db.collection('sales_points').find({}).sort({ createdAt: -1 }).limit(5).toArray(),
    db.collection('sales_points').find({}).sort({ updatedAt: -1 }).limit(5).toArray(),
    db.collection('sales_points').find({}).toArray(),
    getCitiesById(),
    getNeighborhoodsById(),
  ])

  // Calculate city distribution (top 5 cities by sales point count)
  const cityCountMap = new Map<string, { name: string; count: number }>()

  for (const point of salesPoints) {
    const cityId = point.cityId?.toString()
    if (cityId) {
      const city = citiesById.get(cityId)
      const cityName = city?.name || 'غير محدد'
      const current = cityCountMap.get(cityName) || { name: cityName, count: 0 }
      cityCountMap.set(cityName, { name: cityName, count: current.count + 1 })
    }
  }

  const topCities = Array.from(cityCountMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((city) => ({
      cityName: city.name,
      count: city.count,
      percentage: totalPoints > 0 ? (city.count / totalPoints) * 100 : 0,
    }))

  // Format recent activity
  const formatActivity = (points: any[], type: 'created' | 'updated') => {
    return points.map((p) => {
      const city = p.cityId ? citiesById.get(p.cityId.toString()) : null
      const neighborhood = p.neighborhoodId
        ? neighborhoodsById.get(p.neighborhoodId.toString())
        : null

      const displayName = city
        ? composeDisplayName(city.name, city.type || 'مدينة', neighborhood?.name || null, p.extraLabel || null)
        : 'نقطة بيع'

      return {
        _id: p._id.toString(),
        title: displayName,
        timestamp: type === 'created' ? p.createdAt : p.updatedAt,
        type,
      }
    })
  }

  const recentCreatedActivity = formatActivity(recentlyCreated, 'created')
  const recentUpdatedActivity = formatActivity(recentlyUpdated, 'updated')

  // Calculate percentages
  const vipPercentage = totalPoints > 0 ? Math.round((vipCount / totalPoints) * 100) : 0
  const coordsPercentage =
    totalPoints > 0 ? Math.round((pointsWithCoords / totalPoints) * 100) : 0
  const cityOnlyPercentage =
    totalPoints > 0 ? Math.round((cityOnlyPoints / totalPoints) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">لوحة التحكم</h1>
        <p className="text-[var(--color-text-secondary)]">نظرة عامة على نقاط بيع Special Car</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي نقاط البيع"
          value={totalPoints}
          description="جميع النقاط المسجلة"
          icon="📍"
          colorScheme="primary"
        />

        <StatCard
          title="نقاط VIP"
          value={vipCount}
          description={`${vipPercentage}% من الإجمالي`}
          icon="⭐"
          colorScheme="success"
        />

        <StatCard
          title="المدن"
          value={totalCities}
          description="مدن تحتوي على نقاط بيع"
          icon="🏙️"
        />

        <StatCard
          title="الأحياء"
          value={totalNeighborhoods}
          description="أحياء مسجلة في النظام"
          icon="🏘️"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="نقاط مع إحداثيات"
          value={pointsWithCoords}
          description={`${coordsPercentage}% من النقاط لديها إحداثيات GPS`}
          icon="🗺️"
        />

        <StatCard
          title="نقاط على مستوى المدينة"
          value={cityOnlyPoints}
          description={`${cityOnlyPercentage}% بدون تحديد حي`}
          icon="📌"
        />

        <StatCard
          title="نقاط عادية"
          value={totalPoints - vipCount}
          description={`${100 - vipPercentage}% من الإجمالي`}
          icon="📋"
        />
      </div>

      {/* Content Grid: City Distribution + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CityDistribution cities={topCities} />
        </div>

        <div>
          <QuickActions />
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity items={recentCreatedActivity} title="آخر الإضافات" />
        <RecentActivity items={recentUpdatedActivity} title="آخر التحديثات" />
      </div>
    </div>
  )
}