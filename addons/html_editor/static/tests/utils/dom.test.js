import { describe, expect, test } from "@odoo/hoot";
import { setupEditor } from "../_helpers/editor";
import { cleanTextNode, wrapInlinesInParagraphs } from "@html_editor/utils/dom";
import { getContent } from "../_helpers/selection";

describe("splitAroundUntil", () => {
    test("should split a slice of text from its inline ancestry (1)", async () => {
        const { editor, el } = await setupEditor("<p>a<font>b<span>cde</span>f</font>g</p>");
        const [p] = el.childNodes;
        const cde = p.childNodes[1].childNodes[1].firstChild;
        // We want to test with "cde" being three separate text nodes.
        editor.shared.splitTextNode(cde, 2);
        const cd = cde.previousSibling;
        editor.shared.splitTextNode(cd, 1);
        const d = cd;
        const result = editor.shared.splitAroundUntil(d, p.childNodes[1]);
        expect(result.tagName === "FONT").toBe(true);
        expect(p.outerHTML).toBe(
            "<p>a<font>b<span>c</span></font><font><span>d</span></font><font><span>e</span>f</font>g</p>"
        );
    });

    test("should split a slice of text from its inline ancestry (2)", async () => {
        const { editor, el } = await setupEditor("<p>a<font>b<span>cdefg</span>h</font>i</p>");
        const [p] = el.childNodes;
        const cdefg = p.childNodes[1].childNodes[1].firstChild;
        // We want to test with "cdefg" being five separate text nodes.
        editor.shared.splitTextNode(cdefg, 4);
        const cdef = cdefg.previousSibling;
        editor.shared.splitTextNode(cdef, 3);
        const cde = cdef.previousSibling;
        editor.shared.splitTextNode(cde, 2);
        const cd = cde.previousSibling;
        editor.shared.splitTextNode(cd, 1);
        const d = cd;
        const result = editor.shared.splitAroundUntil(
            [d, d.nextSibling.nextSibling],
            p.childNodes[1]
        );
        expect(result.tagName === "FONT").toBe(true);
        expect(p.outerHTML).toBe(
            "<p>a<font>b<span>c</span></font><font><span>def</span></font><font><span>g</span>h</font>i</p>"
        );
    });

    test("should split from a textNode that has no siblings", async () => {
        const { editor, el } = await setupEditor("<p>a<font>b<span>cde</span>f</font>g</p>");
        const [p] = el.childNodes;
        const font = p.querySelector("font");
        const cde = p.querySelector("span").firstChild;
        const result = editor.shared.splitAroundUntil(cde, font);
        expect(result.tagName === "FONT" && result !== font).toBe(true);
        expect(p.outerHTML).toBe(
            "<p>a<font>b</font><font><span>cde</span></font><font>f</font>g</p>"
        );
    });

    test("should not do anything (nothing to split)", async () => {
        const { editor, el } = await setupEditor("<p>a<font><span>bcd</span></font>e</p>");
        const [p] = el.childNodes;
        const bcd = p.querySelector("span").firstChild;
        const result = editor.shared.splitAroundUntil(bcd, p.childNodes[1]);
        expect(result === p.childNodes[1]).toBe(true);
        expect(p.outerHTML).toBe("<p>a<font><span>bcd</span></font>e</p>");
    });
});

