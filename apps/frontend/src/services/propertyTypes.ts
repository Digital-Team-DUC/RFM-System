export interface PropertyTypeOption {
  value: string;
  labelEn: string;
  labelKm: string;
}

export const DEFAULT_PROPERTY_TYPES: PropertyTypeOption[] = [
  { value: 'LAND_PLOT', labelEn: 'Land Plot', labelKm: 'ដីឡូត៍' },
  { value: 'VILLA_SINGLE', labelEn: 'Single Villa', labelKm: 'វីឡាទោល' },
  { value: 'VILLA_TWIN', labelEn: 'Twin Villa', labelKm: 'វីឡាភ្លោះ' },
  { value: 'SHOPHOUSE', labelEn: 'Shophouse', labelKm: 'ផ្ទះអាជីវកម្ម (Shophouse)' },
  { value: 'TOWNHOUSE', labelEn: 'Townhouse', labelKm: 'ផ្ទះល្វែង / វីឡាកូនកាត់' },
  { value: 'CONDO_STUDIO', labelEn: 'Studio Condo', labelKm: 'ខុនដូ (Condo)' },
  { value: 'COMMERCIAL', labelEn: 'Commercial Space', labelKm: 'អចលនទ្រព្យពាណិជ្ជកម្ម' },
];

const STORAGE_KEY = 'rfm_custom_property_types';

export function getPropertyTypes(): PropertyTypeOption[] {
  if (typeof window === 'undefined') return DEFAULT_PROPERTY_TYPES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROPERTY_TYPES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse custom property types:', e);
  }
  return DEFAULT_PROPERTY_TYPES;
}

export function savePropertyTypes(types: PropertyTypeOption[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
  window.dispatchEvent(new CustomEvent('rfm_property_types_changed', { detail: types }));
}

export function addPropertyType(type: { labelEn: string; labelKm?: string }): PropertyTypeOption {
  const current = getPropertyTypes();
  const sanitizedValue = type.labelEn
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')
    .replace(/_+/g, '_');

  // Check if exists
  const existing = current.find((t) => t.value === sanitizedValue);
  if (existing) {
    return existing;
  }

  const newType: PropertyTypeOption = {
    value: sanitizedValue,
    labelEn: type.labelEn.trim(),
    labelKm: type.labelKm?.trim() || type.labelEn.trim(),
  };

  const updated = [...current, newType];
  savePropertyTypes(updated);
  return newType;
}

export function deletePropertyType(value: string): void {
  const current = getPropertyTypes();
  const updated = current.filter((t) => t.value !== value);
  savePropertyTypes(updated);
}

export function resetPropertyTypes(): PropertyTypeOption[] {
  savePropertyTypes(DEFAULT_PROPERTY_TYPES);
  return DEFAULT_PROPERTY_TYPES;
}

export function getPropertyTypeLabel(value: string, lang: string = 'km'): string {
  const types = getPropertyTypes();
  const found = types.find((t) => t.value === value);
  if (found) {
    return lang === 'km' ? found.labelKm : found.labelEn;
  }
  // Fallback prettifier
  return value
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

