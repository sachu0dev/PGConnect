"use client";

/** Minimal local typings for Razorpay Checkout (subscriptions). */
export type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

export type RazorpayFailure = {
  error?: { code?: string; description?: string; reason?: string; metadata?: { payment_id?: string } };
};

export type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: RazorpaySuccess) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean; escape?: boolean };
};

export type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailure) => void) => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;
type WindowWithRazorpay = Window & { Razorpay?: RazorpayConstructor };

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<RazorpayConstructor> | null = null;

/** Loads Razorpay Checkout on demand (only when the user starts a payment). */
export function loadRazorpay(): Promise<RazorpayConstructor> {
  const win = window as WindowWithRazorpay;
  if (win.Razorpay) return Promise.resolve(win.Razorpay);
  loading ??= new Promise<RazorpayConstructor>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    const done = () => {
      const ctor = (window as WindowWithRazorpay).Razorpay;
      if (ctor) resolve(ctor);
      else reject(new Error("Payment window failed to load"));
    };
    script.addEventListener("load", done, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Couldn't load the payment window. Check your connection and try again.")),
      { once: true }
    );
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  }).catch((error: unknown) => {
    loading = null;
    throw error;
  });
  return loading;
}
