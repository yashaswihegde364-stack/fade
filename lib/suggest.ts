interface Rule {
  keywords: string[];
  steps: string[];
}

const RULES: Rule[] = [
  {
    keywords: ["email", "inbox", "reply", "respond"],
    steps: [
      "Open your inbox and just read the subject lines. Don't reply yet.",
      "Open the one email and read it once, slowly.",
    ],
  },
  {
    keywords: ["write", "essay", "report", "doc", "draft", "blog", "post"],
    steps: [
      "Open the document and write one bad sentence. It just has to exist.",
      "Open a blank page and write the title, nothing else.",
    ],
  },
  {
    keywords: ["clean", "tidy", "room", "desk", "laundry", "dishes"],
    steps: [
      "Pick up 5 things. Nothing more.",
      "Clear one surface, the size of a dinner plate.",
    ],
  },
  {
    keywords: ["call", "phone", "ring"],
    steps: [
      "Find the number and have it ready on screen.",
      "Write the first sentence you'll say when they pick up.",
    ],
  },
  {
    keywords: ["code", "bug", "fix", "build", "deploy", "pr", "pull request", "ticket"],
    steps: [
      "Open the file and read the first 10 lines.",
      "Reproduce the problem once, then stop.",
    ],
  },
  {
    keywords: ["read", "book", "study", "chapter", "notes", "revise", "exam"],
    steps: [
      "Open to the page and read one paragraph.",
      "Read just the headings of the chapter.",
    ],
  },
  {
    keywords: ["exercise", "workout", "gym", "run", "walk", "yoga"],
    steps: ["Put on the clothes. That's the whole first step.", "Fill the water bottle and set it by the door."],
  },
  {
    keywords: ["apply", "job", "resume", "cv", "application", "interview"],
    steps: [
      "Open the job posting and just read it once.",
      "Open your resume file and look at it for 30 seconds.",
    ],
  },
  {
    keywords: ["taxes", "finance", "budget", "bill", "invoice", "bank"],
    steps: [
      "Open the one document or app, don't calculate anything yet.",
      "Find the number you need and write it on a sticky note.",
    ],
  },
  {
    keywords: ["cook", "dinner", "meal", "recipe", "groceries"],
    steps: ["Take out one ingredient and put it on the counter.", "Open the recipe and read the first step only."],
  },
];

const GENERIC_STEPS = [
  "Open whatever it is and look at it for 60 seconds. Nothing else required.",
  "Set a timer for 2 minutes and just begin, however badly.",
  "Do the smallest physical motion to start: open the tab, the app, the drawer.",
  "Touch the task for one minute. That's the entire goal.",
  "Write down the very next tiny action, then do only that.",
];

export function suggestFirstStep(task: string): string {
  const t = task.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => t.includes(k))) {
      return rule.steps[Math.floor(Math.random() * rule.steps.length)];
    }
  }
  return GENERIC_STEPS[Math.floor(Math.random() * GENERIC_STEPS.length)];
}
