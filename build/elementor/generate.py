#!/usr/bin/env python3
"""Generate Elementor (v3 container) data for the Reading Teacher Online homepage,
UAE header and UAE footer from the approved "Reading Teacher 3" design.

Content, images, links, colours and typography are set as Elementor settings so they stay
editable; responsive spacing, effects and animations live in the child theme (build/child-theme).
Run:  python3 build/elementor/generate.py  -> writes home.json, header.json, footer.json
"""
import json
import os
import random

random.seed(20261124)
OUT = os.path.dirname(os.path.abspath(__file__))
UP = "https://readingteacheronline.wsdfy.com/wp-content/uploads/2026/11/"

MEDIA = {
    "logo": (8, "rto-logo.webp"), "marilyn": (9, "marilyn-portrait.webp"),
    "blog1": (10, "blog-why-reading-matters.webp"),
    "sun": (11, "illus-sun.webp"), "rainbow": (12, "illus-rainbow.webp"), "owl": (13, "illus-owl.webp"),
    "laptop": (14, "illus-laptop.webp"), "bear": (15, "illus-bear.webp"), "books": (16, "illus-books.webp"),
    "abc": (17, "illus-abc.webp"), "pencil": (18, "illus-pencil.webp"), "grad": (19, "illus-grad.webp"),
    "p8317829": (20, "reading-hero-1-pexels-8317829.webp"), "p6972770": (21, "reading-hero-2-pexels-6972770.webp"),
    "p4908526": (22, "reading-hero-3-pexels-4908526.webp"), "p5303549": (23, "reading-photo-pexels-5303549.webp"),
    "p8065063": (24, "reading-photo-pexels-8065063.webp"), "p8055848": (25, "reading-photo-pexels-8055848.webp"),
    "p5692247": (26, "reading-photo-pexels-5692247.webp"), "p6972642": (27, "reading-photo-pexels-6972642.webp"),
    "p8317826": (28, "reading-photo-pexels-8317826.webp"), "p4908531": (29, "reading-photo-pexels-4908531.webp"),
    "p6972648": (30, "reading-photo-pexels-6972648.webp"), "p8613089": (31, "reading-photo-pexels-8613089.webp"),
    "dyslexia": (32, "blog-understanding-dyslexia.webp"),
    "d_book": (38, "decor-book-white.webp"), "d_plane": (39, "decor-plane-yellow.webp"),
    "d_star": (40, "decor-star-yellow.webp"), "d_heart_w": (41, "decor-heart-white.webp"),
    "d_heart_p": (42, "decor-heart-pink.webp"),
}

INK, NAVY, TEAL, BODY, BODY2, YELLOW = "#1E2A4A", "#173B4C", "#00727E", "#5B6478", "#3F5866", "#FFC94A"
FONT = "Nunito"


def uid():
    return "%07x" % random.getrandbits(28)


def img(key):
    i, f = MEDIA[key]
    return {"id": i, "url": UP + f, "source": "library"}


def px(n):
    return {"unit": "px", "size": n, "sizes": []}


def custom(v):
    return {"unit": "custom", "size": v, "sizes": []}


def dims(t, r=None, b=None, l=None, unit="px"):
    r = t if r is None else r
    b = t if b is None else b
    l = r if l is None else l
    return {"unit": unit, "top": str(t), "right": str(r), "bottom": str(b), "left": str(l),
            "isLinked": t == r == b == l}


def typo(prefix, size=None, weight=None, lh=None, family=FONT, extra=None):
    s = {prefix + "typography_typography": "custom", prefix + "typography_font_family": family}
    if size is not None:
        s[prefix + "typography_font_size"] = custom(size) if isinstance(size, str) else px(size)
    if weight:
        s[prefix + "typography_font_weight"] = str(weight)
    if lh is not None:
        s[prefix + "typography_line_height"] = {"unit": "em", "size": lh, "sizes": []}
    if extra:
        s.update(extra)
    return s


