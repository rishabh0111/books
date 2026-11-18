# Books

Two reading lists, **Non-fiction** and **Literature**, each read in order,
stage by stage. Anyone can use it: tick a book when you've read it. Sign in
with Google to keep your ticks across devices; without signing in they stay
in your browser.

A static site on GitHub Pages. Sign-in and each person's ticks live in
Firebase (Authentication + Firestore). There is no server to run.

## Set up (once)

### 1. Firebase

1. In the [Firebase console](https://console.firebase.google.com), create a
   project. Google Analytics is not needed.
2. **Build → Authentication → Get started → Sign-in method → Google →
   Enable.**
3. **Authentication → Settings → Authorized domains → Add domain:**
   `<your-github-username>.github.io`.
4. **Build → Firestore Database → Create database** (production mode, any
   region), then open **Rules**, paste the contents of `firestore.rules` and
   publish.
5. **Project settings → Your apps → Web (`</>`)**: register an app. Copy
   `apiKey`, `authDomain`, `projectId` and `appId` from the config shown.

### 2. GitHub

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. **Settings → Secrets and variables → Actions → Variables**, add:

   | Name | Value |
   |---|---|
   | `FIREBASE_API_KEY` | `apiKey` |
   | `FIREBASE_AUTH_DOMAIN` | `authDomain` |
   | `FIREBASE_PROJECT_ID` | `projectId` |
   | `FIREBASE_APP_ID` | `appId` |

   These are public by design (they ship in the page); `firestore.rules` is
   what keeps each person's data private.

3. Push to `main`. The workflow builds and publishes the site at
   `https://<user>.github.io/<repo>/`.

## Updating the lists

The lists come from the notes repo (`knowledge-base`, kept private). After
changing books there:

```sh
npm run data            # reads ../knowledge-base, writes data/lists.json
git commit -am "chore(data): update lists" && git push
```

Literature forms and regions come from each note's `form` / `region`, or from
`scripts/literature-tags.tsv` when a note doesn't have them.

Book ids are made from the note's file name, so renaming a note's file resets
that book's ticks for everyone.

## Run locally

```sh
npm install
npm run dev             # http://localhost:3000
```

Without Firebase settings it runs with browser-only ticks. To try sign-in,
copy `.env.example` to `.env.local` and fill it in, and add `localhost` to
the authorized domains.
