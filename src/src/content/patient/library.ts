/**
 * NEUROPATHIC PAIN EDUCATION LIBRARY — all library text lives here.
 *
 * Editorial rules:
 * - Every article is general education, written in plain language from the
 *   listed public sources. No doses, diagnosis or individual advice.
 * - reviewStatus stays "awaiting-review" until a named clinician/pharmacist
 *   has actually reviewed it. Only then fill reviewedBy / reviewedAt.
 * - Never add a source that does not support the text it is attached to.
 * - Add translations only after review; the library is English-only for now.
 */

export type DiagramId = "signal" | "sensations" | "review" | "pathway";
export type ReviewStatus = "draft" | "awaiting-review" | "reviewed" | "published";
export type Source = { title: string; publisher: string; url: string };
export type ArticleBlock = { heading: string; paragraphs?: string[]; list?: string[] };
export type LibrarySectionId =
  | "understanding" | "assessment" | "causes" | "medicines" | "living"
  | "appointment" | "help" | "faq" | "glossary" | "checks";

export type Article = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: LibrarySectionId;
  content: ArticleBlock[];
  takeaways: string[];
  relatedArticles: string[];
  sources: Source[];
  /** Optional explanatory diagram shown with the article. */
  diagram?: DiagramId;
  reviewStatus: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  lastUpdated?: string;
  language: "en";
};

export type LibrarySection = {
  id: LibrarySectionId;
  letter: string;
  title: string;
  description: string;
  /** Sections with their own page instead of articles. */
  page?: "/patient/library/help" | "/patient/library/faq" | "/patient/library/glossary" | "/patient/library/checks" | "/patient/library/checklist";
};

export const reviewStatusLabel: Record<ReviewStatus, string> = {
  draft: "Draft",
  "awaiting-review": "Educational content — awaiting clinical review",
  reviewed: "Clinically reviewed",
  published: "Published",
};

export const libraryIntro = {
  eyebrow: "Education library",
  title: "Understanding neuropathic pain",
  text: "Short, plain-language articles to help you understand nerve pain, prepare for appointments and know when to ask for help. Read in any order — each article stands on its own.",
  notice:
    "This library is for general education only. It cannot diagnose a condition or recommend a treatment, and it is not an emergency service. Do not start, stop, change or combine medicines based on this website — speak to your doctor or pharmacist.",
  languageNote: "Available in English, Hindi, Kannada, Marathi and Urdu. Translations other than English are drafts awaiting language and clinical review.",
};

// Trusted public sources (links checked when added).
const S = {
  nhsPN: { title: "Peripheral neuropathy", publisher: "NHS", url: "https://www.nhs.uk/conditions/peripheral-neuropathy/" },
  nhsPHN: { title: "Post-herpetic neuralgia", publisher: "NHS", url: "https://www.nhs.uk/conditions/post-herpetic-neuralgia/" },
  nhsShingles: { title: "Shingles", publisher: "NHS", url: "https://www.nhs.uk/conditions/shingles/" },
  nhsCTS: { title: "Carpal tunnel syndrome", publisher: "NHS", url: "https://www.nhs.uk/conditions/carpal-tunnel-syndrome/" },
  nhsDiabetes: { title: "Diabetes", publisher: "NHS", url: "https://www.nhs.uk/conditions/diabetes/" },
  nhsSleep: { title: "Sleep and tiredness", publisher: "NHS", url: "https://www.nhs.uk/live-well/sleep-and-tiredness/" },
  nhsMental: { title: "Mental health", publisher: "NHS", url: "https://www.nhs.uk/mental-health/" },
  mlpPND: { title: "Peripheral nerve disorders", publisher: "MedlinePlus (US National Library of Medicine)", url: "https://medlineplus.gov/peripheralnervedisorders.html" },
  mlpDNP: { title: "Diabetic nerve problems", publisher: "MedlinePlus (US National Library of Medicine)", url: "https://medlineplus.gov/diabeticnerveproblems.html" },
  mlpChronic: { title: "Chronic pain", publisher: "MedlinePlus (US National Library of Medicine)", url: "https://medlineplus.gov/chronicpain.html" },
  mlpPain: { title: "Pain", publisher: "MedlinePlus (US National Library of Medicine)", url: "https://medlineplus.gov/pain.html" },
  mlpMeds: { title: "Medicines", publisher: "MedlinePlus (US National Library of Medicine)", url: "https://medlineplus.gov/medicines.html" },
  mlpNCV: { title: "Nerve conduction velocity", publisher: "MedlinePlus (US National Library of Medicine)", url: "https://medlineplus.gov/ency/article/003927.htm" },
  mlpTalk: { title: "Talking with your doctor", publisher: "MedlinePlus (US National Library of Medicine)", url: "https://medlineplus.gov/talkingwithyourdoctor.html" },
  nhsTreat: { title: "Peripheral neuropathy — treatment", publisher: "NHS", url: "https://www.nhs.uk/conditions/peripheral-neuropathy/treatment/" },
  niceAbout: { title: "Neuropathic pain in adults — information for the public (UK guidance, CG173)", publisher: "NICE", url: "https://www.nice.org.uk/guidance/cg173/ifp/chapter/About-this-information" },
  niceQs: { title: "Questions to ask about drug treatments for neuropathic pain (UK guidance, CG173)", publisher: "NICE", url: "https://www.nice.org.uk/guidance/cg173/ifp/chapter/questions-to-ask-about-drug-treatments-for-neuropathic-pain" },
  ninds: { title: "Peripheral neuropathy", publisher: "National Institute of Neurological Disorders and Stroke", url: "https://www.ninds.nih.gov/health-information/disorders/peripheral-neuropathy" },
} satisfies Record<string, Source>;