def con(children=None, css="", direction="column", gap=0, pad=0, title=None, **kw):
    s = {"content_width": "full", "flex_direction": direction,
         "flex_gap": {"unit": "px", "size": gap, "column": str(gap), "row": str(gap), "isLinked": True}}
    if pad is not None:
        s["padding"] = dims(pad) if isinstance(pad, (int, float)) else pad
    if css:
        s["css_classes"] = css
    if title:
        s["_title"] = title
    s.update(kw)
    return {"id": uid(), "elType": "container", "isInner": False, "settings": s, "elements": children or []}


def section(children, css, **kw):
    # responsive padding comes from .rto-section in the child theme
    s = con(children, css="rto-section " + css, pad=None, **kw)
    s["settings"].setdefault("html_tag", "section")
    return s


def grid(children, cols, css="", gap=0, row_gap=None, cols_tablet=None, cols_mobile=None, pad=0, **kw):
    rg = gap if row_gap is None else row_gap
    c = cols if isinstance(cols, dict) else custom(cols)
    s = {"container_type": "grid", "content_width": "full",
         "grid_columns_grid": c,
         "grid_columns_grid_tablet": cols_tablet or c,
         "grid_columns_grid_mobile": cols_mobile or c,
         "grid_rows_grid": custom("auto"),
         "grid_rows_grid_tablet": custom("auto"),
         "grid_rows_grid_mobile": custom("auto"),
         "grid_gaps": {"unit": "px", "column": str(gap), "row": str(rg), "isLinked": gap == rg},
         "grid_gaps_tablet": {"unit": "px", "column": str(gap), "row": str(rg), "isLinked": gap == rg},
         "grid_gaps_mobile": {"unit": "px", "column": str(gap), "row": str(rg), "isLinked": gap == rg}}
    if pad is not None:
        s["padding"] = dims(pad)
    if css:
        s["css_classes"] = css
    s.update(kw)
    return {"id": uid(), "elType": "container", "isInner": False, "settings": s, "elements": children}


def widget(wtype, settings, css=""):
    if css:
        settings["_css_classes"] = css
    return {"id": uid(), "elType": "widget", "widgetType": wtype, "settings": settings, "elements": []}


def heading(text, tag="h2", size=None, weight=800, color=INK, align=None, lh=None, css="", link=None, **kw):
    s = {"title": text, "header_size": tag, "title_color": color}
    s.update(typo("", size, weight, lh))
    if align:
        s["align"] = align
    if link:
        s["link"] = {"url": link, "is_external": "", "nofollow": ""}
    s.update(kw)
    return widget("heading", s, css)


def text(html, size=16, color=BODY, lh=1.8, align=None, css="", weight=None, **kw):
    s = {"editor": html, "text_color": color}
    s.update(typo("", size, weight, lh))
    if align:
        s["align"] = align
    s.update(kw)
    return widget("text-editor", s, css)


def image(key, size="full", css="", alt=None, link=None, **kw):
    s = {"image": img(key), "image_size": size}
    if link:
        s["link_to"] = "custom"
        s["link"] = {"url": link, "is_external": "", "nofollow": ""}
    s.update(kw)
    return widget("image", s, css)


def decor(key, width, h, x, v, y, anim="rto-bob"):
    """Absolutely positioned decorative illustration (Elementor Advanced > Position)."""
    s = {"image": img(key), "image_size": "full",
         "_position": "absolute", "_element_width": "initial", "_element_custom_width": px(width),
         "_offset_orientation_h": h, "_offset_orientation_v": v, "_z_index": 0}
    s["_offset_x" if h == "start" else "_offset_x_end"] = x
    s["_offset_y" if v == "start" else "_offset_y_end"] = y
    return widget("image", s, "rto-decor " + anim)


def pct(n):
    return {"unit": "%", "size": n, "sizes": []}


