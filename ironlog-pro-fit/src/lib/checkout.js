import { base44 } from "@/api/base44Client";

// Starts a Stripe Checkout session for the IronLog Pro subscription.
// Redirects the browser to Stripe's hosted checkout page.
export async function startProCheckout(plan = "monthly") {
  if (window.self !== window.top) {
    alert("Checkout works only from the published app. Open the app in a new tab to upgrade.");
    return;
  }
  let user = null;
  try {
    user = await base44.auth.me();
  } catch (e) {
    /* not logged in */
  }
  if (!user) {
    alert("Please log in to upgrade to Pro.");
    return;
  }
  try {
    const res = await base44.functions.invoke("createCheckout", {
      userId: user.id,
      email: user.email,
      origin: window.location.origin,
      plan,
    });
    const url = res?.data?.url;
    if (url) {
      window.location.href = url;
    } else {
      alert("Could not start checkout. Please try again.");
    }
  } catch (e) {
    alert("Checkout failed: " + (e?.message || "unknown error"));
  }
}