export const librarySections: LibrarySection[] = [
  { id: "understanding", letter: "A", title: "Understanding nerve pain", description: "What neuropathic pain is, how it can feel and how it can affect daily life." },
  { id: "assessment", letter: "B", title: "Symptoms and clinical assessment", description: "How healthcare professionals usually ask about and examine symptoms." },
  { id: "causes", letter: "C", title: "Causes and related conditions", description: "Conditions that can be linked with nerve pain — and why the cause is not always clear straight away." },
  { id: "medicines", letter: "D", title: "Medicines and medicine safety", description: "General ideas about medicine reviews, side effects and interactions." },
  { id: "living", letter: "E", title: "Living with neuropathic pain", description: "Sleep, daily activities, safety, describing symptoms and wellbeing." },
  { id: "appointment", letter: "F", title: "Preparing for a healthcare appointment", description: "What to bring and what to ask, with a printable checklist.", page: "/patient/library/checklist" },
  { id: "help", letter: "G", title: "When to seek medical help", description: "Where to turn and how quickly, depending on what is happening.", page: "/patient/library/help" },
  { id: "faq", letter: "H", title: "Frequently asked questions", description: "Short answers to common questions.", page: "/patient/library/faq" },
  { id: "glossary", letter: "I", title: "Medical glossary", description: "Health words explained simply.", page: "/patient/library/glossary" },
  { id: "checks", letter: "J", title: "Learning checks", description: "A few quick questions to check your understanding. Nothing is saved.", page: "/patient/library/checks" },
];

const base = { reviewStatus: "awaiting-review" as const, language: "en" as const };

