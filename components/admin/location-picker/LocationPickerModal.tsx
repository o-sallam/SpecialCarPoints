'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import MapPickerTab from './MapPickerTab'
import GoogleMapsUrlTab from './GoogleMapsUrlTab'

export type PickedLocation = { lat: number; lng: number } | null

interface LocationPickerModalProps {
  open: boolean
  /** the form's current lat/lng (or null for a new point) */
  initialCoords: { lat: number; lng: number } | null
  /** null allowed (clear) — writes to the form only here */
  onConfirm: (coords: { lat: number; lng: number } | null) => void
  /** must NOT mutate the form state */
  onCancel: () => void
}

/**
 * Modal that owns a single shared PickedLocation used by both tabs; only
 * Confirm writes it back to the form. Radix Dialog provides focus-trap +
 * Escape (routed to onCancel) out of the box.
 */
export default function LocationPickerModal({
  open,
  initialCoords,
  onConfirm,
  onCancel,
}: LocationPickerModalProps) {
  // Modal is mounted only while open, so this init is correct on every open.
  const [picked, setPicked] = useState<PickedLocation>(initialCoords)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Escape / overlay / the X button all route to Cancel (non-destructive).
        if (!next) onCancel()
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>تحديد الموقع الجغرافي</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map">الخريطة</TabsTrigger>
            <TabsTrigger value="url">رابط جوجل ماب</TabsTrigger>
          </TabsList>
          <TabsContent value="map">
            <MapPickerTab value={picked} onChange={setPicked} savedCoords={initialCoords} />
          </TabsContent>
          <TabsContent value="url">
            <GoogleMapsUrlTab value={picked} onChange={setPicked} />
          </TabsContent>
        </Tabs>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" onClick={() => onConfirm(picked)}>
            تأكيد الموقع
          </Button>
          <Button type="button" variant="outline" onClick={() => onCancel()}>
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}