def button(label, link, bg, ring=None, color="#fff", css="rto-btn", align="center"):
    ring = ring or bg
    s = {"text": label, "link": {"url": link, "is_external": "", "nofollow": ""}, "align": align,
         "background_background": "classic", "background_color": bg, "button_text_color": color,
         "hover_color": "#FFFFFF", "button_background_hover_background": "classic",
         "button_background_hover_color": NAVY,
         "border_border": "dashed", "border_width": dims(2), "border_color": "rgba(255,255,255,0.95)",
         "border_radius": dims(999), "text_padding": dims(14, 34),
         "button_box_shadow_box_shadow_type": "yes",
         "button_box_shadow_box_shadow": {"horizontal": 0, "vertical": 0, "blur": 0, "spread": 4, "color": ring},
         "button_hover_box_shadow_box_shadow_type": "yes",
         "button_hover_box_shadow_box_shadow": {"horizontal": 0, "vertical": 0, "blur": 0, "spread": 4, "color": NAVY}}
    s.update(typo("", 16, 800, 1.2))
    return widget("button", s, css)


def section_head(title, intro):
    return con([
        heading(title, "h2", "clamp(30px,3.6vw,44px)", 800, INK, "center", 1.15),
        text("<p>%s</p>" % intro, 16, BODY, 1.8, "center"),
    ], css="rto-head", gap=14, flex_align_items="center")


# ---------------------------------------------------------------------------
# HOMEPAGE
# ---------------------------------------------------------------------------
HERO = [
    ("p8317829", "Helping Parents Become Confident <span class=\"hl\">Reading Tutors</span>",
     "I'm a qualified and experienced literacy teacher, and I love helping children and adults become more confident readers."),
    ("p6972770", "Is Your Child Struggling with <span class=\"hl\">Reading?</span>",
     "Whether your child is just beginning to read, finding reading difficult, or you're an adult wanting to improve your English reading skills, I'm here to help."),
    ("p4908526", "Reading Builds <span class=\"hl\">Independence.</span>",
     "Through structured, step-by-step lessons and personal online support, I help learners develop their reading skills, understanding and confidence."),
]


def hero():
    slides = []
    for i, (k, title, body) in enumerate(HERO):
        slides.append(con([
            image(k, "full", "rto-slide-bg"),
            con([
                heading(title, "h1" if i == 0 else "h2", "clamp(38px,5.4vw,72px)", 800, "#FFFFFF", "center", 1.08,
                        css="rto-hero-title"),
                text("<p>%s</p>" % body, 17, "#FFFFFF", 1.75, "center", css="rto-hero-text"),
                button("View More", "#services", TEAL, css="rto-btn rto-hero-cta"),
            ], css="rto-slide-inner", gap=22, pad=None, flex_justify_content="center", flex_align_items="center"),
        ], css="rto-slide", title="Hero slide %d" % (i + 1)))
    decor_items = [
        decor("d_book", 64, "start", pct(6), "end", pct(16)),
        decor("d_plane", 56, "start", pct(10), "start", pct(22)),
        decor("d_star", 50, "end", pct(9), "end", pct(20), "rto-spin"),
        decor("d_heart_w", 46, "end", pct(12), "start", pct(18)),
    ]
    return con(slides + decor_items, css="rto-hero", pad=None, title="Hero slider", _element_id="top", html_tag="section")


def offer_card(key, label, bg, bar):
    return con([
        image(key, "large", "rto-card-img"),
        heading(label, "h3", "clamp(20px,2.2vw,28px)", 800, "#FFFFFF", "center", 1.2, css="rto-offer-title",
                _background_background="classic", _background_color=bar, _padding=dims(22)),
    ], css="rto-offer-card", html_tag="a", link={"url": "#services", "is_external": "", "nofollow": ""},
        background_background="classic", background_color=bg)


def what_we_offer():
    inner = con([
        section_head("What We Offer", "I'm a qualified and experienced literacy teacher, and I love helping children and adults become more confident readers."),
        grid([offer_card("p8317829", "Parents &amp; Grandparents", "#39A0DA", "#2F8CC4"),
              offer_card("p5303549", "Online Reading Lessons", "#4FD1C5", "#3EB8AD")],
             "repeat(auto-fit,minmax(min(100%,320px),1fr))", gap=30),
        button("Learn More", "#services", "#E24D7A"),
    ], css="rto-inner", gap=44)
    return section([decor("sun", 70, "end", pct(6), "start", px(40), "rto-spin"), inner],
                   "rto-offer", title="What We Offer", _element_id="about")


