# Part 1 feedback alignment

The user supplied cropped toast, confirmation, idle and saving references on 2026-11-15, then explicitly kept this correction to Part 1. The full-resolution toast and confirmation references already exist as `../prompts/ui-patterns-ref/ref-1-unsaved-toasts.png` and `ref-2-delete-reason.png`. Idle and saving implementation is unchanged.

The previous implementation used boxed dismiss controls, a prominent Dismiss all toolbar, square icon tiles, near-black supporting copy, a redundant confirmation header Close button, a large dialog and a black-on-red destructive action. Those differ visibly from the supplied design.

## Evidence and scoped tokens

Raster coordinates below are in the original 1440 × 940 PNGs. Colors were read using System.Drawing.Bitmap.GetPixel, counted without resizing. A measured sample is not proof of the original CSS. Typography, geometry and shadow remain estimates fitted to the images; the existing Arial/Helvetica font family is retained.

| Scoped token | Value | Evidence |
|---|---|---|
| Feedback surface | `#FFFFFF` | Toast rectangle (1040,75)–(1405,145): 21,850 exact white pixels. |
| Toast title | `#202335` | Title rectangle (1097,88)–(1230,103): 127 exact dark glyph pixels. |
| Modal title | `#16192C` | Modal title rectangle (555,323)–(810,344): 699 exact glyph pixels. |
| Supporting text | `#646B7F` | Toast message rectangle (1097,106)–(1370,136): 26 exact glyph pixels. Provisional representative fill, because antialiased glyph colors vary. |
| Success icon backing | `#ECFDF3` | Icon rectangle (1050,86)–(1085,122): 761 exact pixels. |
| Error icon backing | `#FEF3F2` | Icon rectangle (1050,178)–(1085,213): 673 exact pixels. |
| Success icon | `#20BA72` | Four exact green glyph pixels in the success icon rectangle. Low-confidence representative accent. |
| Destructive button/error copy | `#D92D20` | Delete button rectangle (828,591)–(929,628): 3,248 pixels. Error-copy rectangle (510,544)–(830,559): 336 pixels. |
| Divider/border | `#E7E4F2` | Footer edge rectangle (500,574)–(940,577): 440 exact pixels. |

The `--iam-feedback-*`, `--iam-toast-*` and `--iam-dialog-*` tokens live in `src/design/tokens.css`. They do not replace the existing shell/grid/form colors. Dark feedback colors are documented provisional mappings because the supplied images are light-theme only. Error copy uses a separate accessible dark counterpart; the destructive button retains white text on the sampled red.

## Composition

- Toast: estimated 380px width, 13px vertical/14px horizontal padding, 34px circular icon, 12px column gaps, 14px bold title, 14px muted copy, plain 28px close target with an 18px X. Each message has its own close control; no Dismiss all toolbar above the stack. Existing service `dismissAll()` remains available.
- Confirmation: estimated 460px width, 20px corners/insets, icon/title header, muted description, 90px reason field and plain red validation beneath it. A divider separates the body from a right-aligned Cancel/Delete footer. Cancel remains text-only as shown in the supplied reference; Delete uses a trash icon and white text on red. Esc/backdrop cancellation, focus containment/return and busy safeguards remain.
- Invalid input keeps the action verb (Delete/Confirm). Retry appears only after an asynchronous operation fails. This prevents a required-field error from changing the meaning of the primary action.
- Shared `SmartFormField` wraps the dialog's native reactive reason textarea, so validation is rendered exactly once and remains associated through `aria-describedby`. Generic form control styling is unchanged.

Screenshot tests use the reference's actual copy through the existing shared services, not a replacement static mockup or a page redesign. They also retain the existing desktop/mobile, dark, overflow and keyboard checks. New captures are regression evidence, not a claim of pixel equality with the original artwork.
