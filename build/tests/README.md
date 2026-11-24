# Homepage animation tests

`anim_test.js` runs 53 Playwright checks (hero slider, floating decor, scroll reveal, every hover state,
Ollie tips, back-to-top, sticky header, gallery lightbox, mobile and reduced-motion behaviour) against a
local replica of the live homepage: the WP Super Cache HTML plus the site's real CSS/JS files mirrored under
`<replica>/site/`, with images replaced by a placeholder.

    node build/tests/anim_test.js <replica-dir>