export const articles: Article[] = [
  // ---------------- A. Understanding nerve pain
  {
    ...base, id: "a1", slug: "what-is-neuropathic-pain", diagram: "signal", category: "understanding",
    title: "What is neuropathic pain?",
    summary: "Pain that comes from a problem with the nerves themselves, explained in plain language.",
    content: [
      { heading: "Nerves carry messages", paragraphs: [
        "Your nerves carry information between your body and your brain and spinal cord. Sensory nerves carry feelings such as touch and pain. Motor nerves control muscles. Autonomic nerves help control automatic body functions such as blood pressure and bladder function.",
      ] },
      { heading: "When nerves are affected", paragraphs: [
        "Healthcare professionals describe neuropathic pain as pain caused by damage or disease affecting the somatosensory nervous system — the parts of the nervous system that carry and process feelings such as touch, temperature and pain. In everyday words, it is pain that comes from a problem with the nerves themselves, rather than from an injury to skin, muscle or joints. When nerves are damaged or not working normally, they can send pain or unusual signals even when there is no new injury.",
      ] },
      { heading: "Everyone's experience is different", paragraphs: [
        "Which symptoms a person has depends on which nerves are affected, and pain is experienced differently by different people. Two people with similar nerve problems can describe their pain very differently.",
        "Online information, including this library, cannot tell you whether you have neuropathic pain. Only a healthcare professional who has assessed you can do that.",
      ] },
    ],
    takeaways: [
      "Neuropathic pain comes from a problem with the nerves themselves.",
      "Symptoms depend on which nerves are affected and vary between people.",
      "A diagnosis needs an assessment by a healthcare professional.",
    ],
    relatedArticles: ["how-nerve-pain-can-feel", "describing-your-symptoms", "medicine-reviews"],
    sources: [S.nhsPN, S.mlpPND, S.ninds, S.niceAbout],
  },
  {
    ...base, id: "a2", slug: "how-nerve-pain-can-feel", diagram: "sensations", category: "understanding",
    title: "How can nerve pain feel?",
    summary: "Words people often use to describe nerve pain — and why no single symptom proves it.",
    content: [
      { heading: "Words people use", paragraphs: ["People with nerve problems describe sensations such as:"], list: [
        "Burning, stabbing or shooting pain",
        "Tingling or pins and needles",
        "Electric-shock-like feelings",
        "Numbness or loss of feeling",
        "Skin that is very sensitive, so that light touch, pressure or temperature changes are painful",
      ] },
      { heading: "Why nerve pain can feel different", paragraphs: [
        "When nerves are not working normally, the signals they send can change. Some signals may become stronger or happen without a usual trigger, which can be felt as pain or tingling. Other signals may become weaker or stop, which can be felt as numbness. Some people with nerve conditions notice both pain and reduced feeling at the same time.",
      ] },
      { heading: "Symptoms vary", paragraphs: [
        "These feelings may be constant or may come and go. Not everyone has all of them, and some people also notice weakness or problems with balance.",
        "Having one of these sensations does not prove that a person has neuropathic pain — other conditions can cause similar feelings. Describing them clearly to your healthcare professional helps them assess you.",
      ] },
    ],
    takeaways: [
      "Nerve pain is often described as burning, shooting, tingling or electric-shock-like.",
      "Not every person has every symptom, and symptoms can come and go.",
      "A symptom on its own does not confirm the cause.",
    ],
    relatedArticles: ["nerve-pain-vs-other-pain", "describing-your-symptoms"],
    sources: [S.nhsPN, S.nhsPHN],
  },
  {
    ...base, id: "a3", slug: "nerve-pain-vs-other-pain", category: "understanding",
    title: "Neuropathic pain and other kinds of pain",
    summary: "A simple, general comparison — and why symptoms alone cannot tell the cause.",
    content: [
      { heading: "Two broad ideas", paragraphs: [
        "Some pain happens because tissue such as skin, muscle or a joint is injured or inflamed — for example after a cut or a sprain. This kind of pain usually relates to the injury and often eases as it heals.",
        "Neuropathic pain comes from a problem in the nerves themselves. It can continue even when there is no new injury, and it is often described with words such as burning, shooting or tingling.",
      ] },
      { heading: "They can overlap", paragraphs: [
        "These are general ideas, not strict boxes. A person can have more than one type of pain at the same time, and the descriptions overlap. Standard painkillers often do not work well for nerve pain, which is one reason a healthcare professional will want to understand what kind of pain you have.",
        "Symptoms alone cannot reliably show the cause of pain. A healthcare professional considers your history, an examination and sometimes tests.",
      ] },
    ],
    takeaways: [
      "Pain from injured tissue and pain from nerve problems are different general ideas.",
      "They can overlap, and a person can have both.",
      "Only a professional assessment can work out the likely cause.",
    ],
    relatedArticles: ["how-assessment-works", "why-nerve-pain-medicines-differ"],
    sources: [S.nhsPN, S.mlpPain, S.mlpChronic],
  },
  {
    ...base, id: "a4", slug: "nerve-pain-and-daily-life", category: "understanding",
    title: "How nerve pain can affect daily life",
    summary: "Possible effects on sleep, movement, work, mood and time with others.",
    content: [
      { heading: "Possible effects", paragraphs: ["Long-lasting pain can affect people in different ways. Some people notice effects on:"], list: [
        "Sleep and feeling rested",
        "Walking, balance and movement",
        "Household tasks, work and daily routines",
        "Comfort and concentration",
        "Mood and emotional wellbeing",
        "Social activities and quality of life",
      ] },
      { heading: "Your experience matters", paragraphs: [
        "Not everyone is affected in all of these ways. Telling your healthcare team which areas of life are affected for you helps them understand the impact of your pain and plan care with you.",
      ] },
    ],
    takeaways: [
      "Nerve pain can affect sleep, movement, mood and daily activities.",
      "The impact is different for each person.",
      "Sharing how it affects you helps your healthcare team.",
    ],
    relatedArticles: ["sleep-and-rest", "emotional-wellbeing", "describing-your-symptoms"],
    sources: [S.mlpChronic, S.nhsPHN],
  },

  // ---------------- B. Assessment
  {
    ...base, id: "b1", slug: "describing-your-symptoms", category: "assessment",
    title: "Preparing to describe your symptoms",
    summary: "What to note about where, when and how your symptoms happen.",
    content: [
      { heading: "Useful things to note", paragraphs: ["Before an appointment it can help to think about:"], list: [
        "Where you feel the symptoms, and whether they spread",
        "When they started and whether they are getting better, worse or staying the same",
        "Whether they are constant or come and go, and what makes them better or worse",
        "What the feeling is like, in your own words",
        "How they affect sleep, work, walking and daily activities",
        "Other health conditions you have and all medicines you take, including supplements",
      ] },
      { heading: "A pain diary", paragraphs: [
        "Some people keep a short daily note of their pain. This can help you and your healthcare professional see whether symptoms or treatments are changing over time. You do not need to enter any of this on this website.",
      ] },
    ],
    takeaways: [
      "Note where, when and how your symptoms happen.",
      "Bring a list of your health conditions and medicines.",
      "A simple pain diary can show changes over time.",
    ],
    relatedArticles: ["how-assessment-works", "appointment-preparation"],
    sources: [S.nhsPHN, S.mlpTalk],
  },
  {
    ...base, id: "b2", slug: "how-assessment-works", category: "assessment",
    title: "How healthcare professionals assess nerve symptoms",
    summary: "Questions, examination and why tests differ from person to person.",
    content: [
      { heading: "Questions you may be asked", paragraphs: [
        "A doctor will usually ask about your symptoms, your general health, other conditions such as diabetes, alcohol use and the medicines you take.",
      ] },
      { heading: "Examination", paragraphs: [
        "They may examine you to check things such as sensation, muscle strength, reflexes and balance.",
      ] },
      { heading: "Tests vary", paragraphs: [
        "Depending on the situation, they may arrange tests to help find an underlying cause — for example blood tests, or a nerve conduction study, which measures how fast electrical signals move along a nerve. Not everyone needs the same tests. Some people are referred to a specialist in nerve conditions (a neurologist).",
      ] },
      { heading: "Follow-up", paragraphs: [
        "Nerve symptoms and their treatment are often reviewed over time. Check-ups help see whether things are changing and whether any treatment is helping or causing side effects.",
      ] },
      { heading: "Preparing for your assessment", paragraphs: [
        "Use the appointment checklist in this library to gather your medicines, symptoms and questions before you go.",
      ] },
    ],
    takeaways: [
      "Assessment usually includes questions and an examination.",
      "Tests depend on your situation — not everyone has the same ones.",
      "Follow-up is common because symptoms and treatments are reviewed over time.",
    ],
    relatedArticles: ["describing-your-symptoms", "appointment-preparation"],
    sources: [S.nhsPN, S.mlpNCV, S.nhsPHN],
  },

  // ---------------- C. Causes
  {
    ...base, id: "c1", slug: "peripheral-neuropathy", category: "causes",
    title: "Peripheral neuropathy",
    summary: "Damage to nerves outside the brain and spinal cord, often in the hands and feet.",
    content: [
      { heading: "What it is", paragraphs: [
        "Peripheral neuropathy develops when nerves in the body's extremities, such as the hands, feet and arms, are damaged. The symptoms depend on which nerves are affected.",
      ] },
      { heading: "Possible causes", paragraphs: ["It has many possible causes, including:"], list: [
        "Diabetes",
        "Physical injury to nerves",
        "Viral infections such as shingles",
        "Side effects of certain medicines, or drinking too much alcohol",
      ] },
      { heading: "The cause is not always found straight away", paragraphs: [
        "Sometimes the cause takes time to find, and not every cause can be treated. Some people improve if the underlying cause is treated; for others, care focuses on managing symptoms. Symptoms can overlap with other conditions, so assessment by a healthcare professional is important.",
      ] },
    ],
    takeaways: [
      "Peripheral neuropathy is damage to nerves outside the brain and spinal cord.",
      "It has many possible causes, and the cause is not always clear at first.",
      "Early assessment can help limit complications.",
    ],
    relatedArticles: ["diabetes-and-nerves", "how-assessment-works"],
    sources: [S.nhsPN, S.mlpPND, S.ninds],
  },
  {
    ...base, id: "c2", slug: "diabetes-and-nerves", category: "causes",
    title: "Diabetes and nerve problems",
    summary: "How high blood sugar over time can affect nerves, and why foot checks matter.",
    content: [
      { heading: "How diabetes can affect nerves", paragraphs: [
        "Over time, high blood sugar levels linked with diabetes can damage nerves. Nerve damage in the feet and legs is a common type. It is known as diabetic polyneuropathy.",
      ] },
      { heading: "Why checks matter", paragraphs: [
        "People with diabetes are advised to have regular check-ups, including checks of their feet. Reduced feeling can mean a cut or sore is not noticed. A cut or ulcer on the foot that is not getting better should be checked by a healthcare professional.",
      ] },
      { heading: "Talk to your diabetes team", paragraphs: [
        "Your diabetes team can explain how your own blood sugar, check-ups and any nerve symptoms are being looked after.",
      ] },
    ],
    takeaways: [
      "Diabetes is a common cause of nerve damage.",
      "Regular check-ups, including foot checks, are recommended.",
      "A foot cut or ulcer that is not healing needs to be checked.",
    ],
    relatedArticles: ["peripheral-neuropathy", "comfort-and-safety"],
    sources: [S.nhsPN, S.mlpDNP, S.nhsDiabetes],
  },
  {
    ...base, id: "c3", slug: "nerve-compression-and-injury", category: "causes",
    title: "Nerve compression and injury",
    summary: "When a nerve is squeezed or injured — carpal tunnel syndrome is one example.",
    content: [
      { heading: "Squeezed or injured nerves", paragraphs: [
        "A nerve can be affected if it is injured or put under pressure. Carpal tunnel syndrome is a common example, where pressure on a nerve in the wrist can cause tingling, numbness and pain in the hand and fingers.",
      ] },
      { heading: "Getting it checked", paragraphs: [
        "Similar symptoms can have other causes. A healthcare professional can assess where the problem may be and what might help.",
      ] },
    ],
    takeaways: [
      "Pressure on or injury to a nerve can cause nerve symptoms.",
      "Carpal tunnel syndrome is one common example.",
      "Similar symptoms can have different causes.",
    ],
    relatedArticles: ["peripheral-neuropathy", "how-assessment-works"],
    sources: [S.nhsCTS, S.nhsPN],
  },
  {
    ...base, id: "c4", slug: "pain-after-shingles", category: "causes",
    title: "Nerve pain after shingles",
    summary: "Post-herpetic neuralgia: long-lasting pain where the shingles rash was.",
    content: [
      { heading: "What it is", paragraphs: [
        "Post-herpetic neuralgia is long-lasting pain that can happen after shingles. It is caused by damage to nerves from shingles and affects the area where the rash was.",
      ] },
      { heading: "How it can feel", list: [
        "Aching, burning or sharp pain that may be constant or come and go",
        "Skin that is very sensitive to light touch, pressure or temperature changes",
        "Itching or loss of feeling in the skin",
      ] },
      { heading: "What to expect", paragraphs: [
        "It usually gets better gradually, but this can take from a few months to over a year. If you have had shingles and pain where the rash was is not getting better, see a doctor.",
      ] },
    ],
    takeaways: [
      "Post-herpetic neuralgia is nerve pain that can follow shingles.",
      "It usually improves gradually, though this can take a long time.",
      "See a doctor if pain after shingles is not getting better.",
    ],
    relatedArticles: ["how-nerve-pain-can-feel", "medicine-reviews"],
    sources: [S.nhsPHN, S.nhsShingles],
  },

  // ---------------- D. Medicines
  {
    ...base, id: "d1", slug: "medicine-reviews", diagram: "review", category: "medicines",
    title: "Why your medicines may be reviewed",
    summary: "What a medicine review is and why it can help.",
    content: [
      { heading: "What a medicine review is", paragraphs: [
        "A medicine review is a structured look at all the medicines a person is using, with a doctor or pharmacist. It checks whether each medicine is still needed, whether it is helping, and whether there are side effects or combinations that need attention.",
      ] },
      { heading: "What to bring", list: [
        "All your medicines, or a list with their names and how you take them",
        "Supplements, herbal and over-the-counter products",
        "Recent prescriptions or discharge letters, if you have them",
        "Any questions or worries about your medicines",
      ] },
    ],
    takeaways: [
      "A medicine review checks that each medicine is still right and working.",
      "Bring every medicine and supplement you take.",
      "Write down your questions beforehand.",
    ],
    relatedArticles: ["side-effects-and-interactions", "appointment-preparation"],
    sources: [S.mlpMeds, S.mlpTalk],
  },
  {
    ...base, id: "d2", slug: "why-nerve-pain-medicines-differ", category: "medicines",
    title: "Why medicines for nerve pain can differ",
    summary: "Why everyday painkillers often do not help nerve pain, and why change takes time.",
    content: [
      { heading: "Different medicines", paragraphs: [
        "Standard painkillers often do not work well for nerve pain, so doctors sometimes prescribe medicines designed for nerve pain instead. Which medicine — if any — is suitable depends on the person and must be decided by their prescriber.",
      ] },
      { heading: "Effects can take time", paragraphs: [
        "Medicines for nerve pain may not work straight away, and the prescriber usually reviews how well they are working and whether there are side effects.",
      ] },
      { heading: "Learn about specific medicines", paragraphs: [
        "General information about individual medicines is in the “Your medicines” catalogue on the patient education page.",
      ] },
    ],
    takeaways: [
      "Everyday painkillers often do not relieve nerve pain.",
      "Medicines for nerve pain may take time and are reviewed by the prescriber.",
      "Only your prescriber can decide what is suitable for you.",
    ],
    relatedArticles: ["medicine-reviews", "questions-about-medicines"],
    sources: [S.nhsPN, S.nhsTreat, S.nhsPHN, S.niceAbout],
  },
  {
    ...base, id: "d3", slug: "side-effects-and-interactions", category: "medicines",
    title: "Side effects, adherence and interactions",
    summary: "General ideas that help you talk with your doctor or pharmacist about medicines.",
    content: [
      { heading: "Effects and side effects", paragraphs: [
        "Medicines have effects they are meant to have, and sometimes unwanted effects called side effects. If you notice something that worries you, talk to your doctor or pharmacist.",
      ] },
      { heading: "Adherence", paragraphs: [
        "Adherence means taking a medicine the way you and your prescriber agreed. If that is hard — because of side effects, cost or routine — tell your healthcare team rather than changing it yourself.",
      ] },
      { heading: "Interactions", paragraphs: [
        "A drug interaction is when one medicine, supplement, food or drink changes how another medicine works or increases side effects. This is why your healthcare team needs to know about everything you take, including supplements and herbal products.",
      ] },
      { heading: "Changes need professional guidance", paragraphs: [
        "Do not start, stop, change or combine medicines based on information from this website. For any concern about your medicines, speak to your doctor or pharmacist.",
      ] },
    ],
    takeaways: [
      "Tell your healthcare team about side effects that worry you.",
      "Tell them about every medicine and supplement you take.",
      "Never change medicines based only on website information.",
    ],
    relatedArticles: ["medicine-reviews", "appointment-preparation"],
    sources: [S.mlpMeds],
  },

  {
    ...base, id: "d4", slug: "questions-about-medicines", category: "medicines",
    title: "Questions to ask about your medicines",
    summary: "A list of questions you may want to ask when a medicine for nerve pain is offered or reviewed.",
    content: [
      { heading: "Why ask questions?", paragraphs: [
        "Understanding why a medicine has been offered, what to expect and what to look out for can help you take part in decisions about your care. The questions below are adapted from public information published by NICE, the UK's National Institute for Health and Care Excellence. They come from UK guidance, so local practice in India may differ — your own healthcare team can explain what applies to you.",
      ] },
      { heading: "About the pain and the treatment", list: [
        "What is causing the pain?",
        "Why have you offered me this particular treatment?",
        "What are the possible benefits and risks of this medicine?",
        "What improvements might I expect in my symptoms and everyday life?",
        "What other options are there apart from medicines?",
      ] },
      { heading: "Taking the medicine", list: [
        "When should I take it?",
        "When should I start to feel better, and what should I do if I don't?",
        "What are the possible side effects, and what should I do if I get any?",
        "How long will I need to take it, and might I have problems when stopping?",
      ] },
      { heading: "Follow-up", list: [
        "What should I do if the pain becomes much worse?",
        "When is my next appointment?",
      ] },
    ],
    takeaways: [
      "You can ask why a medicine is offered and what to expect.",
      "Ask about side effects and what to do if they happen.",
      "Ask when your treatment will be reviewed.",
    ],
    relatedArticles: ["medicine-reviews", "side-effects-and-interactions", "appointment-preparation"],
    sources: [S.niceQs, S.niceAbout],
  },

  // ---------------- E. Living with neuropathic pain
  {
    ...base, id: "e1", slug: "sleep-and-rest", category: "living",
    title: "Sleep and rest",
    summary: "How pain can affect sleep and what you might discuss with your healthcare team.",
    content: [
      { heading: "Pain and sleep", paragraphs: [
        "Long-lasting pain can make it harder to fall asleep or stay asleep, and poor sleep can leave you tired during the day.",
      ] },
      { heading: "Things to discuss", list: [
        "How often your sleep is disturbed and why",
        "How tired you feel during the day",
        "Whether any medicine seems to affect your sleep or alertness",
      ] },
      { heading: "General sleep information", paragraphs: [
        "General advice on sleep and tiredness is available from trusted sources. These tips are not a treatment for nerve pain; your healthcare team can advise what suits you.",
      ] },
    ],
    takeaways: [
      "Pain can disturb sleep and cause daytime tiredness.",
      "Tell your healthcare team how your sleep is affected.",
    ],
    relatedArticles: ["nerve-pain-and-daily-life", "emotional-wellbeing"],
    sources: [S.nhsSleep, S.mlpChronic],
  },
  {
    ...base, id: "e2", slug: "daily-activities", category: "living",
    title: "Daily activities and pacing",
    summary: "Balancing activity and rest, and talking about movement concerns.",
    content: [
      { heading: "Balancing activity and rest", paragraphs: [
        "Some people with long-lasting pain find it helps to spread activities through the day and plan rest, rather than doing a lot at once. What works is different for each person.",
      ] },
      { heading: "Talk to your team", paragraphs: [
        "If pain, weakness or balance problems make some activities difficult, tell your healthcare team. They may suggest support such as physiotherapy or walking aids where appropriate. This library does not prescribe exercises.",
      ] },
    ],
    takeaways: [
      "Spreading activities and planning rest helps some people.",
      "Discuss movement or balance difficulties with your healthcare team.",
    ],
    relatedArticles: ["comfort-and-safety", "nerve-pain-and-daily-life"],
    sources: [S.nhsPN, S.mlpChronic],
  },
  {
    ...base, id: "e3", slug: "comfort-and-safety", category: "living",
    title: "Comfort and everyday safety",
    summary: "General points for people with reduced feeling, sensitive skin or balance problems.",
    content: [
      { heading: "If feeling is reduced", paragraphs: [
        "Reduced feeling in the feet can mean injuries are not noticed. People at risk, such as those with diabetes, are advised to have regular checks. A cut or sore on the foot that is not getting better should be seen by a healthcare professional.",
      ] },
      { heading: "If skin is sensitive", paragraphs: [
        "For skin that is sensitive after shingles, the NHS suggests loose cotton or silk clothing and cool baths or showers. Ask your healthcare team which suggestions are suitable for you.",
      ] },
      { heading: "Balance", paragraphs: [
        "If you notice loss of balance or weakness, tell a healthcare professional.",
      ] },
      { heading: "Not every point applies to everyone", paragraphs: [
        "These are general points. Your healthcare team can tell you which precautions matter for your own situation.",
      ] },
    ],
    takeaways: [
      "Reduced feeling can hide injuries — have foot problems checked.",
      "Report loss of balance or weakness.",
      "Ask which precautions apply to you.",
    ],
    relatedArticles: ["diabetes-and-nerves", "pain-after-shingles"],
    sources: [S.nhsPN, S.nhsPHN],
  },
  {
    ...base, id: "e4", slug: "communicating-symptoms", category: "living",
    title: "Talking about your symptoms",
    summary: "Simple ways to explain what you feel so your healthcare team understands.",
    content: [
      { heading: "A simple structure", list: [
        "What: describe the feeling in your own words",
        "Where: show or name the parts of your body affected",
        "When: when it began and when it is worse",
        "Impact: what it stops you doing",
        "Concerns: what you would most like to ask about",
      ] },
      { heading: "It's fine to ask", paragraphs: [
        "If you do not understand something, ask your healthcare professional to explain it again or write it down. You may bring someone with you to an appointment.",
      ] },
    ],
    takeaways: [
      "Describe what, where, when, impact and concerns.",
      "Ask for explanations to be repeated or written down.",
    ],
    relatedArticles: ["describing-your-symptoms", "appointment-preparation"],
    sources: [S.mlpTalk],
  },
  {
    ...base, id: "e5", slug: "emotional-wellbeing", category: "living",
    title: "Emotional wellbeing",
    summary: "Pain is real, and it can affect how you feel. Support is available.",
    content: [
      { heading: "Pain is real", paragraphs: [
        "Long-lasting pain can affect mood, worry and energy. This does not mean the pain is imagined or caused only by stress.",
      ] },
      { heading: "Support", paragraphs: [
        "Talking therapies can help some people cope with pain. If you are struggling with how you feel, tell your healthcare team. If you ever feel unsafe or think about harming yourself, seek urgent help straight away.",
      ] },
    ],
    takeaways: [
      "Pain can affect emotional wellbeing — that does not mean it is imagined.",
      "Tell your healthcare team if you are struggling.",
      "Seek urgent help if you ever feel unsafe.",
    ],
    relatedArticles: ["nerve-pain-and-daily-life", "sleep-and-rest"],
    sources: [S.nhsMental, S.nhsPHN],
  },

  // ---------------- F. Appointment
  {
    ...base, id: "f1", slug: "appointment-preparation", category: "appointment",
    title: "Preparing for a healthcare appointment",
    summary: "What to bring, what to note and what to ask — with a printable checklist.",
    content: [
      { heading: "Before you go", list: [
        "Make a list of all current medicines and supplements, or bring them with you",
        "Bring recent prescriptions or letters if useful",
        "Note your symptoms and how they affect you",
        "Write down your questions, starting with the most important",
      ] },
      { heading: "During the appointment", list: [
        "Mention any medicine concerns, including side effects",
        "Ask what follow-up is needed",
        "Ask where to seek help if your symptoms change",
      ] },
    ],
    takeaways: [
      "Bring a full list of medicines and your questions.",
      "Ask about follow-up and what to do if things change.",
    ],
    relatedArticles: ["describing-your-symptoms", "medicine-reviews"],
    sources: [S.mlpTalk, S.mlpMeds],
  },
];

