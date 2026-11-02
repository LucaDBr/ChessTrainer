// Inhalte der ersten Instagram-Beiträge für @chesstrainerapp (Englisch).
// Brettstellungen werden als Zugfolgen angegeben und von chess.js geprüft.

const CTA_TRAP = {
  type: 'cta',
  title: ['Never fall for', 'it again.'],
  body: ['ChessTrainer drills your repertoire', 'until lines like this are automatic.'],
}

const BASE_TAGS = ['#chess', '#chessopenings', '#chesstips', '#chesstraining', '#lichess']

const ELEPHANT = ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5', 'Nbd7', 'cxd5', 'exd5']
const LEGAL = ['e4', 'e5', 'Nf3', 'd6', 'Bc4', 'Bg4', 'Nc3', 'g6']
const ENGLUND = ['d4', 'e5', 'dxe5', 'Nc6', 'Nf3', 'Qe7', 'Bf4', 'Qb4+', 'Bd2', 'Qxb2']

export const posts = [
  {
    id: 'intro',
    slides: [
      {
        type: 'text',
        kicker: 'Opening trainer',
        title: ['Stop forgetting', 'your openings.'],
        body: ['You studied the line.', 'Three weeks later, it’s gone.', 'Sound familiar?'],
      },
      {
        type: 'steps',
        kicker: 'How it works',
        title: ['Learn openings', 'like vocabulary.'],
        steps: [
          ['Play your moves', ['Drag or tap – on any phone.']],
          ['Face real replies', ['Your opponent plays what people actually', 'play, based on the Lichess database.']],
          ['Repeat at the right time', ['Missed moves come back tomorrow.', 'Known moves come back in weeks.']],
        ],
      },
      {
        type: 'cta',
        title: ['Free.', 'No app store.'],
        body: ['Runs in your browser and installs', 'to your home screen in seconds.'],
      },
    ],
    caption: `
You spend hours on an opening… and forget it by the next tournament. 😩

ChessTrainer fixes that with spaced repetition: you play your repertoire on the board, the opponent answers like real players do, and every move you miss comes back exactly when you're about to forget it.

♟ Free web app – no download, no account needed
📱 Add it to your home screen and it works like an app

👉 Link in bio`,
    hashtags: [...BASE_TAGS, '#spacedrepetition', '#chessimprovement', '#chessapp'],
  },

  {
    id: 'elephant-trap',
    slides: [
      {
        type: 'board',
        kicker: 'Opening trap · Queen’s Gambit Declined',
        title: ['White grabs a “free” pawn.', 'Why is it a mistake?'],
        board: { moves: ELEPHANT, orientation: 'black', arrows: [['c3', 'd5', 'red']] },
        caption: ['1.d4 d5 2.c4 e6 3.Nc3 Nf6 4.Bg5 Nbd7', '5.cxd5 exd5 6.Nxd5??'],
      },
      {
        type: 'board',
        kicker: 'The Elephant Trap',
        title: ['6…Nxd5! 7.Bxd8 Bb4+', 'The check wins it back.'],
        board: {
          moves: [...ELEPHANT, 'Nxd5', 'Nxd5', 'Bxd8', 'Bb4+'],
          orientation: 'black',
          arrows: [['b4', 'e1', 'green']],
        },
        caption: ['The knight on f6 looked pinned.', 'It never was.'],
      },
      {
        type: 'board',
        kicker: 'The Elephant Trap',
        title: ['8.Qd2 Bxd2+ 9.Kxd2 Kxd8', 'Black wins a piece.'],
        board: { moves: [...ELEPHANT, 'Nxd5', 'Nxd5', 'Bxd8', 'Bb4+', 'Qd2', 'Bxd2+', 'Kxd2', 'Kxd8'], orientation: 'black' },
        caption: ['Final count: a knight for a pawn.', 'A winning position for Black.'],
      },
      CTA_TRAP,
    ],
    caption: `
The Elephant Trap ♟🐘

In the Queen's Gambit Declined, White sees a "free" pawn on d5 and takes it with the knight. The knight on f6 seems pinned… but it isn't!

6…Nxd5! 7.Bxd8 Bb4+ 8.Qd2 Bxd2+ 9.Kxd2 Kxd8 – and Black comes out a knight for a pawn ahead.

Play the QGD? Save this for later. 🔖
Want to drill it until it's automatic? Link in bio.`,
    hashtags: [...BASE_TAGS, '#queensgambit', '#chesstrap', '#elephanttrap'],
  },

  {
    id: 'real-opponents',
    slides: [
      {
        type: 'steps',
        kicker: 'Not just one main line',
        title: ['Your opponent', 'plays like a human.'],
        steps: [
          ['Real move choices', ['Replies are picked by how often players', 'at your rating actually choose them.']],
          ['Side lines included', ['Sicilian, French, Caro-Kann – whatever', 'people throw at you after 1.e4.']],
          ['Filter by level', ['Choose rating range and time control,', 'or switch to master games.']],
        ],
        note: ['Data: Lichess opening explorer (free Lichess account).'],
      },
      CTA_TRAP,
    ],
    caption: `
Most opening apps make you memorize ONE main line. Then your opponent plays something else on move 3. 🙃

In ChessTrainer, the opponent picks replies from the Lichess database – weighted by how often real players at your level choose them. So you train the lines you'll actually see over the board.

🎯 Filter by rating & time control
🏆 Or switch to master games

👉 Link in bio`,
    hashtags: [...BASE_TAGS, '#openingrepertoire', '#chessimprovement', '#chessapp'],
  },

  {
    id: 'legals-mate',
    slides: [
      {
        type: 'board',
        kicker: 'Opening trap · Légal’s Mate',
        title: ['5.Nxe5!', 'White offers the queen.'],
        board: { moves: LEGAL, arrows: [['f3', 'e5', 'green']] },
        caption: ['1.e4 e5 2.Nf3 d6 3.Bc4 Bg4 4.Nc3 g6'],
      },
      {
        type: 'board',
        kicker: 'Légal’s Mate',
        title: ['5…Bxd1?? takes it.', 'Now watch.'],
        board: { moves: [...LEGAL, 'Nxe5', 'Bxd1'], arrows: [['c4', 'f7', 'green']] },
        caption: ['6.Bxf7+ Ke7 (forced)'],
      },
      {
        type: 'board',
        kicker: 'Légal’s Mate',
        title: ['7.Nd5#', 'Three minor pieces, one mate.'],
        board: { moves: [...LEGAL, 'Nxe5', 'Bxd1', 'Bxf7+', 'Ke7', 'Nd5#'], marks: [['e7', 'rgba(217,83,79,0.55)']] },
        caption: ['Better was 5…dxe5 6.Qxg4 –', 'Black only loses a pawn.'],
      },
      CTA_TRAP,
    ],
    caption: `
Légal's Mate – one of the oldest traps in chess (1750!) and it still works online every day. ⚡

1.e4 e5 2.Nf3 d6 3.Bc4 Bg4 4.Nc3 g6 5.Nxe5!
If Black grabs the queen: 5…Bxd1?? 6.Bxf7+ Ke7 7.Nd5#

Black's best is 5…dxe5, losing just a pawn.

Tag a friend who'd take the queen 👇`,
    hashtags: [...BASE_TAGS, '#chesstrap', '#checkmate', '#legalsmate'],
  },

  {
    id: 'spaced-repetition',
    slides: [
      {
        type: 'timeline',
        kicker: 'Spaced repetition',
        title: ['Review right before', 'you forget.'],
        intro: ['Every position you know gets a longer break', 'before it comes back:'],
        days: [1, 3, 7, 14, 30],
        miss: ['Miss a move? It’s back tomorrow –', 'until you really know it.'],
      },
      CTA_TRAP,
    ],
    caption: `
Why do you forget openings? Because you review them all at once – and then never again. 🧠

ChessTrainer uses spaced repetition (the method language apps use for vocabulary):
✅ Play a move correctly → longer break (1, 3, 7, 14, 30 days…)
❌ Miss it → it comes back tomorrow

10 minutes a day keeps your whole repertoire fresh.

👉 Link in bio`,
    hashtags: [...BASE_TAGS, '#spacedrepetition', '#chessstudy', '#chessimprovement'],
  },

  {
    id: 'englund-trap',
    slides: [
      {
        type: 'board',
        kicker: 'Opening trap · Englund Gambit',
        title: ['White saves the rook.', 'Or so it seems.'],
        board: { moves: ENGLUND, orientation: 'black', arrows: [['d2', 'c3', 'red']] },
        caption: ['1.d4 e5 2.dxe5 Nc6 3.Nf3 Qe7 4.Bf4 Qb4+', '5.Bd2 Qxb2 6.Bc3??'],
      },
      {
        type: 'board',
        kicker: 'Englund Gambit Trap',
        title: ['6…Bb4!', 'The bishop is pinned.'],
        board: { moves: [...ENGLUND, 'Bc3', 'Bb4'], orientation: 'black', arrows: [['b4', 'c3', 'green']] },
        caption: ['7.Qd2 defends… or does it?'],
      },
      {
        type: 'board',
        kicker: 'Englund Gambit Trap',
        title: ['7…Bxc3 8.Qxc3 Qc1#', 'Checkmate on move eight.'],
        board: {
          moves: [...ENGLUND, 'Bc3', 'Bb4', 'Qd2', 'Bxc3', 'Qxc3', 'Qc1#'],
          orientation: 'black',
          marks: [['e1', 'rgba(217,83,79,0.55)']],
        },
        caption: ['The queen on d1 is gone –', 'nothing can cover c1.'],
      },
      CTA_TRAP,
    ],
    caption: `
The Englund Gambit Trap 🪤

1.d4 e5!? is objectively dubious – but it hides a nasty trap:
2.dxe5 Nc6 3.Nf3 Qe7 4.Bf4 Qb4+ 5.Bd2 Qxb2 6.Bc3?? Bb4! 7.Qd2 Bxc3 8.Qxc3 Qc1#

White's best is 6.Nc3!, and Black is in trouble instead.

Did you know this one? 👇`,
    hashtags: [...BASE_TAGS, '#chesstrap', '#englundgambit', '#checkmate'],
  },

  {
    id: 'engine-check',
    slides: [
      {
        type: 'table',
        kicker: 'Build a sound repertoire',
        title: ['Never memorize', 'a bad move.'],
        intro: ['New position? Before anything is saved, you', 'see how strong each candidate really is.'],
        position: 'After 1.e4 c5 · White to move',
        rows: [
          ['Nf3', '+0.3', true],
          ['Nc3', '+0.2'],
          ['d4', '+0.1'],
          ['c3', '+0.0'],
          ['h3', '0.0'],
        ],
        outro: ['Weak choices get a warning –', 'nothing enters your repertoire without your OK.'],
      },
      CTA_TRAP,
    ],
    caption: `
The worst thing you can do: memorize a bad move perfectly. 😅

When ChessTrainer hits a position that isn't in your repertoire yet, it shows you:
📊 Engine evaluation (Lichess cloud analysis)
👥 How often each move is played
🏆 How well it scores

Pick a move, get a warning if it's dubious, and only then save it.

👉 Link in bio`,
    hashtags: [...BASE_TAGS, '#sicilian', '#openingrepertoire', '#chessengine'],
  },

  {
    id: 'install',
    slides: [
      {
        type: 'steps',
        kicker: 'No app store needed',
        title: ['Install in', '10 seconds.'],
        steps: [
          ['Open the link in Safari', ['lucadbr.github.io/ChessTrainer']],
          ['Tap “Share”', ['The square with the arrow.']],
          ['“Add to Home Screen”', ['Full screen, works offline.', 'Updates itself automatically.']],
        ],
        note: ['Android: open in Chrome → “Install app”.'],
      },
      {
        type: 'cta',
        title: ['Your openings,', 'in your pocket.'],
        body: ['Free web app – no account needed.'],
      },
    ],
    caption: `
No app store, no download, no account. 📱

How to install ChessTrainer:
1️⃣ Open the link in Safari (iPhone) or Chrome (Android)
2️⃣ iPhone: Share → "Add to Home Screen"
   Android: "Install app"
3️⃣ Done – it opens full screen and works offline

👉 Link in bio`,
    hashtags: [...BASE_TAGS, '#chessapp', '#webapp', '#iphonetips'],
  },

  {
    id: 'why',
    slides: [
      {
        type: 'text',
        kicker: 'Why I built this',
        title: ['I kept losing', 'the same openings.'],
        body: [
          'Courses are expensive. Apps want subscriptions.',
          'So I built my own trainer: free, simple,',
          'and powered by the Lichess database.',
        ],
        pill: 'Follow for opening tips',
      },
    ],
    caption: `
Hi, I'm Luca 👋

I kept falling into the same opening traps and forgetting lines I had studied. Courses are expensive, most apps want a subscription – so I built my own trainer.

ChessTrainer is free and runs right in your browser. It's still early, so I'd love your feedback: what would make it more useful for you? 💬

Follow @chesstrainerapp for opening traps & tips ♟`,
    hashtags: [...BASE_TAGS, '#buildinpublic', '#indiedev', '#chesscommunity'],
  },
]
