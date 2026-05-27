# ATLS Frontend UI & UX Standards
**Design System Source of Truth — Version 2.0**

This document establishes the architecture, layout systems, component behaviors, and coding patterns required for all ATLS Frontend applications. All modifications must strictly align with these specifications to prevent visual drift and reduce future technical debt.

---

## 📐 1. Visual Foundation & Tokens

### Spacing Scale
All layout margins, paddings, and flex gaps must align to a **4px base scale**. Do not use arbitrary custom padding values.
* **4px (`space-1` / `p-1`)**: Small list item gaps, inline badges, element inner margins.
* **8px (`space-2` / `p-2`)**: Standard field labels, compact grids, padding inside inputs.
* **12px (`space-3` / `p-3`)**: Inner card padding, tab spacing, list items.
* **16px (`space-4` / `p-4`)**: Standard card padding, modal content padding, responsive margins.
* **24px (`space-6` / `p-6`)**: Page headers, modal wrappers, section gap dividers.
* **32px (`space-8` / `p-8`)**: Massive gaps (use sparingly for clean dashboard section blocks).

### Typography Scale
Ensure clear text hierarchy. Prefer standard Cairo typography.
* **Hero Title**: `text-3xl` (30px) / `font-black` (dashboard landing stat indicators)
* **Page Title**: `text-2xl` (24px) / `font-extrabold`
* **Section Title**: `text-lg` (18px) / `font-bold`
* **Sub-Section Label**: `text-sm` (14px) / `font-bold`
* **Body Text**: `text-xs` (12px) to `text-sm` (13px) / `font-medium` or `font-semibold`
* **Caption/Helper Text**: `text-[11px]` (11px) / `font-medium`

### Border Radius Hierarchy
* **`rounded-lg` (8px)**: Inputs, small buttons, dropdown menus.
* **`rounded-xl` (12px)**: Tab items, badges, alerts, inline containers.
* **`rounded-2xl` (16px)**: Standard cards, modal popup cards.
* **`rounded-full` (9999px)**: Avatars, badges, indicator status lights.

---

## 🎨 2. Theme & Dark Mode Specifications
All components must support dark mode using the `.dark` class selector.
* **Light Mode Background**: Slate-50 (`#f8fafc`) for overall page workspace.
* **Light Mode Cards**: Pure white (`#ffffff`) with border slate-100 (`#f1f5f9`).
* **Dark Mode Background**: Slate-950 (`#030712`) for page background.
* **Dark Mode Cards**: Slate-900 (`#0f172a`) with border slate-800 (`#1e293b`).
* **Primary Color**: Forest Green (`#16a34a` light / `#22c55e` dark).

---

## 📝 3. Form System Layout Rules
ERP forms are heavily utilized and must remain consistent:

1. **Hierarchy**: Use `<FormSection>` to group related fields, providing clear titles and description context.
2. **Spacing**: Use `<FormGrid>` to manage layout rows. Do not set ad-hoc column classes in child components.
3. **Form Primitives**: Forms must remain strictly **presentational and stateless**.
   * Forms should not manage their own validation state or handle API endpoints.
   * Let parent wrappers or hooks (`react-hook-form` controllers) supply error state messages to the child via props.

### Standard Field Structure:
```jsx
import { FormSection, FormGrid, FormFieldWrapper } from '@/components/ui/form-primitives';

<FormSection title="تفاصيل العامل" description="أدخل بيانات الهوية الشخصية والاتصال">
  <FormGrid cols={2}>
    <FormFieldWrapper label="الاسم الكامل" required error={errors.name}>
      <input type="text" className="..." />
    </FormFieldWrapper>
    <FormFieldWrapper label="رقم الهاتف" error={errors.phone}>
      <input type="tel" className="..." />
    </FormFieldWrapper>
  </FormGrid>
</FormSection>
```

---

## 📊 4. Composable Table & List Behaviors
Tables must follow modular composition instead of a single overengineered generic component.

* **Responsive Container**: Tables must be wrapped inside `<TableResponsiveWrapper>` to handle small screens elegantly.
* **TableToolbar**: Includes a standardized search field and options dropdown selection array with a clear filter button.
* **Pagination**: Always use `<TablePagination>` with rows-per-page drop-down selectors and standard arrows.

---

## ♿ 5. Accessibility (a11y) & RTL Conventions

* **RTL First**: Layout direction must automatically adjust via `dir="rtl"` / `dir="ltr"` HTML attributes.
* **Focus States**: All interactive elements (buttons, inputs, select fields) must display a `focus:ring-2 focus:ring-emerald-500/20` focus ring.
* **Chevron Alignment**: In RTL mode, navigate direction arrows can become inverted. Always group pagination controls under `dir="ltr"` containers to maintain standard chevron orientation.
* **Semantic HTML**: Use proper HTML tags (`<header>`, `<main>`, `<footer>`, `<section>`) with descriptive buttons (`type="button"`) and ARIA-role panel parameters.

---

## 🚫 6. Forbidden Anti-Patterns

* ❌ **Smart UI Wrappers**: Do not write network queries, API hooks, or local storage handlers inside basic layout primitives.
* ❌ **Direct CSS Overrides**: Do not add arbitrary raw margins (`margin-top: 17px`) or custom inline hex colors inside JSX. Standardize with Tailwind tokens.
* ❌ **Mass Memoization**: Avoid wrapping standard presentational elements in `useMemo` or `useCallback` prematurely. Keep code simple.
* ❌ **Dual Theme Handlers**: Do not declare manual hooks that duplicate system themes. Let classes handles dark modes seamlessly.