export type HelpGroup = { title: string; diagram?: "stroke" | "spine" | "allergy"; items: string[]; note?: string | undefined };
export type HelpLevel = { id: "emergency" | "prompt" | "routine"; level: string; title: string; action: string; groups: HelpGroup[] };

export const seekHelp = {
  title: "When to seek medical help",
  intro: [
    "Nerve pain and other nerve symptoms are often long-lasting and can usually be discussed at a planned appointment. Sometimes, though, new or changing symptoms need attention quickly. This page explains, in general terms, which situations need emergency help now, which need a prompt medical assessment, and which can wait for a routine appointment.",
    "No list can cover every situation. A symptom is not safe just because it is not mentioned here. If you are worried, or unsure how urgent something is, contact a healthcare professional.",
  ],
  disclaimer:
    "This page is general educational information. It is not a diagnosis, an emergency assessment or a substitute for advice from a healthcare professional who knows you. NeuroCare Connect is not an emergency service and cannot tell you whether you or someone else is safe.",
  emergencyNumber: "112",
  emergencyPanel: {
    title: "In an emergency in India, call 112",
    text: "112 is India's national emergency number. If you think someone's life may be in danger, call 112 or go to the nearest hospital emergency department straight away. Do not wait to see if symptoms improve, and do not use this website to decide.",
  },
  levels: [
    {
      id: "emergency",
      level: "Emergency — get help now",
      title: "Call 112 or go to the nearest emergency department",
      action: "These symptoms can be signs of a serious problem that needs treatment immediately.",
      groups: [
        {
          title: "Sudden changes that could be a stroke",
          diagram: "stroke",
          items: [
            "The face suddenly drooping on one side, or being unable to smile evenly",
            "Sudden weakness or numbness in an arm or leg, especially on one side of the body",
            "Sudden difficulty speaking, slurred speech or trouble understanding others",
            "Sudden loss of vision, severe dizziness, loss of balance or a sudden severe headache",
          ],
          note: "Note the time the symptoms started — this helps the emergency team. Call 112 even if the symptoms seem to settle.",
        },
        {
          title: "Severe back pain with bladder, bowel or saddle-area changes",
          diagram: "spine",
          items: [
            "New difficulty passing urine, or being unable to control your bladder",
            "New loss of control of your bowels",
            "Numbness or tingling between the legs, around the genitals or the buttocks (the 'saddle area')",
            "New weakness or numbness in both legs, especially with back pain",
          ],
          note: "These can be signs of pressure on the nerves at the bottom of the spine, which needs urgent hospital assessment.",
        },
        {
          title: "A severe allergic reaction (anaphylaxis)",
          diagram: "allergy",
          items: [
            "Swelling of the lips, mouth, tongue or throat",
            "Difficulty breathing, wheezing, fast breathing or a tight throat",
            "Feeling faint, confused or very drowsy, or collapsing",
            "A rash or skin swelling together with any of the problems above",
          ],
          note: "This can happen after a new medicine, food or insect sting. Suspected anaphylaxis is always an emergency.",
        },
        {
          title: "Rapidly worsening weakness, breathing or swallowing",
          items: [
            "Weakness in the legs or arms that is spreading or getting worse over hours or days",
            "New difficulty breathing or feeling unable to take a full breath",
            "New difficulty swallowing or choking on food or drinks",
          ],
        },
      ],
    },
    {
      id: "prompt",
      level: "Prompt — within a day or two",
      title: "Contact your doctor or healthcare team soon",
      action: "These situations are not usually an emergency, but should be checked soon rather than waiting for a routine appointment. If they become severe or come on suddenly, treat them as an emergency.",
      groups: [
        {
          title: "New or worsening nerve symptoms",
          items: [
            "New pain, tingling, burning, pins and needles or numbness, particularly in the feet or hands",
            "Symptoms that are spreading or clearly getting worse",
            "New muscle weakness, cramps or twitching",
          ],
        },
        {
          title: "Balance problems or falls",
          items: [
            "Feeling unsteady on your feet, especially in the dark",
            "Falling or nearly falling more often than before",
          ],
        },
        {
          title: "Foot wounds or possible infection",
          items: [
            "A cut, blister, sore or ulcer on the foot that is not healing",
            "Redness, warmth, swelling, discharge or a bad smell from a foot wound",
            "Feeling feverish or unwell with a foot wound",
          ],
          note: "Do not ignore a new foot wound, especially if you have diabetes or reduced feeling in your feet — you may not feel it getting worse.",
        },
        {
          title: "Pain after shingles",
          items: ["Pain in the area of a shingles rash that is still present after the rash has healed, or is getting worse"],
        },
        {
          title: "Medicine side effects that worry you",
          items: [
            "Side effects such as marked drowsiness, dizziness, confusion, unsteadiness or changes in mood",
            "Any side effect that is making daily life difficult",
          ],
          note: "Do not stop or change a medicine on your own unless a healthcare professional tells you to. Side effects should be assessed according to how severe they are — signs of a severe allergic reaction are an emergency.",
        },
      ],
    },
    {
      id: "routine",
      level: "Routine — at your next appointment",
      title: "Book or discuss at a planned appointment",
      action: "These concerns matter and are worth raising. Seek help sooner if your symptoms change or get worse.",
      groups: [
        {
          title: "Ongoing concerns to discuss",
          items: [
            "Nerve symptoms that have been present for some time and are not changing",
            "Pain that is affecting your sleep, work, mood or daily activities",
            "Questions about whether your treatment is working, or worries about its side effects",
            "Wanting to talk through other treatment options or support",
            "Follow-up questions about test results or your care plan",
          ],
        },
      ],
    },
  ] as HelpLevel[],
  whileArranging: {
    title: "Safe steps while you arrange help",
    items: [
      "In an emergency, call 112 first. Stay with the person if you can.",
      "Do not drive yourself to hospital if you have emergency symptoms — ask someone else or wait for help.",
      "Do not give food, drink or medicines to someone who has difficulty swallowing or is very drowsy.",
      "Keep a list of the medicines you take, or take the packets with you.",
      "Write down when symptoms started and how they have changed.",
      "If you have a foot wound, keep it clean and covered and avoid walking on it more than needed until it is checked.",
    ],
  },
  decisionGuide: [
    { id: "emergency", label: "Emergency now", text: "Sudden, severe or life-threatening symptoms — call 112." },
    { id: "prompt", label: "Prompt assessment", text: "New or worsening symptoms — contact a doctor soon." },
    { id: "routine", label: "Routine appointment", text: "Stable, ongoing concerns — discuss at a planned visit." },
  ],
  decisionNote: "This guide explains the general difference between levels of urgency. It cannot decide for you. If in doubt, seek help sooner.",
  faqs: [
    { q: "My symptom isn't listed. Does that mean it is safe?", a: "No. This page gives examples only. If you feel very unwell or are worried, contact a healthcare professional, or call 112 in an emergency." },
    { q: "Can this website tell me whether I need to see a doctor?", a: "No. It provides general information only and cannot assess you. A healthcare professional needs to do that." },
    { q: "What number should I call in an emergency in India?", a: "Call 112, India's national emergency number. You can also go directly to the nearest hospital emergency department." },
    { q: "I think my medicine is causing side effects. Should I stop it?", a: "Not on your own. Contact your doctor or pharmacist for advice. If you have signs of a severe allergic reaction, such as swelling of the throat or difficulty breathing, call 112." },
    { q: "Why does a small foot wound matter?", a: "Reduced feeling in the feet means a wound can get worse without being noticed, and wounds can become infected. This is especially important for people with diabetes." },
    { q: "My nerve pain has been the same for months. Is it urgent?", a: "Stable, long-standing symptoms can usually be discussed at a routine appointment. Seek help sooner if anything changes or gets worse." },
  ],
  sources: [
    { title: "Peripheral neuropathy", publisher: "NHS", url: "https://www.nhs.uk/conditions/peripheral-neuropathy/" },
    { title: "Peripheral neuropathy — symptoms", publisher: "NHS", url: "https://www.nhs.uk/conditions/peripheral-neuropathy/symptoms/" },
    { title: "Peripheral neuropathy — treatment", publisher: "NHS", url: "https://www.nhs.uk/conditions/peripheral-neuropathy/treatment/" },
    { title: "Post-herpetic neuralgia", publisher: "NHS", url: "https://www.nhs.uk/conditions/post-herpetic-neuralgia/" },
    { title: "Anaphylaxis", publisher: "NHS", url: "https://www.nhs.uk/conditions/anaphylaxis/" },
    { title: "Suspected neurological conditions: recognition and referral — recommendations for adults (UK guidance, NG127)", publisher: "NICE", url: "https://www.nice.org.uk/guidance/ng127/chapter/recommendations-for-adults-aged-over-16" },
    { title: "Emergency Response Support System — 112", publisher: "Government of India", url: "https://112.gov.in/" },
  ] as Source[],
  reviewStatus: "awaiting-review" as ReviewStatus,
};

