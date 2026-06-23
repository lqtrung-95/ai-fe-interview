/**
 * Renders one or more JSON-LD structured-data scripts into the document.
 * Server component — the script tags are emitted into the streamed HTML so
 * crawlers (Google Rich Results) read them without executing JS.
 *
 * `<` is escaped to its unicode form to prevent a "</script>" sequence inside
 * the serialized data from prematurely closing the script element.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, '\\u003c'),
          }}
        />
      ))}
    </>
  );
}
