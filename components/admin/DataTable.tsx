'use client'

import { ReactNode } from 'react'

interface Column {
  key: string
  label: string
  render?: (item: Record<string, unknown>) => ReactNode
}

interface DataTableProps {
  columns: Column[]
  data: Record<string, unknown>[]
  onEdit?: (item: Record<string, unknown>) => void
  onDelete?: (item: Record<string, unknown>) => void
}

export default function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
}: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {columns.map((col) => (
              <th key={col.key} className="text-right px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="text-right px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                إجراءات
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="text-center py-12 text-[var(--color-text-secondary)]">
                لا توجد بيانات
              </td>
            </tr>
          ) : (
            data.map((item, i) => (
              <tr key={i} className="border-b border-[var(--color-border)] hover:bg-[var(--color-background)]">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-[var(--color-text)]">
                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs bg-[var(--color-primary)] text-white hover:opacity-90"
                        >
                          تعديل
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(item)}
                          className="px-3 py-1.5 rounded-[var(--radius-md)] text-xs bg-red-500 text-white hover:opacity-90"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
