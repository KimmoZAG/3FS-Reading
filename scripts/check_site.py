from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.duplicates = set()
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        element_id = attrs.get("id")
        if element_id:
            if element_id in self.ids:
                self.duplicates.add(element_id)
            self.ids.add(element_id)
        for attribute in ("href", "src"):
            if attrs.get(attribute):
                self.links.append((self.getpos()[0], attrs[attribute]))


site = Path(__file__).resolve().parents[1] / "docs"
index = site / "index.html"
page = Page()
page.feed(index.read_text(encoding="utf-8"))
page.close()
errors = [f"Duplicate ID: {element_id}" for element_id in sorted(page.duplicates)]

for line, link in page.links:
    url = urlsplit(link)
    if url.scheme or url.netloc:
        continue
    target = (site / unquote(url.path)).resolve() if url.path else index
    if not target.is_relative_to(site) or not target.is_file():
        errors.append(f"Line {line}: missing or invalid local file {link}")
    elif target == index and url.fragment and unquote(url.fragment) not in page.ids:
        errors.append(f"Line {line}: missing section {link}")

if errors:
    raise SystemExit("\n".join(errors))

print("Checked unique page IDs, local links and static assets.")
