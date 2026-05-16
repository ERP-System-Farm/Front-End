// Centralized Dynamic Operational Profile Registry
// Version 1

export const OPERATION_PROFILES = {
  generic: [],

  irrigation: [
    {
      name: 'water_quantity',
      label: 'كمية المياه',
      type: 'number',
      unit: 'م³',
      required: true,
      min: 0,
    },
    {
      name: 'irrigation_duration',
      label: 'مدة الري',
      type: 'number',
      unit: 'دقيقة',
      required: true,
      min: 0,
    },
  ],

  fertilization: [
    {
      name: 'fertilizer_material',
      label: 'المادة السمادية',
      type: 'text',
      required: true,
    },
    {
      name: 'fertilizer_dosage',
      label: 'الجرعة',
      type: 'number',
      unit: 'كجم',
      required: true,
      min: 0,
    },
    {
      name: 'application_method',
      label: 'طريقة الإضافة',
      type: 'application_method',   // special type → renders API-driven dropdown
      required: false,
    },
  ],

  spraying: [
    {
      name: 'pesticide_material',
      label: 'المبيد',
      type: 'text',
      required: true,
    },
    {
      name: 'concentration',
      label: 'التركيز',
      type: 'text',
      required: false,
    },
    {
      name: 'spray_machine',
      label: 'آلة الرش',
      type: 'text',
      required: false,
    },
    {
      name: 'application_method',
      label: 'طريقة الرش / التطبيق',
      type: 'application_method',   // special type → renders API-driven dropdown
      required: false,
    },
  ],
}

export const getProfileVersion = () => 1
