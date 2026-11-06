import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { HiOutlineChatBubbleLeftRight, HiOutlineXMark, HiPaperAirplane, HiSparkles, HiOutlinePaperClip } from "react-icons/hi2";
import { Link } from "react-router-dom";
import { formatINR, getEffectivePrice, hasDiscount } from "../../utils/price";

const greeting = {
  role: "assistant",
  text: "Hi! I’m your KRAY style assistant. Tell me what you’re shopping for, your budget, or the look you have in mind.",
  products: [],
};

const suggestions = ["Help me find a casual outfit", "Show me something under ₹2,000", "What should I wear this weekend?"];
const photoTooLargeMessage = "That photo is still too large after compression. Choose a smaller image.";

const optimizePhoto = async (file) => {
  if (typeof createImageBitmap !== "function") return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
  return blob ? new File([blob], "shopping-photo.jpg", { type: "image/jpeg" }) : file;
};

export default function ShoppingAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([greeting]);
  const [draft, setDraft] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const feedRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return undefined;
    }
    const previewUrl = URL.createObjectURL(photo);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [photo]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, open]);

  const sendMessage = async (text = draft) => {
    const prompt = text.trim();
    if ((!prompt && !photo) || loading) return;
    const attachedPhoto = photo;
    const conversation = messages.filter((item) => item.role !== "assistant" || item !== greeting);
    setMessages((current) => [...current, { role: "user", text: prompt || "What styles could work for me?", hasPhoto: Boolean(attachedPhoto), products: [] }]);
    setDraft("");
    setError("");
    setLoading(true);
    try {
      const history = conversation.slice(-8).map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        text: item.text,
      }));
      const formData = new FormData();
      formData.append("message", prompt);
      formData.append("history", JSON.stringify(history));
      if (attachedPhoto) {
        const optimizedPhoto = await optimizePhoto(attachedPhoto);
        if (optimizedPhoto.size > 3 * 1024 * 1024) throw new Error(photoTooLargeMessage);
        formData.append("photo", optimizedPhoto);
      }
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/assistant/chat`, formData, { timeout: 50000 });
      setMessages((current) => [...current, { role: "assistant", text: data.reply, products: data.products || [] }]);
      setPhoto(null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || (requestError.message === photoTooLargeMessage ? photoTooLargeMessage : "I couldn't connect just now. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([greeting]);
    setError("");
    setPhoto(null);
  };

  const handlePhotoChange = (event) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type)) {
      setError("Choose a JPG, PNG, or WebP photo.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("Choose a photo under 5 MB.");
      return;
    }
    setError("");
    setPhoto(selected);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open KRAY shopping assistant"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-ink px-5 py-3.5 text-sm font-semibold text-white shadow-xl transition hover:bg-rabbit-red"
      >
        <HiOutlineChatBubbleLeftRight className="h-5 w-5" />
        <span>Ask KRAY</span>
        <HiSparkles className="h-4 w-4 text-haldi" />
      </button>

      {open && (
        <section aria-label="KRAY shopping assistant" className="fixed bottom-4 right-4 z-[60] flex h-[min(680px,calc(100vh-32px))] w-[min(420px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-ink px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-haldi"><HiSparkles className="h-5 w-5" /></span>
              <div>
                <p className="font-display text-lg font-bold">KRAY Style Assistant</p>
                <p className="text-xs text-white/65">Powered by Gemini · Here to help you find your fit</p>
              </div>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close assistant" className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"><HiOutlineXMark className="h-5 w-5" /></button>
          </header>

          <div ref={feedRef} className="flex-1 space-y-4 overflow-y-auto bg-[#faf9f6] p-4" aria-live="polite">
            {messages.map((item, index) => (
              <div key={`${index}-${item.role}`} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[90%] ${item.role === "user" ? "rounded-2xl rounded-br-sm bg-ink px-4 py-3 text-white" : "w-full"}`}>
                  <p className={`whitespace-pre-wrap text-sm leading-6 ${item.role === "assistant" ? "rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-gray-800 shadow-sm ring-1 ring-black/5" : ""}`}>{item.text}</p>
                  {item.hasPhoto && <p className="mt-1 text-right text-[11px] text-white/70">Photo attached</p>}
                  {item.products?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {item.products.map((product) => (
                        <Link key={product._id} to={`/product/${product._id}`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-2.5 text-ink shadow-sm transition hover:border-rabbit-red/40">
                          <img src={product.images?.[0]?.url} alt={product.images?.[0]?.altText || product.name} className="h-16 w-14 rounded-lg bg-stone-100 object-cover" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{product.name}</span>
                            <span className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                              {formatINR(getEffectivePrice(product))}
                              {hasDiscount(product) && <span className="text-xs text-gray-400 line-through">{formatINR(product.price)}</span>}
                            </span>
                          </span>
                          <span className="text-xs font-semibold text-rabbit-red">View</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="w-fit rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">Finding the right pieces…</div>}
            {error && <div role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {messages.length === 1 && !loading && <div className="flex flex-wrap gap-2">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => sendMessage(suggestion)} className="rounded-full border border-ink/15 bg-white px-3 py-2 text-left text-xs text-gray-700 transition hover:border-rabbit-red hover:text-rabbit-red">{suggestion}</button>)}</div>}
          </div>

          <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="border-t border-black/10 bg-white p-3">
            {photoPreview && (
              <div className="mb-2 flex items-center gap-3 rounded-xl bg-stone-50 p-2">
                <img src={photoPreview} alt="Selected photo for outfit advice" className="h-14 w-12 rounded-lg object-cover" />
                <span className="flex-1 text-xs text-gray-600">Photo ready to send</span>
                <button type="button" onClick={() => setPhoto(null)} aria-label="Remove selected photo" className="rounded-full p-2 text-gray-500 hover:bg-black/5"><HiOutlineXMark className="h-4 w-4" /></button>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full border border-black/10 bg-stone-50 px-3 py-1 focus-within:border-ink/40">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="hidden" aria-label="Choose a photo" />
              <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Attach a photo" title="Attach a photo" disabled={loading} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-gray-500 transition hover:bg-black/5 hover:text-ink disabled:opacity-40"><HiOutlinePaperClip className="h-5 w-5" /></button>
              <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1000} placeholder="Ask about styles, sizes, or budget…" aria-label="Message the shopping assistant" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-gray-400" />
              <button type="submit" disabled={(!draft.trim() && !photo) || loading} aria-label="Send message" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink text-white transition hover:bg-rabbit-red disabled:cursor-not-allowed disabled:opacity-40"><HiPaperAirplane className="h-4 w-4" /></button>
            </div>
            <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-gray-400">
              <button type="button" onClick={resetChat} className="hover:text-ink">New conversation</button>
              <span className="text-right">Photos go to Gemini · Not saved by KRAY</span>
            </div>
          </form>
        </section>
      )}
    </>
  );
}