describe("cleanTextNode", () => {
    test("should remove ZWS before cursor and preserve it", async () => {
        const { editor, el } = await setupEditor("<p>\u200B[]text</p>");
        const cursors = editor.shared.preserveSelection();
        cleanTextNode(el.querySelector("p").firstChild, "\u200B", cursors);
        cursors.restore();
        expect(getContent(el)).toBe("<p>[]text</p>");
    });
    test("should remove ZWS before cursor and preserve it (2)", async () => {
        const { editor, el } = await setupEditor("<p>\u200Bt[]ext</p>");
        const cursors = editor.shared.preserveSelection();
        cleanTextNode(el.querySelector("p").firstChild, "\u200B", cursors);
        cursors.restore();
        expect(getContent(el)).toBe("<p>t[]ext</p>");
    });
    test("should remove ZWS after cursor and preserve it", async () => {
        const { editor, el } = await setupEditor("<p>text[]\u200B</p>");
        const cursors = editor.shared.preserveSelection();
        cleanTextNode(el.querySelector("p").firstChild, "\u200B", cursors);
        cursors.restore();
        expect(getContent(el)).toBe("<p>text[]</p>");
    });
    test("should remove ZWS after cursor and preserve it (2)", async () => {
        const { editor, el } = await setupEditor("<p>t[]ext\u200B</p>");
        const cursors = editor.shared.preserveSelection();
        cleanTextNode(el.querySelector("p").firstChild, "\u200B", cursors);
        cursors.restore();
        expect(getContent(el)).toBe("<p>t[]ext</p>");
    });
    test("should remove multiple ZWS preserving cursor", async () => {
        const { editor, el } = await setupEditor("<p>\u200Bt\u200Be[]\u200Bxt\u200B</p>");
        const cursors = editor.shared.preserveSelection();
        cleanTextNode(el.querySelector("p").firstChild, "\u200B", cursors);
        cursors.restore();
        expect(getContent(el)).toBe("<p>te[]xt</p>");
    });
    test("should remove multiple ZWNBSP preserving cursor", async () => {
        const { editor, el } = await setupEditor("<p>\uFEFFt\uFEFFe[]\uFEFFxt\uFEFF</p>");
        const cursors = editor.shared.preserveSelection();
        cleanTextNode(el.querySelector("p").firstChild, "\uFEFF", cursors);
        cursors.restore();
        expect(getContent(el)).toBe("<p>te[]xt</p>");
    });
});

describe("wrapInlinesInParagraphs", () => {
    test("should wrap text node in P", async () => {
        const div = document.createElement("div");
        div.innerHTML = "text";
        wrapInlinesInParagraphs(div);
        expect(div.innerHTML).toBe("<p>text</p>");
    });
    test("should wrap inline element in P", async () => {
        const div = document.createElement("div");
        div.innerHTML = "<strong>text</strong>";
        wrapInlinesInParagraphs(div);
        expect(div.innerHTML).toBe("<p><strong>text</strong></p>");
    });
    test("should not do anything to block element", async () => {
        const div = document.createElement("div");
        div.innerHTML = "<p>text</p>";
        wrapInlinesInParagraphs(div);
        expect(div.innerHTML).toBe("<p>text</p>");
    });
    test("should wrap inlines in P", async () => {
        const div = document.createElement("div");
        div.innerHTML = "textnode<strong>inline</strong><p>p</p>";
        wrapInlinesInParagraphs(div);
        expect(div.innerHTML).toBe("<p>textnode<strong>inline</strong></p><p>p</p>");
    });
    test("should wrap inlines in P (2)", async () => {
        const div = document.createElement("div");
        div.innerHTML = "<strong>inline</strong><p>p</p>textnode";
        wrapInlinesInParagraphs(div);
        expect(div.innerHTML).toBe("<p><strong>inline</strong></p><p>p</p><p>textnode</p>");
    });
    test("should turn a BR into a paragraph break", async () => {
        const div = document.createElement("div");
        div.innerHTML = "abc<br>def";
        wrapInlinesInParagraphs(div);
        expect(div.innerHTML).toBe("<p>abc</p><p>def</p>");
    });
    test("should remove a BR that has no effect", async () => {
        const div = document.createElement("div");
        div.innerHTML = "abc<br>def<br>";
        wrapInlinesInParagraphs(div);
        expect(div.innerHTML).toBe("<p>abc</p><p>def</p>");
    });
    test("empty lines should become empty paragraphs", async () => {
        const div = document.createElement("div");
        div.innerHTML = "abc<br><br>def";
        wrapInlinesInParagraphs(div);
        expect(div.innerHTML).toBe("<p>abc</p><p><br></p><p>def</p>");
    });
    test("empty lines should become empty paragraphs (2)", async () => {
        const div = document.createElement("div");
        div.innerHTML = "<br>";
        wrapInlinesInParagraphs(div);
        expect(div.innerHTML).toBe("<p><br></p>");
    });
    test("empty lines should become empty paragraphs (3)", async () => {
        const div = document.createElement("div");
        div.innerHTML = "<br>abc";
        wrapInlinesInParagraphs(div);
        expect(div.innerHTML).toBe("<p><br></p><p>abc</p>");
    });
    test("mix: handle blocks, inlines and BRs", async () => {
        const div = document.createElement("div");
        div.innerHTML = "a<br><strong>b</strong><h1>c</h1><br>d<h2>e</h2><br>";
        wrapInlinesInParagraphs(div);
        expect(div.innerHTML).toBe(
            "<p>a</p><p><strong>b</strong></p><h1>c</h1><p><br></p><p>d</p><h2>e</h2><p><br></p>"
        );
    });
});
