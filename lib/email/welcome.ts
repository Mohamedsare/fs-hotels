import "server-only";

/**
 * Mail de bienvenue, envoyé via l'API Resend par NOTRE code (Supabase n'envoie pas
 * de "welcome email"). Le HTML est inline ici (et non lu depuis le disque) pour
 * rester fiable en environnement serverless (Vercel).
 *
 * Variables d'environnement requises (.env.local + dashboard Vercel) :
 *   RESEND_API_KEY        = re_xxx
 *   RESEND_FROM           = "FasoStock Hôtels <bienvenue@votre-domaine.bf>"  (domaine vérifié sur Resend)
 *   NEXT_PUBLIC_APP_URL   = https://app.votre-domaine.bf
 *
 * NB : supabase/email-templates/welcome.html est conservé comme aperçu visuel ;
 * la version qui fait foi (et qui est envoyée) est celle ci‑dessous.
 */
export async function sendWelcomeEmail(params: {
  to: string;
  hotelName: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    return { ok: false, error: "RESEND_API_KEY / RESEND_FROM manquants." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.fasostock.bf";
  const html = buildWelcomeHtml(escapeHtml(params.hotelName), appUrl);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: params.to,
      subject: "Bienvenue sur FasoStock Hôtels 🎉",
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, error: `Resend ${res.status}: ${body}` };
  }
  return { ok: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildWelcomeHtml(hotelName: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Bienvenue sur FasoStock Hôtels</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width:600px){
      .fs-container{width:100%!important}
      .fs-px{padding-left:24px!important;padding-right:24px!important}
      .fs-h1{font-size:24px!important}
    }
    a{text-decoration:none}
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f0ec;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f1f0ec;">
    Votre compte FasoStock Hôtels est prêt. Voici comment démarrer.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f0ec;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="fs-container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#e85d2c;border-radius:12px;padding:10px 14px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:#ffffff;letter-spacing:.5px;">
                    FasoStock <span style="font-weight:400;opacity:.85;">Hôtels</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="background-color:#ffffff;border-radius:20px;border:1px solid #ECEAE6;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:6px;background-color:#e85d2c;border-radius:20px 20px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>

                <tr>
                  <td class="fs-px" style="padding:40px 48px 8px 48px;">
                    <div style="font-size:44px;line-height:1;">🎉</div>
                    <h1 class="fs-h1" style="margin:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:800;color:#1c1b1f;">
                      Bienvenue, ${hotelName}&nbsp;!
                    </h1>
                    <p style="margin:14px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:26px;color:#56525c;">
                      Votre compte est activé. FasoStock Hôtels va vous aider à gérer chambres,
                      réservations, séjours, caisse et factures — depuis une seule plateforme,
                      même à distance.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td class="fs-px" style="padding:26px 48px 0 48px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td valign="top" width="40" style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:18px;">🛏️</td>
                        <td valign="top" style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#56525c;">
                          <strong style="color:#1c1b1f;">Créez vos chambres</strong> et types de chambres avec leurs tarifs.
                        </td>
                      </tr>
                      <tr>
                        <td valign="top" width="40" style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:18px;">📅</td>
                        <td valign="top" style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#56525c;">
                          <strong style="color:#1c1b1f;">Enregistrez réservations et check‑ins</strong> en quelques secondes.
                        </td>
                      </tr>
                      <tr>
                        <td valign="top" width="40" style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:18px;">💰</td>
                        <td valign="top" style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:#56525c;">
                          <strong style="color:#1c1b1f;">Suivez la caisse et générez les factures</strong> au check‑out.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td class="fs-px" align="center" style="padding:28px 48px 8px 48px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${appUrl}" style="height:50px;v-text-anchor:middle;width:260px;" arcsize="24%" stroke="f" fillcolor="#e85d2c">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Ouvrir mon tableau de bord</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${appUrl}" style="display:inline-block;background-color:#e85d2c;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;line-height:50px;text-align:center;width:260px;border-radius:12px;">
                      Ouvrir mon tableau de bord
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>

                <tr><td class="fs-px" style="padding:28px 48px 0 48px;"><div style="height:1px;background-color:#ECEAE6;font-size:0;line-height:0;">&nbsp;</div></td></tr>

                <tr>
                  <td class="fs-px" style="padding:20px 48px 40px 48px;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:#8a868f;">
                      Une question&nbsp;? Répondez simplement à cet e‑mail, notre équipe est là pour vous aider.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 24px 8px 24px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#a39fa8;">
                FasoStock Hôtels — Gestion hôtelière, Burkina Faso
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