def prog_card(key, badge, badge_bg, card_bg, title, body, link_color):
    return con([
        image(key, "medium_large", "rto-prog-img"),
        heading(badge, "span", 13, 800, "#FFFFFF", "center", 1.2, css="rto-badge",
                _background_background="classic", _background_color=badge_bg, _padding=dims(9, 16),
                _border_border="solid", _border_width=dims(4), _border_color=card_bg, _border_radius=dims(999)),
        con([
            heading(title, "h3", 24, 800, NAVY, "center", 1.25),
            text("<p>%s</p>" % body, 15, BODY2, 1.65, "center"),
            heading("Find out more&nbsp;→", "p", 16, 800, link_color, "center", 1.3, css="rto-more", link="#contact"),
        ], gap=10, pad=dims(16, 26, 0), flex_align_items="center"),
    ], css="rto-prog-card", html_tag="article", background_background="classic", background_color=card_bg,
        padding=dims(0, 0, 28, 0))


def reading_programs():
    cards = grid([
        prog_card("p6972770", "Beginning Skills", "#E0A800", "#FFF1C9", "For a Child Learning to Read",
                  "Build the foundations of reading through recognising letters, understanding sounds and learning to read simple words.", "#E0A800"),
        prog_card("p8065063", "Consolidating Skills", TEAL, "#DDF1EC", "For Children Who Find Reading Difficult",
                  "Strengthen essential reading and spelling skills through patient, step-by-step teaching that builds confidence and fluency.", TEAL),
        prog_card("p8055848", "Advanced Skills", "#2F6E9E", "#DCEBF6", "For Older Learners and Adults",
                  "Develop reading accuracy, fluency, vocabulary and comprehension skills, including support for adults learning English.", "#2F6E9E"),
    ], "repeat(auto-fit,minmax(min(100%,220px),1fr))", gap=30)
    inner = con([
        section_head("Reading Programs", "Through structured, step-by-step lessons and personal online support, I help learners develop their reading skills, understanding and confidence."),
        cards,
    ], css="rto-inner", gap=44)
    return section([
        decor("rainbow", 70, "start", pct(5), "start", px(60)),
        decor("owl", 70, "end", pct(5), "start", px(40)),
        decor("laptop", 80, "end", pct(2), "end", px(30)),
        inner], "rto-programs", title="Reading Programs", _element_id="services",
        background_background="classic", background_color="#FBF7F2")


def step(num, label, title, sub, bg, badge_bg, link, color="#FFFFFF"):
    return con([
        con([
            heading(num, "span", 17, 800, color, "center", 1),
            heading(label, "span", 11, 600, color, "center", 1),
        ], css="rto-step-badge", gap=3, flex_justify_content="center", flex_align_items="center",
            background_background="classic", background_color=badge_bg),
        con([
            heading(title, "h3", 17, 800, color, None, 1.3),
            text("<p>%s</p>" % sub, 13, color, 1.4),
        ], gap=4, flex_justify_content="center", _flex_size="grow"),
    ], css="rto-step", direction="row", gap=18, pad=dims(16, 22), flex_align_items="center", flex_wrap="nowrap",
        html_tag="a", link={"url": link, "is_external": "", "nofollow": ""},
        background_background="classic", background_color=bg)


