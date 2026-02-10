import { describe, expect, it } from "vitest";
import {
  extractMedia,
  parseHtmlBody,
  parseHtmlComments,
  parseHtmlMedia,
  parseHtmlTitle,
} from "../reddit";

const sampleHtml = `
<html>
  <body>
    <a class="title" href="https://old.reddit.com/r/FashionReps/test">QC Post</a>
    <div class="expando">
      <div class="usertext-body">Body text here</div>
    </div>
    <div class="comment" data-author="opUser" data-fullname="t1_abc">
      <div class="usertext-body">OP comment</div>
    </div>
    <div class="comment" data-author="other" data-fullname="t1_def">
      <div class="usertext-body">Other comment</div>
    </div>
    <img src="https://i.redd.it/test.jpg" />
  </body>
</html>
`;

describe("reddit html parser", () => {
  it("parses title and body", () => {
    expect(parseHtmlTitle(sampleHtml)).toBe("QC Post");
    expect(parseHtmlBody(sampleHtml)).toBe("Body text here");
  });

  it("parses comments and flags OP", () => {
    const comments = parseHtmlComments(sampleHtml, "opUser");
    expect(comments).toHaveLength(2);
    expect(comments[0]?.isOp).toBe(true);
  });

  it("parses media from html", () => {
    const media = parseHtmlMedia(sampleHtml);
    expect(media[0]?.url).toBe("https://i.redd.it/test.jpg");
  });
});

describe("reddit json media", () => {
  it("extracts media from preview", () => {
    const media = extractMedia({
      id: "123",
      title: "Test",
      selftext: "",
      author: "user",
      created_utc: 0,
      permalink: "/r/FashionReps/comments/123",
      preview: { images: [{ source: { url: "https://i.redd.it/preview.png" } }] },
    });

    expect(media).toEqual([{ url: "https://i.redd.it/preview.png", kind: "image" }]);
  });
});
