const DATA: Record<string, any[]> = {
  shapes: [
    { id: "s1", name: "Circle", type: "circle", img: { url: "", width: 50, height: 50 }, desc: "Circle", clipPath: "", width: 50, height: 50, background: "#6366f1" },
    { id: "s2", name: "Rect", type: "rect", img: { url: "", width: 50, height: 50 }, desc: "Rect", clipPath: "", width: 50, height: 50, background: "#ec4899" },
    { id: "s3", name: "Triangle", type: "polygon", img: { url: "", width: 50, height: 50 }, desc: "Triangle", clipPath: "", width: 50, height: 50, background: "#f59e0b" },
    { id: "s4", name: "Star", type: "star", img: { url: "", width: 50, height: 50 }, desc: "Star", clipPath: "", width: 50, height: 50, background: "#10b981" },
  ],
  images: [
    { id: "img1", name: "Office", img: { url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab", width: 400, height: 300 }, desc: "Business" },
    { id: "img2", name: "Team", img: { url: "https://images.unsplash.com/photo-1522071820081-009f08297526", width: 400, height: 300 }, desc: "Team" },
  ],
  fonts: [
    { id: "f1", name: "Arial", family: "Arial", styles: [{ name: "Arial Regular", style: "regular" }, { name: "Arial Bold", style: "700" }] },
    { id: "f2", name: "Helvetica", family: "Helvetica", styles: [{ name: "Helvetica Regular", style: "regular" }] },
  ],
  frames: [
    { id: "fr1", name: "Business Card", width: 1050, height: 600 },
    { id: "fr2", name: "A4", width: 2480, height: 3508 },
  ],
  texts: [
    { id: "t1", name: "Simple Text", data: { type: "text", content: "Add your text", fontSize: 48, fontFamily: "Arial" }, desc: "Basic" },
    { id: "t2", name: "Bold", data: { type: "text", content: "HEADING", fontSize: 72, fontWeight: "bold" }, desc: "Bold" },
  ],
  templates: [
    { id: "tm1", name: "Business Card", desc: "Standard", data: JSON.stringify({ pages: [] }), width: 1050, height: 600 },
  ],
};

export async function GET(req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const endpoint = slug?.[0] || "shapes";
  const { searchParams } = new URL(req.url);
  const ps = parseInt(searchParams.get("ps") || "40");
  const pi = parseInt(searchParams.get("pi") || "0");
  const kw = searchParams.get("kw") || "";

  let data = DATA[endpoint] || [];
  if (kw) data = data.filter(i => JSON.stringify(i).toLowerCase().includes(kw.toLowerCase()));
  const start = pi * ps;
  
  return Response.json({ data: data.slice(start, start + ps) });
}