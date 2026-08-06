interface CityStats {
  cityName: string
  count: number
  percentage: number
}

interface CityDistributionProps {
  cities: CityStats[]
}

export default function CityDistribution({ cities }: CityDistributionProps) {
  if (cities.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6">
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">
          توزيع نقاط البيع حسب المدينة
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">لا توجد بيانات</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6">
      <h2 className="text-lg font-bold text-[var(--color-text)] mb-4">
        توزيع نقاط البيع حسب المدينة
      </h2>

      <div className="space-y-4">
        {cities.map((city, index) => (
          <div key={city.cityName}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[var(--color-text-secondary)]">
                  #{index + 1}
                </span>
                <span className="text-sm font-medium text-[var(--color-text)]">
                  {city.cityName}
                </span>
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-[var(--color-text)]">{city.count}</span>
                <span className="text-xs text-[var(--color-text-secondary)] mr-1">
                  ({city.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>

            <div className="w-full bg-[var(--color-background)] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[var(--color-primary)] h-full rounded-full transition-all"
                style={{ width: `${city.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}