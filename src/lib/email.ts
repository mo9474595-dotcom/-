const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sends the password-reset email via Resend's REST API directly (no SDK
 * dependency needed for a single call type). Returns whether the send
 * succeeded; callers must not let a failure here change what they tell the
 * requester — see the email-enumeration note in forgot-password/route.ts.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // No email provider configured yet — log the link so it's still
    // retrievable (e.g. from Vercel's function logs) instead of leaving
    // the teacher with no way to recover their account.
    console.warn(`[email] RESEND_API_KEY is not set; password reset link for ${to}: ${resetUrl}`);
    return false;
  }
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: "إعادة تعيين كلمة المرور",
        html: `
          <div dir="rtl" style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1e293b;">
            <h2 style="margin: 0 0 12px;">إعادة تعيين كلمة المرور</h2>
            <p style="margin: 0 0 16px; line-height: 1.6;">
              وصلنا طلب لإعادة تعيين كلمة مرور حسابك. اضغط الزر أدناه لاختيار كلمة مرور جديدة.
              هذا الرابط صالح لمدة ساعة واحدة فقط.
            </p>
            <p style="margin: 0 0 24px;">
              <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 999px; font-weight: 600;">
                تعيين كلمة مرور جديدة
              </a>
            </p>
            <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
              إن لم تطلب هذا، يمكنك تجاهل هذه الرسالة بأمان — لن يتغير شيء في حسابك.
            </p>
          </div>
        `,
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend API returned", res.status, await res.text().catch(() => ""));
    }
    return res.ok;
  } catch (err) {
    console.error("[email] Failed to send password reset email:", err);
    return false;
  }
}