export const faqs: { q: string; a: string; related?: string }[] = [
  { q: "Is neuropathic pain the same as other pain?", a: "Not exactly. It comes from a problem with the nerves themselves, but it can overlap with other kinds of pain. A healthcare professional can assess what kind of pain you have.", related: "nerve-pain-vs-other-pain" },
  { q: "Can this website tell me if I have nerve pain?", a: "No. It provides general education only. A diagnosis needs an assessment by a healthcare professional.", related: "what-is-neuropathic-pain" },
  { q: "Why didn't my usual painkiller help?", a: "Standard painkillers often do not work well for nerve pain. Talk to your doctor or pharmacist rather than taking more or changing medicines yourself.", related: "why-nerve-pain-medicines-differ" },
  { q: "Should I stop a medicine if I get side effects?", a: "Do not stop or change a medicine based on this website. Contact your doctor or pharmacist, who can advise you safely.", related: "side-effects-and-interactions" },
  { q: "Will nerve pain go away?", a: "It depends on the cause and the person. Some causes improve with time or treatment; others are managed over the long term. Your healthcare team can explain your own situation.", related: "peripheral-neuropathy" },
  { q: "Does anything I do here get saved?", a: "No. The library does not need an account and does not save your searches, checklist ticks or answers." },
];

export const libraryGlossary: { term: string; text: string }[] = [
  { term: "Peripheral nervous system", text: "The network of nerves outside the brain and spinal cord." },
  { term: "Sensory nerves", text: "Nerves that carry feelings such as touch and pain." },
  { term: "Motor nerves", text: "Nerves that control muscles." },
  { term: "Autonomic nerves", text: "Nerves that help control automatic body functions such as blood pressure and bladder function." },
  { term: "Peripheral neuropathy", text: "Damage to nerves outside the brain and spinal cord, often affecting the hands and feet." },
  { term: "Diabetic polyneuropathy", text: "Nerve damage linked with high blood sugar levels in diabetes over time." },
  { term: "Post-herpetic neuralgia", text: "Long-lasting nerve pain in the area where a shingles rash was." },
  { term: "Nerve conduction study", text: "A test that measures how fast electrical signals move along a nerve." },
  { term: "Drug interaction", text: "When a medicine, supplement, food or drink changes how another medicine works or increases side effects." },
  { term: "Adherence", text: "Taking a medicine the way you and your prescriber agreed." },
];

