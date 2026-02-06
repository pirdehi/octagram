"use client";

import { useState, useRef } from "react";
import { FORMALITY_LABELS, CREATIVITY_LABELS } from "@/lib/octagram/tone";

const REQUEST_TIMEOUT_MS = 45000;

export default function Translator() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [formality, setFormality] = useState(4); // Default to "Formal"
  const [creativity, setCreativity] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ignoreResultRef = useRef(false);

  const formalityLabel = FORMALITY_LABELS[formality - 1] ?? "Formal";
  const creativityLabel = CREATIVITY_LABELS[creativity - 1] ?? "Natural";

  async function handleTranslate() {
    if (!inputText.trim() || loading) return;

    setError(null);
    setLoading(true);
    setOutputText("");
    ignoreResultRef.current = false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/933156a5-bfa2-4f2c-b0c6-290a0bb88c70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Translator.tsx:timeoutCallback',message:'Timeout fired',data:{ignoreResultBefore:ignoreResultRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      ignoreResultRef.current = true;
      controller.abort();
      setError("Request timed out. Try again or use shorter text.");
      setLoading(false);
    }, REQUEST_TIMEOUT_MS);

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/933156a5-bfa2-4f2c-b0c6-290a0bb88c70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Translator.tsx:handleTranslate:entry',message:'Translate started',data:{inputLen:inputText.length,formality,creativity},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H4,H5'})}).catch(()=>{});
      // #endregion
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          text: inputText,
          formality,
          creativity,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/933156a5-bfa2-4f2c-b0c6-290a0bb88c70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Translator.tsx:afterFetch',message:'Response received',data:{ok:response.ok,status:response.status,ignoreResult:ignoreResultRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H4'})}).catch(()=>{});
      // #endregion
      if (ignoreResultRef.current) return;

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      const data = await response.json();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/933156a5-bfa2-4f2c-b0c6-290a0bb88c70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Translator.tsx:afterJson',message:'Parsed body',data:{hasTranslation:!!data.translation,translationLen:typeof data.translation==='string'?data.translation.length:0},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
      // #endregion
      const translation = data.translation ?? "";
      setOutputText(translation);
    } catch (err) {
      clearTimeout(timeoutId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/933156a5-bfa2-4f2c-b0c6-290a0bb88c70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Translator.tsx:catch',message:'Catch block',data:{errName:err instanceof Error?err.name:'',errMessage:err instanceof Error?err.message:String(err),ignoreResult:ignoreResultRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H3,H4'})}).catch(()=>{});
      // #endregion
      if (ignoreResultRef.current) return;
      if (err instanceof Error && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Translation failed";
      if (message === "Failed to fetch") {
        setError(
          "Server did not respond. Make sure npm run dev is running from the project folder (with .env.local) and the browser URL matches the server."
        );
      } else {
        setError(message);
      }
    } finally {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/933156a5-bfa2-4f2c-b0c6-290a0bb88c70',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Translator.tsx:finally',message:'Finally',data:{ignoreResult:ignoreResultRef.current,willSetLoadingFalse:!ignoreResultRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      if (!ignoreResultRef.current) setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Formality: {formalityLabel}
          </label>
          <input
            type="range"
            min={1}
            max={8}
            value={formality}
            onChange={(e) => setFormality(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-zinc-900 dark:bg-zinc-700 dark:accent-zinc-100"
          />
          <div className="mt-1 flex justify-between text-xs text-zinc-500">
            <span>Highly Literary</span>
            <span>Very Street</span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Creativity: {creativityLabel}
          </label>
          <input
            type="range"
            min={1}
            max={4}
            value={creativity}
            onChange={(e) => setCreativity(Number(e.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-zinc-900 dark:bg-zinc-700 dark:accent-zinc-100"
          />
          <div className="mt-1 flex justify-between text-xs text-zinc-500">
            <span>Faithful</span>
            <span>Creative</span>
          </div>
        </div>
      </div>

      {/* Text panels */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Input text
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to translate to English..."
            rows={8}
            maxLength={5000}
            className="w-full resize-none rounded-lg border border-zinc-300 bg-white p-4 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <div className="mt-1 text-right text-xs text-zinc-500">
            {inputText.length} / 5000
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            English translation
          </label>
          <div className="h-[calc(100%-2rem)] min-h-[200px] rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
            {loading && !outputText && (
              <span className="text-zinc-400">Translating...</span>
            )}
            {outputText && (
              <p className="whitespace-pre-wrap">{outputText}</p>
            )}
            {!loading && !outputText && (
              <span className="text-zinc-400">Translation will appear here</span>
            )}
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Translate button */}
      <button
        onClick={handleTranslate}
        disabled={loading || !inputText.trim()}
        className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
      >
        {loading ? "Translating..." : "Translate to English"}
      </button>
    </div>
  );
}
