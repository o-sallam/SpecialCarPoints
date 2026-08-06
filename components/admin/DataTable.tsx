'use client'

import { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
  const hasActions = Boolean(onEdit || onDelete)
  return (
    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <Table>
        <TableHeader>
          <TableRow className="border-[var(--color-border)] hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className="text-right px-4 py-3 font-medium text-[var(--color-text-secondary)]"
              >
                {col.label}
              </TableHead>
            ))}
            {hasActions && (
              <TableHead className="text-right px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                إجراءات
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (hasActions ? 1 : 0)}
                className="text-center py-12 text-[var(--color-text-secondary)]"
              >
                لا توجد بيانات
              </TableCell>
            </TableRow>
          ) : (
            data.map((item, i) => (
              <TableRow key={i} className="border-[var(--color-border)] hover:bg-[var(--color-background)]">
                {columns.map((col) => (
                  <TableCell key={col.key} className="px-4 py-3 text-[var(--color-text)]">
                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                  </TableCell>
                ))}
                {hasActions && (
                  <TableCell className="px-4 py-3">
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
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}