def get_started():
    inner = con([
        section_head("Ways to Get Started", "Courses, books and free resources for learning at home."),
        grid([
            image("p4908526", "large", "rto-start-img"),
            con([
                step("01", "FREE", "Free Email Consultation", "Marilyn replies personally", "#F26A3D", "#D8552B", "#contact"),
                step("02", "FREE", "How to Teach Phonics at Home", "Free guide, no email needed", "#4FC79A", "#3BAF84", "#services"),
                step("03", "KIT", "Reading Program for Kids", "Course delivered by email", "#3C9BE0", "#2C84C6", "#services"),
                step("04", "BOOKS", "Books on Amazon", "Reading Program for Kids · Phonics for Kids", YELLOW, "#F0B42A", "#services", INK),
            ], css="rto-steps", gap=16),
        ], "repeat(auto-fit,minmax(min(100%,340px),1fr))", gap=48, grid_align_items="center"),
    ], css="rto-inner", gap=44)
    return section([
        decor("d_heart_p", 52, "start", pct(4), "start", px(80)),
        decor("bear", 70, "end", pct(4), "start", px(60)),
        inner], "rto-start", title="Ways to Get Started")


GALLERY = [("p8317829", "rto-g-big", "large"), ("p6972770", "", "medium_large"), ("p5692247", "", "medium_large"),
           ("p4908526", "rto-g-tall", "medium_large"), ("p8065063", "", "medium_large"), ("p6972642", "", "medium_large"),
           ("p8317826", "", "medium_large"), ("p4908531", "", "medium_large"), ("p5303549", "", "medium_large"),
           ("p6972648", "", "medium_large"), ("p8613089", "", "medium_large"), ("p8055848", "", "medium_large")]


def gallery():
    four = {"unit": "fr", "size": 4, "sizes": []}
    inner = con([
        con([section_head("Our Photo Gallery", "Reading together at home, one page at a time.")],
            pad=dims(0, 20)),
        grid([image(k, s, c, link_to="file", open_lightbox="yes") for k, c, s in GALLERY], four, "rto-gallery", gap=0),
    ], css="rto-inner rto-gallery-inner", gap=40)
    return section([
        decor("sun", 60, "start", pct(4), "start", px(20), "rto-spin"),
        decor("d_heart_p", 44, "end", pct(4), "start", px(30)),
        inner], "rto-gallery-section", title="Photo Gallery")


def post(key, cat, title, url):
    return con([
        image(key, "medium_large", "rto-post-img"),
        text("<p><span>%s</span><span>By Marilyn</span></p>" % cat, 13, TEAL, 1.4, css="rto-post-meta", weight=700),
        heading(title, "h3", 21, 800, INK, None, 1.3, css="rto-post-title"),
        text("<p>Read More →</p>", 14, TEAL, 1.4, weight=700),
    ], css="rto-post", gap=14, html_tag="a", link={"url": url, "is_external": "", "nofollow": ""})


def latest_media():
    inner = con([
        section_head("Our Latest Media", "Reading Matters: ideas and practical tips about reading, learning and education."),
        grid([
            post("blog1", "Featured", "Why Reading is a Big Deal for a Child's Brain",
                 "https://readingteacheronline.com.au/blog/why-reading-is-a-big-deal-for-a-childs-brain"),
            post("dyslexia", "Dyslexia", "Understanding Dyslexia: Beyond Reading and Writing",
                 "https://readingteacheronline.com.au/blog/understanding-dyslexia-beyond-reading-and-writing"),
            post("p8613089", "Learning", "It Is Never Too Late to Learn to Read",
                 "https://readingteacheronline.com.au/blog/it-is-never-too-late-to-learn-to-read"),
        ], "repeat(auto-fit,minmax(min(100%,260px),1fr))", gap=36),
    ], css="rto-inner", gap=44)
    return section([decor("sun", 56, "start", pct(12), "start", px(40), "rto-spin"), inner],
                   "rto-media", title="Latest Media", _element_id="blog")


