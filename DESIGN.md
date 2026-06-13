---
name: SplitSmart Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#0058be'
  on-secondary: '#ffffff'
  secondary-container: '#2170e4'
  on-secondary-container: '#fefcff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-page: 40px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
  stack-xl: 48px
---

## Brand & Style
The design system is engineered for a premium fintech experience, prioritizing clarity, trust, and effortless financial coordination. The brand personality is **Professional, Precise, and Reassuring**. It aims to reduce the friction of shared financial responsibilities through a highly structured, minimalist aesthetic.

The visual style follows a **Modern Corporate Minimalism** approach. It utilizes expansive whitespace to prevent information density from becoming overwhelming, paired with subtle depth cues to guide the user's focus. The interface should feel "expensive" through its restraint—relying on perfect alignment, generous hit areas, and a refined color palette rather than decorative flourishes.

## Colors
The palette is rooted in high-contrast professional tones. 
- **Primary (#0F172A):** A deep slate blue used for headings, primary navigation, and high-emphasis text to establish authority.
- **Secondary (#3B82F6):** A clean, vibrant blue dedicated to primary actions, interactive states, and progress indicators.
- **Success/Tertiary (#10B981):** A "Fintech Green" specifically reserved for positive balances, successful transactions, and settled debts.
- **Neutral/Surface:** A range of grays from `#F8FAFC` (page background) to `#FFFFFF` (content cards), ensuring a clear separation between the canvas and the data.
- **Error (#EF4444):** A critical red for overdue payments and negative balance alerts.

## Typography
This design system utilizes **Inter** as the primary typeface for its exceptional legibility and neutral, systematic feel. It scales effortlessly from complex data tables to large dashboard headers. 

To introduce a technical, fintech-oriented "utility" feel, **JetBrains Mono** is used sparingly for monospaced data such as currency amounts, transaction IDs, and timestamps. This distinction helps users quickly scan numerical values versus descriptive text. Headlines should use tighter letter-spacing to maintain a "tight" professional look, while body text remains at default tracking for maximum readability.

## Layout & Spacing
The layout follows a **Fluid Grid** model with a maximum content width of 1280px. 
- **Desktop:** A 12-column grid with 24px gutters. Dashboard cards typically span 3, 4, or 6 columns depending on the data complexity.
- **Tablet:** 8-column grid with 16px margins.
- **Mobile:** 4-column grid with 16px margins.

Spacing follows an 8px base unit. Use "Stack" spacing (vertical) to group related information—8px for related items (label + input), 24px for separate sections within a card, and 48px for major page sections. Navigation is desktop-first, utilizing a persistent left-hand sidebar (280px) that collapses into a bottom bar or hamburger menu on mobile.

## Elevation & Depth
Elevation is handled through **Tonal Layers** and extremely soft, large-radius shadows. We avoid heavy borders in favor of subtle depth to indicate interactivity and hierarchy.

- **Level 0 (Background):** `#F8FAFC`. The canvas on which all elements sit.
- **Level 1 (Default Card):** `#FFFFFF` with a 1px border of `#E2E8F0`. No shadow. Used for standard data sections.
- **Level 2 (Active/Hover):** White surface with a 10% opacity shadow (0px 4px 20px). Used for interactive dashboard widgets and focused inputs.
- **Level 3 (Modals/Dropdowns):** White surface with a 15% opacity shadow (0px 10px 30px). These elements sit "closest" to the user and utilize a subtle backdrop blur on the layer beneath them.

## Shapes
The design system employs a **Rounded** shape language to soften the "coldness" of financial data while maintaining a professional structure. 
- **Small Elements (Checkboxes, Tags):** 0.25rem (4px)
- **Standard Elements (Buttons, Inputs):** 0.5rem (8px)
- **Large Elements (Cards, Modals):** 1rem (16px)

Buttons should never be fully pill-shaped; they maintain a 0.5rem radius to align with the systematic, architectural feel of the SaaS platform.

## Components
- **Buttons:** Primary buttons use a solid `#3B82F6` background with white text. Secondary buttons use a transparent background with a `#E2E8F0` border and `#0F172A` text.
- **Dashboard Cards:** Must include a padding of `24px`. Titles are `headline-sm`. Footers (if any) are separated by a 1px subtle divider.
- **Data Tables:** Clean, no vertical lines. Header row is `#F8FAFC` with `label-sm` text. Rows have a 1px bottom border. Hover states on rows use a 5% blue tint.
- **Chips/Status:** Used for "Paid," "Pending," or "Overdue." These use a light-tinted background (10% opacity of the status color) with high-contrast text of the same hue.
- **Input Fields:** 48px height for standard inputs. Labels are `body-sm` (Medium weight). Focus state is indicated by a 2px `#3B82F6` ring.
- **Expense Splitter Component:** A unique list item showing a user's avatar, their total share, and a slider or input for manual adjustment. 
- **Balance Metrics:** Large `display-lg` numbers for main dashboard "You are owed" or "You owe" figures, utilizing the Success and Error color tokens respectively.