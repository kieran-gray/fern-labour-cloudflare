# Fern Labour Design System

A warm, nurturing design language for expecting mothers and their support circles.

## Color Palette

### Primary Colors
- **Primary (Coral/Pink)**: `--mantine-color-pink-*` - Used for primary buttons and interactive highlights
- **Accent (Teal)**: `#24968b` - Used for labels, icons, selection states, and informational elements

### Neutral Colors
| Usage | Light Mode | Dark Mode |
|-------|-----------|-----------|
| Card background | `gray-0` | `dark-2` (#282828) |
| Card hover | `white` | `dark-3` (#333333) |
| Borders | `gray-2` | `dark-4` (#3f3f3f) |
| Border hover | `gray-3` | `dark-5` (#4b4b4b) |
| Subtle text | `gray-6` | `gray-4` |

### Semantic Colors
- **Pending/Attention**: Amber border `#e9a84a` (light) / `#b8860b` (dark)
- **Role - Birth Partner**: `pink`
- **Role - Support Person**: `violet`
- **Role - Loved One**: `blue`

## Typography

- **Headings**: Poppins, semi-bold (600)
- **Body**: Quicksand
- **Labels**: Uppercase, `letter-spacing: 0.04-0.05em`, teal color, font-weight 600

## Component Patterns

### Stat Cards
```css
background-color: light-dark(gray-0, dark-2);
border: 1px solid light-dark(gray-2, dark-4);
border-radius: var(--mantine-radius-md);
```
- Teal uppercase labels with icons
- Subtle hover state (lighter background, slightly darker border)

### Subscriber/List Cards
```css
background-color: light-dark(gray-0, dark-2);
border: 1px solid light-dark(gray-2, dark-4);
border-radius: var(--mantine-radius-lg);
padding: var(--mantine-spacing-md);
```
- Avatar + name + role badge layout
- Action buttons/menus on the right

### Pending/Attention Sections
```css
background-color: light-dark(#fffbf5, dark-2);
border: 2px solid light-dark(#e9a84a, #b8860b);
```
- Warm amber border to draw attention without alarm
- Used for pending requests, notifications needing action

### Collapsible Sections
- Used for de-emphasized content (e.g., blocked users)
- Toggle button with chevron icon
- Border-top separator from main content

### Selection Cards (e.g., role picker)
```css
border: 2px solid light-dark(gray-2, dark-4);
/* Selected state */
border-color: #24968b;
background-color: light-dark(#f0faf9, dark-4);
```
- Teal border and check indicator when selected
- Icon wrapper changes to teal on selection

## Interactive States

### Hover
- Cards: Lighten background, darken border slightly
- Buttons: Use Mantine defaults

### Selected
- Teal border (`#24968b`)
- Teal check circle with white checkmark
- Subtle teal background tint

### Disabled
- Reduced opacity or use Mantine defaults

## Dark Mode Guidelines

1. **Never use `dark-6` or higher** for backgrounds - they're too light in this theme
2. **Use `dark-2`** for card backgrounds, **`dark-3`** for hover states
3. **Use `dark-4`** for borders, **`dark-5`** for hover borders
4. **Avoid `c="dimmed"`** - use explicit CSS classes with `gray-4` for subtle text
5. **Test amber/gold colors** - ensure they're visible against dark backgrounds

## Spacing

- Use Mantine spacing variables: `xs`, `sm`, `md`, `lg`, `xl`
- Cards: `padding: var(--mantine-spacing-md)`
- Sections: `gap: var(--mantine-spacing-lg)` or `xl`
- Compact rows: `padding: var(--mantine-spacing-xs) var(--mantine-spacing-sm)`

## Border Radius

- Cards: `var(--mantine-radius-lg)`
- Inner elements: `var(--mantine-radius-md)`
- Buttons: `radius="xl"` or `radius="lg"`
- Badges/pills: `var(--mantine-radius-sm)`
