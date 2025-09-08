// src/components/shared/FaDigitsGlobal.jsx
import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// تبدیل هر رقم لاتین به فارسی
const toFaDigits = (val) =>
  String(val ?? "").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);

// تِگ‌هایی که نباید متن داخل‌شان تغییر کند
const SKIP_TAGS = new Set([
  "INPUT",
  "TEXTAREA",
  "SCRIPT",
  "STYLE",
  "CODE",
  "PRE",
  "KBD",
  "SAMP",
  "VAR",
  "NOSCRIPT",
  "TITLE",
]);

function convertTextNodes(root) {
  if (!root) return;

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        const p = node.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.isContentEditable) return NodeFilter.FILTER_REJECT;
        const tag = p.tagName;
        if (tag && SKIP_TAGS.has(tag)) return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest("[data-no-fa]")) return NodeFilter.FILTER_REJECT;
        if (!/\d/.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    },
    false
  );

  const seen = new WeakSet();
  let n;
  while ((n = walker.nextNode())) {
    if (seen.has(n)) continue;
    n.nodeValue = toFaDigits(n.nodeValue);
    seen.add(n);
  }
}

export default function FaDigitsGlobal({ enabled = true }) {
  const location = useLocation();
  const observerRef = useRef(null);

  // اجرای اولیه + مشاهده تغییرات DOM
  useEffect(() => {
    if (!enabled) return;
    const root = document.getElementById("root") || document.body;

    // اجرای اولیه
    convertTextNodes(root);

    // MutationObserver برای تبدیل متن‌های جدید/تغییرکرده
    const obs = new MutationObserver((mutations) => {
      // قطع موقت برای جلوگیری از لوپ
      obs.disconnect();
      try {
        for (const m of mutations) {
          if (m.type === "childList") {
            m.addedNodes.forEach((node) => {
              if (node.nodeType === 1) convertTextNodes(node); // element
              else if (node.nodeType === 3) node.nodeValue = toFaDigits(node.nodeValue);
            });
          } else if (m.type === "characterData") {
            m.target.nodeValue = toFaDigits(m.target.nodeValue);
          }
        }
      } finally {
        obs.observe(root, { childList: true, subtree: true, characterData: true });
      }
    });

    obs.observe(root, { childList: true, subtree: true, characterData: true });
    observerRef.current = obs;

    return () => obs.disconnect();
  }, [enabled]);

  // اجرای مجدد روی تغییر مسیر (Route change)
  useEffect(() => {
    if (!enabled) return;
    const root = document.getElementById("root") || document.body;
    convertTextNodes(root);
    // عنوان صفحه هم فارسی شود
    document.title = toFaDigits(document.title);
  }, [location, enabled]);

  return null;
}