def contact():
    contact_list = widget("icon-list", {
        "icon_list": [
            {"_id": uid(), "text": "marilyn@readingteacheronline.com.au",
             "selected_icon": {"value": "far fa-envelope", "library": "fa-regular"}},
            {"_id": uid(), "text": "Taylors Lakes, Melbourne, Victoria",
             "selected_icon": {"value": "fas fa-home", "library": "fa-solid"}},
            {"_id": uid(), "text": "Lessons held online",
             "selected_icon": {"value": "fas fa-star", "library": "fa-solid"}},
        ],
        "space_between": px(12), "icon_color": INK, "icon_size": px(15), "text_indent": px(12),
        "text_color": BODY2, **typo("icon_", 15, None, 1.5)}, "rto-contact-list")
    left = con([
        con([
            image("marilyn", "full", "rto-avatar"),
            con([
                heading("Not sure where to begin?", "p", 16, 800, TEAL, None, 1.3),
                heading("Request a free email consultation", "h2", "clamp(22px,2.3vw,30px)", 800, INK, None, 1.2),
            ], gap=10, flex_justify_content="center", _flex_size="custom", _flex_grow=1, _flex_shrink=1),
        ], direction="row", gap=26, flex_align_items="center", flex_wrap="wrap"),
        text("<p>Tell me a little about your reading needs or concerns. I'll reply personally with suggestions for the next step.</p>",
             16, BODY2, 1.75, css="rto-maxw-440"),
        contact_list,
    ], gap=18)
    right = con([
        heading("Send a message", "h3", 22, 800, INK, None, 1.3),
        widget("shortcode", {"shortcode": '[contact-form-7 id="33" title="Homepage – Free Email Consultation" html_class="rto-cf7"]'},
               "rto-cf7-wrap"),
    ], css="rto-form-card", gap=18, pad=None)
    inner = grid([left, right], "repeat(auto-fit,minmax(min(100%,380px),1fr))", "rto-inner", gap=72,
                  grid_align_items="center")
    return section([inner], "rto-contact", title="Contact", _element_id="contact")


def homepage():
    return [hero(), what_we_offer(), reading_programs(), get_started(), gallery(), latest_media(), contact()]


# ---------------------------------------------------------------------------
# HEADER (UAE)
# ---------------------------------------------------------------------------
TOPBAR_INFO = ('<p><a class="rto-tb-item rto-tb-email" href="mailto:marilyn@readingteacheronline.com.au">'
               '<svg class="rto-tb-ico" viewBox="0 0 24 24" aria-hidden="true">'
               '<rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>'
               '<path d="M3.5 6.5 12 13l8.5-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
               '<span class="rto-tb-text">marilyn@readingteacheronline.com.au</span></a>'
               '<span class="rto-tb-item rto-tb-loc"><svg class="rto-tb-ico" viewBox="0 0 24 24" aria-hidden="true">'
               '<path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" fill="none" stroke="currentColor" stroke-width="2" '
               'stroke-linecap="round" stroke-linejoin="round"/></svg>Taylors Lakes, Melbourne</span></p>')


def header():
    topbar = con([
        con([
            text(TOPBAR_INFO,
                 13, TEAL, 1.4, css="rto-topbar-info", weight=700),
            heading("Free weekly reading tips →", "p", 13, 700, TEAL, None, 1.4, link="#newsletter"),
        ], css="rto-inner", direction="row", gap=8, flex_justify_content="space-between", flex_align_items="center",
            flex_wrap="wrap", pad=dims(9, 0)),
    ], css="rto-topbar", pad=None, title="Top bar")
    brand = con([
        image("logo", "full", "rto-brand-logo", link="/", width=px(51), _title="Logo"),
        heading('Reading <span>Teacher</span>', "span", 22, 800, INK, None, 1, css="rto-wordmark", link="/"),
    ], css="rto-brand", direction="row", gap=10, flex_align_items="center", _flex_size="none")
    nav = widget("navigation-menu", {
        "menu": "primary-homepage", "layout": "horizontal", "dropdown": "mobile", "hamburger_align": "right", "dropdown_icon": {"value": "fas fa-bars", "library": "fa-solid"}, "dropdown_close_icon": {"value": "fas fa-times", "library": "fa-solid"}, "navmenu_align": "center",
        "color_menu_item": INK, "color_menu_item_hover": TEAL, "color_menu_item_active": INK,
        "padding_horizontal_menu_item": px(0), "padding_vertical_menu_item": px(4),
        "menu_space_between": custom("clamp(14px,2.6vw,40px)"), "menu_row_space": px(8),
        "pointer": "none", "_flex_size": "grow", **typo("menu_", 16, 800, 1.3)}, "rto-nav")
    cta = button("Free Consultation", "/#contact", "#FFFFFF", ring="#FFFFFF", color=TEAL, css="rto-header-cta")
    cta["settings"].update({"border_border": "solid", "border_color": TEAL, "border_width": dims(2),
                            "text_padding": dims(11, 26), "hover_color": "#FFFFFF",
                            "button_background_hover_color": TEAL,
                            "button_box_shadow_box_shadow_type": "", "button_hover_box_shadow_box_shadow_type": "",
                            **typo("", 15, 800, 1.2)})
    mainbar = con([
        con([brand, nav, cta], css="rto-inner", direction="row", gap=16, flex_justify_content="space-between",
            flex_align_items="center", flex_wrap="wrap", pad=dims(12, 0)),
    ], css="rto-mainbar", pad=None, title="Main header", background_background="classic",
        background_color="#FFFFFF")
    return [topbar, mainbar]


