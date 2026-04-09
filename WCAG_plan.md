# WCAG 2.2 Accessibility Plan for Grammar Golf

This document outlines the steps required to make the Grammar Golf application compliant with WCAG 2.2 (Web Content Accessibility Guidelines) Level AA. The application relies heavily on dynamic DOM generation, custom SVG graphics, and drag-and-drop interactions, requiring specific accessibility strategies.

## 1. Global Document & Semantic Structure (Level A & AA) - ✅ COMPLETED
Currently, `index.html` lacks basic semantic structure and required attributes.

*   **Language Attribute:** The `<html>` tag must have a `lang` attribute (e.g., `<html lang="en">`) so screen readers can use the correct pronunciation rules.
*   **Page Title:** The `<title>` element must dynamically update to describe the current state or "hole" of the application (e.g., "Hole 1 - Grammar Golf"). *(WCAG 2.4.2)*
*   **Landmarks:** Replace generic `<div>` containers with semantic HTML5 landmarks. For example, change `<div id="stage">` to `<main id="stage">` and `<div id="menu">` to `<nav id="menu">`. This allows assistive technologies to navigate the page structure efficiently. *(WCAG 1.3.1)*

## 2. Keyboard Navigation & Focus Appearance (Level A & AA) - ✅ COMPLETED
Many interactive elements in the application are constructed from standard `<div>` or `<svg>` tags, which are not natively focusable or operable via keyboard.

*   **Tabindex:** Any custom interactive element (words, SVG nodes, custom menu buttons) needs `tabindex="0"` added when it is created in JavaScript. This allows users to navigate to these elements using the `Tab` key.
*   **Focus Visibility:** WCAG 2.2 has strict rules on focus appearance (2.4.11-2.4.13). CSS rules must be added (e.g., `.wordContainer:focus-visible { outline: 2px solid #005fcc; outline-offset: 2px; }`) so keyboard users can clearly see which element currently has focus.
*   **Keyboard Event Listeners:** Interactions currently rely heavily on mouse events (`click`, `mousedown`, `drag`). You must attach `'keydown'` event listeners to focusable elements. Pressing `Enter` or `Space` must trigger the same action as a mouse click.

## 3. Target Size (WCAG 2.2 - Level AA)
Success Criterion 2.5.8 requires that interactive targets be at least 24 by 24 CSS pixels to accommodate users with limited dexterity.

*   **Interactive Elements:** Ensure that all clickable words, letters, SVG nodes, and lines generated in `golf.js` meet this minimum size requirement.
*   **Close Buttons:** Dynamically created buttons, such as the remove button (`&times;`), must have adequate padding or minimum dimensions to hit the 24x24px target area.

## 4. Custom Controls & ARIA (Level A)
Custom controls that behave like native form elements need appropriate ARIA (Accessible Rich Internet Applications) attributes to convey their role and state to screen readers.

*   **Roles and States:** For custom checkboxes (e.g., the element created with `role="checkbox"` in `golf.js`), ensure that the `aria-checked` attribute is dynamically toggled between `"true"` and `"false"` via JavaScript when the state changes.
*   **SVG Accessibility:** SVGs are ignored by screen readers by default.
    *   If the syntactic trees/lines in `#lineContainer` convey crucial structural information, provide a visually hidden text alternative (e.g., a `.sr-only` span) that describes the relationships (e.g., "Subject noun phrase connected to verb phrase").
    *   If they are purely decorative, they should be explicitly hidden using `aria-hidden="true"`.

## 5. Dragging Movements (WCAG 2.2 - Level AA)
This is a critical new rule in WCAG 2.2 (Success Criterion 2.5.7). Any action requiring dragging must have a "single-pointer alternative".

*   **Dragula.js Alternative:** Currently, `dragula` requires users to click, hold, and drag elements (like syntactic labels). To comply, users must be able to accomplish the exact same task using simple clicks or taps.
*   **Implementation Strategy:** Add an alternative interaction mode. A user should be able to click a label to "select" it (highlighting it visually), and then click the target word or node to "drop" or apply it.

## 6. Dynamic Updates & Error Messages (Level AA)
When the DOM updates dynamically (e.g., upon completing a task, making a mistake, or changing levels), visually impaired users must be informed of the change.

*   **ARIA Live Regions:** Implement an `aria-live="polite"` region in the DOM. When an action occurs (like grading an answer in `grading.js` or `golf.js`), update the text content of this region to announce the result (e.g., "Correct! Advancing to the next hole." or "Incorrect. Try again.").
*   **Dialog Modals:** When opening custom `<dialog>` elements, ensure that JavaScript programmatically moves focus *into* the dialog, and traps the focus inside it until the dialog is explicitly closed or dismissed. When closed, focus should return to the element that triggered the dialog.