export const learningChecks: { q: string; options: string[]; correct: number; explain: string; related: string }[] = [
  { q: "Neuropathic pain comes from…", options: ["A problem with the nerves themselves", "Only from cuts and bruises", "Always from stress"], correct: 0, explain: "Neuropathic pain comes from a problem with the nerves themselves.", related: "what-is-neuropathic-pain" },
  { q: "If a symptom on a website sounds like yours, does that mean you have that condition?", options: ["Yes", "No — a healthcare professional needs to assess you"], correct: 1, explain: "Symptoms overlap between conditions; only an assessment can tell the cause.", related: "nerve-pain-vs-other-pain" },
  { q: "What should you do if a medicine gives you side effects that worry you?", options: ["Stop it straight away on your own", "Talk to your doctor or pharmacist"], correct: 1, explain: "Changes to medicines need professional guidance.", related: "side-effects-and-interactions" },
  { q: "Why tell your healthcare team about supplements and herbal products?", options: ["They can interact with medicines", "It does not matter"], correct: 0, explain: "Supplements and herbal products can interact with medicines.", related: "side-effects-and-interactions" },
];

export const checklist = {
  title: "Appointment checklist",
  intro: "A little preparation can help you explain your concerns and make better use of your appointment. Use this checklist to organise your medicines, symptoms and questions. You can print it and take it with you.",
  temporaryNotice: "Your ticks are temporary. They are cleared when you leave or refresh this page, or when you reset the checklist.",
  groups: [
    {
      title: "Medicines to discuss",
      items: [
        "A current list of all my medicines, including prescription medicines and medicines bought without a prescription.",
        "My medicine names, strengths, doses and the times I take them, where known.",
        "Any vitamins, supplements, herbal products or other remedies I use.",
        "Any allergies or previous unwanted reactions to medicines.",
        "Any side effects, difficulties taking medicines or concerns I have noticed.",
        "Any recent changes to my medicines, including medicines started, stopped or changed by a healthcare professional.",
      ],
      note: "If possible, bring your medicine list, prescriptions, medicine packets or clear photographs of the labels. Include non-prescription products and supplements.",
    },
    {
      title: "Symptoms and daily-life concerns",
      items: [
        "Where my pain or other symptoms occur and how they feel, described in my own words.",
        "When my symptoms started and how often they happen.",
        "Anything that seems to make my symptoms better or worse.",
        "How my symptoms affect sleep, work, walking, daily activities or other parts of my life.",
        "Any changes in my symptoms or daily functioning since my last appointment.",
      ],
      note: "You do not need to use medical terminology. Describe what you experience in words that feel natural to you.",
    },
    {
      title: "Questions about treatment",
      items: [
        "Why this treatment or medicine is being considered and what it is intended to help with.",
        "What benefits or changes I might reasonably expect and how we will review whether the treatment is helping.",
        "What side effects or precautions I should know about, and what I should do if I experience a problem.",
        "What other treatment or management options may be suitable for me.",
        "Whether I need to follow any specific instructions about taking my medicines or what to do if I have difficulty taking them.",
      ],
      note: "If anything is unclear, ask your healthcare professional to explain it in simpler words or write down the important instructions. Do not change your medicines without appropriate professional advice.",
    },
  ],
  /** Optional prompts — not counted in progress. */
  beforeILeave: {
    title: "Before I leave, I want to know…",
    prompts: [
      "What follow-up do I need, and when?",
      "Who should I contact if my symptoms change or I have concerns about my medicines?",
      "Where can I find reliable information or written instructions after the appointment?",
    ],
  },
  reminder: {
    title: "You do not have to remember everything.",
    text: "Bring your notes and ask your questions at your own pace. If you do not understand something, ask your healthcare professional to explain it again. If you wish, you can bring a trusted family member, friend or carer for support.",
  },
  sources: [
    { title: "What to ask your doctor", publisher: "NHS", url: "https://www.nhs.uk/nhs-services/gps/what-to-ask-your-doctor/" },
    { title: "Outpatients and day patients", publisher: "NHS", url: "https://www.nhs.uk/nhs-services/hospitals/going-into-hospital/outpatients-and-day-patients/" },
    { title: "Keeping your medicines organized", publisher: "MedlinePlus (US National Library of Medicine)", url: "https://medlineplus.gov/ency/patientinstructions/000600.htm" },
    { title: "Questions to ask about drug treatments for neuropathic pain (UK guidance, CG173)", publisher: "NICE", url: "https://www.nice.org.uk/guidance/cg173/ifp/chapter/questions-to-ask-about-drug-treatments-for-neuropathic-pain" },
  ] as Source[],
};