# ---------------------------------------------------------------------------
# FOOTER (UAE)
# ---------------------------------------------------------------------------
def link_list(items):
    return widget("icon-list", {
        "icon_list": [{"_id": uid(), "text": t, "link": {"url": u, "is_external": "", "nofollow": ""},
                       "selected_icon": {"value": "", "library": ""}} for t, u in items],
        "space_between": px(9), "text_color": BODY, "text_color_hover": TEAL, "text_indent": px(0),
        **typo("icon_", 14, None, 1.5)}, "rto-footer-links")


def footer():
    h4 = lambda t: heading(t, "h4", 18, 800, INK, None, 1.3, _margin=dims(0, 0, 6, 0))
    cols = grid([
        con([image("logo", "full", "rto-footer-logo", width=px(70)),
             text("<p>Helping parents and grandparents become confident reading tutors.</p>", 14, BODY, 1.7)], gap=12),
        con([h4("Programs"), link_list([("Beginning Skills", "/#services"), ("Consolidating Skills", "/#services"),
                                         ("Advanced Skills", "/#services")])], gap=9),
        con([h4("Useful Links"), link_list([("Home", "/"), ("About Us", "/#about"), ("Blog", "/#blog"),
                                             ("Contact", "/#contact")])], gap=9),
        con([h4("Newsletter"),
             text("<p>Subscribe for free weekly reading tips. I will not share your email.</p>", 14, BODY, 1.6),
             widget("shortcode", {"shortcode": '[contact-form-7 id="34" title="Footer – Newsletter signup" html_class="rto-newsletter"]'})],
            gap=10),
    ], "repeat(auto-fit,minmax(min(100%,170px),1fr))", "rto-footer-inner", gap=40, pad=None)
    strip = [("rainbow", 4, 18, 70), ("bear", 16, 26, 84), ("owl", 28, 34, 70), ("books", 40, 18, 84),
             ("abc", 52, 26, 70), ("pencil", 64, 34, 84), ("grad", 76, 18, 70), ("sun", 88, 26, 84)]
    items = []
    for k, x, b, w in strip:
        d = decor(k, w, "start", pct(x), "end", pct(b))
        d["settings"]["_element_custom_width"] = custom("clamp(44px,%dvw,%dpx)" % (5 if w == 70 else 6, w))
        items.append(d)
    landscape = con(items, css="rto-landscape", title="Illustration strip")
    copy = con([widget("copyright", {"shortcode": "Reading Teacher Online © [hfe_current_year]. All rights reserved.",
                                     "align": "center", "title_color": INK, **typo("caption_", 13, None, 1.5)})],
               css="rto-copy", pad=None)
    return [con([cols, landscape, copy], css="rto-footer", title="Footer", _element_id="newsletter")]


if __name__ == "__main__":
    for name, data in (("home", homepage()), ("header", header()), ("footer", footer())):
        with open(os.path.join(OUT, name + ".json"), "w") as fh:
            json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))
        print(name, len(json.dumps(data, ensure_ascii=False, separators=(",", ":"))), "bytes")
