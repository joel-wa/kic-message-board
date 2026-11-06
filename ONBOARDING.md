# Local onboarding implementation

The first visit uses real app actions: welcome → coloring → preview a resting spot → confirm placement → first speech bubble → optional Food → optional Bubble bomb.

An animal is never POSTed by tapping water alone. Water taps select a preview; the explicit Place button saves it. Arrow keys select a preview and Enter focuses the confirmation button. Crowded spots stay disabled. Failed requests keep the preview and the local draft.

Ready-to-place drafts use `pond-draft-v1` in localStorage. Guide progress uses `pond-guide-v1`. My animals contains both draft recovery and a Pond guide replay button. Returning visitors with an animal are not forced through the guide. Food and bomb stages advance only after their API request succeeds. Polling does not replace focused guide controls.

The guide uses `onboarding.js` and `onboarding.css`. Guide progress and unplaced drafts stay in the visitor’s browser; confirmed animals use the server’s durable Supabase storage.

## Pointing hand artwork

Built-in ImageGen created the pointing-finger artwork. The original green-screen PNG is retained in `art-sources/guide-pointer-source.png`; `prepare-guide-pointer.cjs` keys the green, removes isolated background specks, and writes the transparent runtime cutout to `public/art/ui-guide-pointer.png`. No UI glyph or hand was drawn procedurally. Tap rings and gentle motion are CSS, with reduced-motion support.

Final generation prompt:

> Use case: ui-mockup asset / illustration. Generate ONE isolated pointing-finger guide hand for Pop Pond, a warm handmade community pond game. This is a reusable UI cutout asset, not a screenshot or complete interface. Center a single friendly small right hand in a clear index-finger pointing gesture: index finger straight upward and slightly toward upper left, other three fingers curled gently into the palm, thumb resting across curled fingers, short rounded wrist cuff below. The index fingertip must be the highest point so it can indicate exactly where to tap. Soft natural rounded proportions, no realism or detailed anatomy. Cream / pale butter-yellow paper fill with subtle colored-pencil grain and small hatching; imperfect medium-dark olive-green pencil outline, 2–3 loose overlapping pencil strokes. Match a charming colored-pencil and watercolor children's doodle app, not clean vector clipart, emoji, plastic glove or glossy 3D. No face, jewelry, text, tap rings, sparkles, water or other objects. Enough negative space around the whole hand; nothing cropped. Background MUST be perfectly uniform pure chroma green #00FF00 across the entire canvas, with no gradients, shadows, texture or green reflected light. No green inside the hand, use dark OLIVE outline and warm cream fill with yellowish shading so the solid pure green background can be keyed out cleanly. The hand alone, front palm side visible, pointing index finger distinctly different from an open-palm five-finger hand. High quality elegant pencil texture; simple readable silhouette at 50-pixel display size.

## Verification

- `check-onboarding.cjs`: full mobile journey, preview-only water taps, local draft reload/recovery, first message, action-driven toys, dismiss/replay, responsive layout, focus stability.
- `check-webkit-onboarding.cjs`: the journey in Safari's rendering engine.
- `check-onboarding-edge.cjs`: crowded targets, keyboard placement, failed save/retry, back to coloring, reduced motion and leaving a preview safely.
- Existing resting-spot, shared-bomb, fill and Node tests check returning-user behavior and server persistence.