/** Printable leaflets are assembled from the articles above — no duplicated text. */
export const leaflets: { id: string; title: string; summary: string; articleSlugs: string[] }[] = [
  { id: "understanding-neuropathic-pain", title: "Understanding neuropathic pain", summary: "What it is, how it can feel and how it can affect daily life.", articleSlugs: ["what-is-neuropathic-pain", "how-nerve-pain-can-feel", "nerve-pain-and-daily-life"] },
  { id: "questions-about-medicines", title: "Questions to ask about your medicines", summary: "Questions to bring when a medicine is offered or reviewed.", articleSlugs: ["questions-about-medicines", "side-effects-and-interactions"] },
  { id: "appointment-preparation", title: "Preparing for a healthcare appointment", summary: "What to bring, note and ask.", articleSlugs: ["appointment-preparation", "describing-your-symptoms"] },
  { id: "medication-review", title: "Medication review: what it means", summary: "What happens in a medicine review and what to bring.", articleSlugs: ["medicine-reviews"] },
];

export const articleBySlug = (slug: string) => articles.find((a) => a.slug === slug);
export const sectionById = (id: LibrarySectionId) => librarySections.find((s) => s.id === id);

export function readingMinutes(a: Article): number {
  const words = a.content.flatMap((b) => [b.heading, ...(b.paragraphs ?? []), ...(b.list ?? [])]).join(" ").split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** Related = explicit links first, then same-section articles. Only real slugs. */
export function relatedFor(a: Article, max = 3): Article[] {
  const out = a.relatedArticles.map(articleBySlug).filter((x): x is Article => !!x);
  for (const o of articles) if (out.length < max && o.category === a.category && o.slug !== a.slug && !out.includes(o)) out.push(o);
  return out.slice(0, max);
}

/** Public results exclude drafts. */
export const publicArticles = () => articles.filter((a) => a.reviewStatus !== "draft");
