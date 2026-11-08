# Mistir Gift Demo - Android APK (Vedoy Studio)

This wraps the existing **concept demo** inside an installable Android WebView APK.
It **does not** process real orders or payments and is not the live merchant's official app.

## APK without Android Studio

1. Open [GitHub Actions](https://github.com/leandervedoy/Mistirgiftit-app-/actions/workflows/android-apk.yml).
2. On a new commit to `main`, the workflow builds automatically. You can also select **Run workflow**.
3. Download the `MistirGift-Android-Demo-APK` artifact from the finished run, unzip it and install the APK.
4. If release publishing permissions work, use the [direct APK download](https://github.com/leandervedoy/Mistirgiftit-app-/releases/download/apk-demo-latest/MistirGift-VedoyStudio-demo.apk).

The cloud runner installs JDK, Android SDK and Gradle. Android Studio is not required.
The debug APK uses a temporary CI signing key; a newer build may need the previous app uninstalled to install.
Only install builds from the project's official GitHub account.

## How it works

- `index.html`, `mistir-ui.css` and `mistir-ui.js` are copied into APK assets at build time.
- The wrapper uses AndroidX `WebViewAssetLoader` with an HTTPS app-assets origin, JavaScript and DOM storage.
- External web links are opened in the device browser.
- Remote product photos require connectivity, but bundled fallback images and the core demo work offline.
- Shared wishlist URLs point to the public web demo; recipients need online access.
- Browser notification permission does not equal Android push-notification support.

## To publish a real customer app

Use a **stable, private signing key** stored in GitHub Actions secrets, create a signed release APK or Play Store AAB, test on physical devices, configure actual backend/payment/shipping and confirm brand/merchant authorization. Never ship the CI debug key or claim demo features are production-ready.

## Download page

The repository includes `android-download.html`; if deployed with the static site, it presents download/install instructions.

`vedoystudio.mistirgift` alone is not a valid public DNS hostname. A possible subdomain is `mistirgift.vedoystudio.no`, provided Vedoy controls its DNS, or `vedoystudio.mistirgift.com` if the Mistir Gift domain owner authorizes it. Neither is created by this build.

## ZIP installasjon og Anime.js

APK-en og `MistirGift-VedoyStudio-demo.zip` publiseres samtidig. ZIP inneholder APK, SHA256-sjekksum og en installasjonsveiledning. Android kan ikke installere en ZIP direkte: pakk ut og apne APK-filen.

Nettsiden har to knapper: **ZIP med APK** og **APK direkte**, begge via `/api/apk-download?format=zip|apk`. Knappene aktiveres bare for gyldige GitHub Release-filer. Endepunktet omdirigerer til GitHubs faktiske vedlegg (uten GitHub-side); store binarfiler proxieres ikke gjennom Vercel Function.

Anime.js v4.5.0 er lagret lokalt i `vendor/` under MIT-lisens, og brukes av `mistir-motion.js` for behagelige overganger i nettsiden og offline i Android-demoen. Systeminnstillingen for redusert bevegelse respekteres. Kun demo, ikke kommersiell produksjonsapp.

## Dedikert ønskelisteside

`wishlist.html` er en egen skjerm med swipe fra butikken, egen administrasjon av lister, deling, valg av produkter og de eksisterende lokale datanoklene. `vd-base.css` er en lokal kopi av Vedoy CSS grunnstiler fra `css.vedoystudio.no`, slik at appen fungerer uten nett. APK/ZIP-knapper er fjernet fra butikkforsiden, mens byggeflyten beholdes for intern distribusjon.
