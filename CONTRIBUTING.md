# Contributing

Thanks for looking. Automailr is a small, client-side app, and I keep it that way on purpose: no server, no database, one Gmail permission. Changes that fit that shape are welcome.

## Before you start

- For a bug, open an issue with the steps to reproduce, what you expected and what happened. A screenshot or the text from the results table helps.
- For a feature, open an issue first so we can agree it belongs. Anything that needs a backend, more Google permissions than `gmail.send`, or a tracking script will not be merged.
- Security problems go to the address in [SECURITY.md](SECURITY.md), not to a public issue.

## Working on it

```sh
git clone https://github.com/nishantjoshi-007/Automailr.git
cd Automailr
npm install
cp .env.example .env   # fill in a Google client ID of your own; the other two are optional
npm run dev
```

The README's "Google Cloud setup" section explains the client ID.

Before you open a pull request, all four must pass; CI runs the same four:

```sh
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npm test
npm run build
```

Add or update tests in `src/utils/*.test.ts` when you touch the CSV parser, placeholders, MIME building, the Gemini client or secure storage.

## How the code is organised

`README.md` has the layout. `DESIGN.md` is the design system and the voice for interface copy: sentence case, plain words, numbers with units, no exclamation marks, no emoji. If your change reverses a deliberate choice described there or in the README, say so in the pull request.

## Pull requests

- One change per pull request. Say what it does and why in the description.
- Keep the diff to what the change needs. No reformatting sweeps, no dependency bumps alongside a feature.
- Screenshots at 1440 px and 390 px, light and dark, for anything visual.
- No secrets in the diff, ever. `.env` is ignored by git; keep it that way.

## Licence

The project is under the MIT Non-Commercial License in [LICENSE](LICENSE). By contributing you agree that your contribution is released under the same terms.
