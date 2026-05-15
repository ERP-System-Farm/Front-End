import React from 'react'

/**
 * Registry for dynamic timeline rendering.
 * Maps profile_type to a specific summary renderer.
 */
export const timelineRegistry = {
  irrigation: (data) => (
    <div className="flex flex-wrap gap-4 text-sm text-blue-700">
      <span>
        💧 <strong>{data.water_quantity}</strong> م³
      </span>
      <span>
        ⏱️ <strong>{data.irrigation_duration}</strong> دقيقة
      </span>
    </div>
  ),
  fertilization: (data) => (
    <div className="flex flex-wrap gap-4 text-sm text-green-700">
      <span>
        🌿 <strong>{data.fertilizer_material}</strong>
      </span>
      <span>
        ⚖️ <strong>{data.fertilizer_dosage}</strong> كجم
      </span>
    </div>
  ),
  spraying: (data) => (
    <div className="flex flex-wrap gap-4 text-sm text-orange-700">
      <span>
        🧪 <strong>{data.pesticide_material}</strong>
      </span>
      {data.pesticide_concentration && (
        <span>
          📉 <strong>{data.pesticide_concentration}</strong>%
        </span>
      )}
    </div>
  ),
  generic: (data) => (
    <div className="text-xs text-gray-500 flex flex-wrap gap-2">
      {Object.entries(data).map(([key, val]) => (
        <span key={key} className="bg-gray-100 px-2 py-0.5 rounded">
          {key}: {String(val)}
        </span>
      ))}
    </div>
  ),
}

/**
 * Safe Profile Renderer
 * 1. Checks hardcoded registry for optimized UI.
 * 2. Falls back to dynamic UI Schema mapping.
 * 3. Final fallback to generic key-value display.
 */
export const SafeProfileRenderer = ({ type, data, uiSchema }) => {
  if (!data || Object.keys(data).length === 0) return null

  const Renderer = timelineRegistry[type]

  if (Renderer) return Renderer(data)

  // Schema-driven rendering (Future proofing)
  if (uiSchema?.timeline_fields) {
    return (
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {uiSchema.timeline_fields.map((field) => (
          <span key={field.key}>
            {field.label}: <strong>{data[field.key]}</strong> {field.unit || ''}
          </span>
        ))}
      </div>
    )
  }

  return timelineRegistry.generic(data)
}
