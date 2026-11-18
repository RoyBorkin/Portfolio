# DESIGN — Roy Borkin portfolio

One world: the **product presentation board**. Each project is a short run of slides in one continuous deck. There are no project pages to click into.

1. **Hero:** the object on a studio-grey sweep, the hook, a green-square **Detail**, and a white line drawing of *another* view (a traced angle, a sketch or a technical drawing) carrying the callouts. Arrows never sit on the hero object.
2. **Process:** photos, sketches and prototypes in a mosaic, with two or three sentences of story.
3. **Full photo** (optional): edge to edge, caption in the corner.

## Color
| Token | Hex | Use |
|---|---|---|
| studio | #E3E4E6 | ground |
| sweep | #F3F3F4 | light on the sweep |
| floor | #C8CBCF | sweep edge; the line drawings sit here so white lines read |
| ink | #17181A | text, names, leaders |
| graphite | #55585E | secondary text |
| paper | #FFFFFF | numerals, line drawings, chips (decorative, never body text) |
| signal | #1E9E5A | the one accent: Detail / fact squares |

No frame and no drop shadows. Objects sit directly on the sweep.

## Type
Outfit 300–800 (self-hosted). Hook 700, name 800 uppercase, numerals 600 white, labels 400, body 300.

## Five compositions (the object's proportion decides)
| | When | Object | Story | Drawing (callout side) | Name |
|---|---|---|---|---|---|
| A | tall object | right of centre | top-left | bottom-left (labels right) | bottom-right |
| B | tall object, to vary rhythm after A | left third | middle-right | bottom-centre | top-right |
| C | wide object | low, across the sheet | top-left | top-right (labels left) | bottom-right |
| D | square or compact | centred | bottom-left, Detail top-left | right (labels left) | bottom-right |
| E | flat art or a screen | left half | right | stack list | top-right |

Wide drawings (ratio > 1.45) take their labels in a row above and below, each over its part. Process mosaics place pictures by shape: the tallest takes the tall cell and the widest the wide cell. Every second process slide is mirrored.

## Motion: each slide performs once, when it arrives
Numeral and name rise out of a mask (700–850 ms, staggered lines). Story fades up. The object rises and settles (1.1 s ease-out), and the cover illustration swings in with a slight overshoot. The Detail wipes up from the bottom while its photo settles from 1.18×. The line drawing traces itself (SVG stroke) or wipes in (sketches), then leaders draw and labels appear one by one. Process pictures stagger in (90 ms) and settle from 1.08×. Full photos settle from 1.1× over 2.4 s. Videos play muted in view. Press feedback is 0.97. Reduced motion: everything is shown at once.

## Mobile (≤ 860 px)
Each slide becomes a scrolling sheet. Callouts become numbered dots on the drawing with a numbered key. The version switch moves to a bottom bar.
