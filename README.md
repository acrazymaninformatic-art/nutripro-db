This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Configuración segura de acceso

Define en el entorno de despliegue `AUTH_SECRET` (al menos 32 caracteres aleatorios), `CRON_SECRET`, las variables `EVSOFTWARE_ADMIN_EMAIL` y `EVSOFTWARE_ADMIN_PASSWORD` (mínimo 14 caracteres), y las variables SMTP. No reutilices credenciales que hayan estado guardadas en versiones anteriores del proyecto.

Al desplegar el nuevo esquema, ejecuta `npm run db:push` y después `npm run admin:password` con el correo y la nueva contraseña del profesional configurados como variables de entorno. El segundo comando solo actualiza la contraseña de esa cuenta; no ejecuta el seed de alimentos. Configura `CRON_SECRET` también en el entorno de producción para que Vercel pueda autenticar el cron de recordatorios.

## Cumplimiento y datos legales

La aplicación incluye páginas separadas de aviso legal, privacidad, condiciones y cookies, además de controles de consentimiento versionados y derechos RGPD. Antes de usarla públicamente deben completarse el NIF, domicilio profesional y colegio profesional en `src/lib/legal.ts`, revisar los textos con asesoría jurídica, formalizar los contratos de encargo de Vercel/Supabase/Google y aprobar la tabla de conservación. Consulta el checklist completo en `docs/legal-compliance-readiness.md`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
