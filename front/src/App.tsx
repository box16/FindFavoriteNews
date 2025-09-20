import './App.css'
import { useEffect, useState } from "react"

type NewsItem = {
  title: string;
  link: string;
  summary: string;
  source: string;
};

export default function App() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/news"); // FastAPI
        if (!r.ok) throw new Error(`API error: ${r.status}`);
        const data = await r.json();
        setItems(data);
      } catch (e:any) {
        setError(e.message ?? "failed");
      }
    })();
  }, []);

  if (error) return <div>エラー: {error}</div>;
  if (!items.length) return <div>読み込み中...</div>;

  return (
    <div style={{maxWidth: 720, margin: "2rem auto", fontFamily: "system-ui"}}>
      <h1>最新ニュース（上位5件）</h1>
      <ul style={{listStyle: "none", padding: 0}}>
        {items.map((it, i) => (
          <li key={i} style={{border:"1px solid #ddd", borderRadius:8, padding:16, marginBottom:12}}>
            <a href={it.link} target="_blank" rel="noreferrer" style={{fontSize:18, fontWeight:600, textDecoration:"none"}}>
              {it.title}
            </a>
            <div style={{color:"#666", fontSize:12, marginTop:4}}>
              {it.source}
            </div>
            <p style={{marginTop:8}} dangerouslySetInnerHTML={{__html: it.summary}} />
          </li>
        ))}
      </ul>
    </div>
  );
}