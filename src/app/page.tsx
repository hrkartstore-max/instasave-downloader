"use client";

import { useRef, useState } from "react";
import {
  ArrowRight, Check, CheckCircle2, Clipboard, Download, FileImage,
  FileVideo, Images, Instagram, Link2, LockKeyhole, Menu, ShieldCheck,
  Sparkles, UploadCloud, Video, X
} from "lucide-react";

const categories = [
  { id: "reels", label: "Reels", icon: Video, description: "Short-form videos" },
  { id: "posts", label: "Posts", icon: FileImage, description: "Photos and posts" },
  { id: "carousel", label: "Carousel", icon: Images, description: "Multi-item posts" },
  { id: "videos", label: "Videos", icon: FileVideo, description: "Instagram videos" },
] as const;

const steps = [
  ["01", "Copy the link", "Copy the link to content you own or have permission to save."],
  ["02", "Paste it here", "Add the public Instagram URL in the box above."],
  ["03", "Check availability", "InstaSave checks the link and tells you whether a supported source is available."],
];

const faqs = [
  ["Is InstaSave free to use?", "The current website experience is free. Local file saving happens directly in your browser."],
  ["Can I download private-account content?", "No. InstaSave does not access private accounts or bypass Instagram privacy settings."],
  ["Do I need to share my Instagram password?", "Never. InstaSave does not ask for Instagram passwords, session cookies or login credentials."],
  ["Why is a link accepted but no preview appears?", "Link validation only checks the URL format. Remote previews and downloads require an authorized media integration, which is not connected yet."],
  ["Can I save my own files?", "Yes. Use the local file option to save a supported image or MP4 video from your device."],
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<(typeof categories)[number]["id"]>("reels");
  const [fileName, setFileName] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function checkLink() {
    if (!url.trim()) { setMessage("Paste an Instagram link to get started."); return; }
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/validate", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() })
      });
      const result = await response.json();
      if (!response.ok || !result.valid) { setMessage(result.error || "Enter a valid Instagram post, Reel or video URL."); return; }
      const preview = await fetch("/api/media/preview", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "instagram", url: url.trim() })
      });
      const data = await preview.json();
      setMessage(data.message || "Link format accepted. Remote preview and download are not connected yet.");
    } catch {
      setMessage("We couldn't check this link right now. Please try again.");
    } finally { setBusy(false); }
  }

  async function pasteLink() {
    try { setUrl(await navigator.clipboard.readText()); setMessage(""); input.current?.focus(); }
    catch { setMessage("Clipboard access isn't available. Paste your link into the box."); input.current?.focus(); }
  }

  function saveLocalFile(file?: File) {
    if (!file) return;
    if (!["video/mp4", "image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setMessage("Supported files: MP4, JPG, PNG and WebP."); return;
    }
    if (file.size > 100 * 1024 * 1024) { setMessage("The maximum file size is 100 MB."); return; }
    setFileName(file.name); setMessage("Your local file is ready. Use Save file to download it.");
  }

  function downloadLocalFile() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = objectUrl; anchor.download = file.name; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  return (
    <main>
      <header className="site-header">
        <div className="container nav-inner">
          <a className="brand" href="/" aria-label="InstaSave home"><span className="brand-mark"><Instagram size={20}/></span>insta<span>save</span></a>
          <nav className={mobileMenu ? "nav-links nav-open" : "nav-links"} aria-label="Main navigation">
            <a href="#tools" onClick={() => setMobileMenu(false)}>Downloader</a>
            <a href="#how" onClick={() => setMobileMenu(false)}>How it works</a>
            <a href="#faq" onClick={() => setMobileMenu(false)}>FAQ</a>
            <a href="/about" onClick={() => setMobileMenu(false)}>About</a>
          </nav>
          <a className="nav-cta" href="#tools">Try InstaSave <ArrowRight size={15}/></a>
          <button className="menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label={mobileMenu ? "Close menu" : "Open menu"}>{mobileMenu ? <X/> : <Menu/>}</button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-glow glow-one"/><div className="hero-glow glow-two"/>
        <div className="container hero-content">
          <div className="eyebrow"><Sparkles size={15}/> SIMPLE. PRIVATE. MADE FOR YOU.</div>
          <h1>Your favourite moments,<br/><span>one link away.</span></h1>
          <p className="hero-copy">A simple way to check and save Instagram media you own or have permission to use.</p>
          <div className="tool-card" id="tools">
            <div className="category-tabs" role="tablist" aria-label="Choose media type">
              {categories.map(item => {
                const Icon = item.icon;
                return <button key={item.id} role="tab" aria-selected={category === item.id} className={category === item.id ? "category-tab active" : "category-tab"} onClick={() => setCategory(item.id)}>
                  <Icon size={17}/><span>{item.label}</span>
                </button>;
              })}
            </div>
            <label className="input-label" htmlFor="instagram-url">PASTE YOUR INSTAGRAM LINK</label>
            <div className="url-row">
              <div className="url-input-wrap"><Link2 size={19}/><input id="instagram-url" ref={input} value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => { if (e.key === "Enter") checkLink(); }} placeholder="https://www.instagram.com/reel/..." autoComplete="url"/></div>
              <button className="paste-btn" onClick={pasteLink}><Clipboard size={16}/> <span>Paste</span></button>
              <button className="check-btn" onClick={checkLink} disabled={busy}>{busy ? "Checking..." : "Check link"} <ArrowRight size={17}/></button>
            </div>
            {message && <p className="status-message" role="status">{message}</p>}
            <div className="tool-foot"><span><LockKeyhole size={14}/> No login required</span><span><ShieldCheck size={14}/> Privacy first</span><span><CheckCircle2 size={14}/> No password or cookies</span></div>
          </div>
          <p className="hero-note">Only use content you own or are authorized to download. Private content is not supported.</p>
        </div>
      </section>

      <section className="trust-strip"><div className="container trust-items"><span><Check size={16}/> Simple workflow</span><span><Check size={16}/> Mobile friendly</span><span><Check size={16}/> No account needed</span><span><Check size={16}/> Privacy-conscious</span></div></section>

      <section className="section" id="how">
        <div className="container"><div className="section-heading"><span className="section-kicker">THREE SIMPLE STEPS</span><h2>How InstaSave works</h2><p>Get started in moments with a clean, straightforward workflow.</p></div>
          <div className="steps-grid">{steps.map(([number,title,description]) => <article className="step-card" key={number}><span className="step-number">{number}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
        </div>
      </section>

      <section className="section feature-section">
        <div className="container feature-layout"><div><span className="section-kicker">YOUR FILES, YOUR CONTROL</span><h2>Save a file already on your device.</h2><p className="feature-copy">Need a quick way to save a copy of your own image or video? Choose a supported local file and save it directly from your browser. Nothing is uploaded to our server by this feature.</p><div className="local-upload">
            <input ref={fileInput} type="file" accept="video/mp4,image/jpeg,image/png,image/webp" onChange={e => saveLocalFile(e.target.files?.[0])} hidden/>
            <div className="upload-icon"><UploadCloud size={24}/></div><div className="upload-text"><strong>{fileName || "Choose a file from your device"}</strong><span>MP4, JPG, PNG or WebP · Up to 100 MB</span></div>
            <button onClick={() => fileInput.current?.click()} className="choose-btn">Browse files</button>
            {fileName && <button onClick={downloadLocalFile} className="save-file-btn"><Download size={16}/> Save file</button>}
          </div></div><div className="feature-art"><div className="art-orbit orbit-a"/><div className="art-orbit orbit-b"/><div className="art-panel"><div className="art-top"><span/><span/><span/></div><div className="art-image"><Instagram size={54}/></div><div className="art-lines"><i/><i/><i/></div><div className="art-download"><Download size={18}/> Your file, saved</div></div><div className="floating-check"><CheckCircle2 size={23}/></div></div></div>
      </section>

      <section className="section faq-section" id="faq"><div className="container faq-layout"><div className="section-heading faq-heading"><span className="section-kicker">GOOD TO KNOW</span><h2>Frequently asked questions</h2><p>Clear answers about privacy, supported links and downloads.</p></div><div className="faq-list">{faqs.map(([question,answer]) => <details className="faq-item" key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div></div></section>

      <section className="closing-cta"><div className="container closing-inner"><div><span className="section-kicker">READY WHEN YOU ARE</span><h2>Keep it simple. Keep it yours.</h2><p>Start by checking a link to content you are authorized to use.</p></div><a href="#tools" className="closing-button">Try InstaSave <ArrowRight size={17}/></a></div></section>

      <footer className="site-footer"><div className="container"><div className="footer-main"><div><a className="brand footer-brand" href="/"><span className="brand-mark"><Instagram size={19}/></span>insta<span>save</span></a><p>A simple, privacy-conscious media utility.</p></div><div className="footer-links"><a href="/about">About</a><a href="/how-to-use">How to use</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/contact">Contact</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} InstaSave. All rights reserved.</span><span>Independent service · Not affiliated with Instagram or Meta.</span></div></div></footer>
    </main>
  );
}
