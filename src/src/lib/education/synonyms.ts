import type { PatientLang } from "@/i18n/patient-languages";

// Maintained matching vocabulary for Ask NeuroCare. These are search terms,
// not diagnostic rules: they only decide which existing page to show.
// Non-English terms are drafts awaiting linguistic review.

type PerLang = Record<PatientLang, string[]>;

/** Concept → knowledge-base entry id → terms in every language. */
export const conceptSynonyms: Record<string, PerLang> = {
  "neuropathic-pain": {
    en: ["nerve pain", "neuropathic", "neuropathy", "burning pain", "nerve damage", "pins and needles"],
    hi: ["नसों का दर्द", "नस का दर्द", "तंत्रिका दर्द", "न्यूरोपैथिक", "न्यूरोपैथी"],
    kn: ["ನರಗಳ ನೋವು", "ನರ ನೋವು", "ನ್ಯೂರೋಪತಿ", "ನ್ಯೂರೋಪಥಿಕ್"],
    mr: ["मज्जातंतूंची वेदना", "मज्जातंतू वेदना", "नसांची वेदना", "न्यूरोपॅथिक", "न्यूरोपॅथी"],
    ur: ["اعصابی درد", "نسوں کا درد", "نیوروپیتھک", "نیوروپیتھی"],
  },
  "medication-review": {
    en: ["medication review", "medicine review", "medicine check", "reviewing my medicines", "review my medicines"],
    hi: ["दवा समीक्षा", "दवाओं की समीक्षा", "औषधि समीक्षा", "दवा की समीक्षा"],
    kn: ["ಔಷಧ ಪರಿಶೀಲನೆ", "ಔಷಧಿ ಪರಿಶೀಲನೆ", "ಔಷಧಗಳ ಪರಿಶೀಲನೆ"],
    mr: ["औषध पुनरावलोकन", "औषधांचे पुनरावलोकन", "औषध तपासणी"],
    ur: ["ادویات کا جائزہ", "دوا کا جائزہ", "دواؤں کا جائزہ"],
  },
  drp: {
    en: ["drp", "drug related problem", "medicine related problem"],
    hi: ["दवा से जुड़ी समस्या", "दवा संबंधी समस्या", "डीआरपी"],
    kn: ["ಔಷಧ ಸಂಬಂಧಿತ ಸಮಸ್ಯೆ", "ಔಷಧ ಸಮಸ್ಯೆ"],
    mr: ["औषधाशी संबंधित समस्या", "औषध संबंधित समस्या"],
    ur: ["دوا سے متعلق مسئلہ", "دوا سے متعلق مسائل"],
  },
  appointment: {
    en: ["appointment", "doctor visit", "what to bring", "questions for my doctor", "prepare for"],
    hi: ["अपॉइंटमेंट", "डॉक्टर से मिलने", "क्या ले जा", "तैयारी"],
    kn: ["ಅಪಾಯಿಂಟ್ಮೆಂಟ್", "ವೈದ್ಯರ ಭೇಟಿ", "ತಯಾರಿ", "ಏನು ತೆಗೆದುಕೊಂಡು ಹೋಗ"],
    mr: ["अपॉइंटमेंट", "डॉक्टरांची भेट", "भेटीची तयारी", "काय न्याव"],
    ur: ["اپوائنٹمنٹ", "ڈاکٹر سے ملاقات", "تیاری", "کیا لے کر جا"],
  },
  "seek-help": {
    en: ["seek medical help", "see a doctor", "get help", "warning signs", "when to get help"],
    hi: ["चिकित्सा सहायता", "डॉक्टर को कब", "डॉक्टर के पास कब", "चेतावनी संकेत"],
    kn: ["ವೈದ್ಯಕೀಯ ಸಹಾಯ", "ವೈದ್ಯರನ್ನು ಯಾವಾಗ", "ಎಚ್ಚರಿಕೆಯ ಲಕ್ಷಣ"],
    mr: ["वैद्यकीय मदत", "डॉक्टरांकडे कधी", "धोक्याची लक्षणे"],
    ur: ["طبی مدد", "ڈاکٹر کو کب", "ڈاکٹر کے پاس کب", "انتباہی علامات"],
  },
  medicines: {
    en: ["medicines", "medication information", "drug information", "medicine search", "my medicines", "medicine catalogue"],
    hi: ["दवाएं", "दवाएँ", "दवाओं", "दवा की जानकारी"],
    kn: ["ಔಷಧಗಳು", "ಔಷಧಿಗಳು", "ಔಷಧಿಗಳ ಮಾಹಿತಿ", "ಔಷಧಗಳ ಮಾಹಿತಿ"],
    mr: ["औषधे", "औषधांची माहिती", "माझी औषधे"],
    ur: ["ادویات", "دواؤں", "دوا کی معلومات"],
  },
  study: {
    en: ["study", "research study", "clinical trial"],
    hi: ["अध्ययन", "शोध"],
    kn: ["ಅಧ್ಯಯನ", "ಸಂಶೋಧನೆ"],
    mr: ["अभ्यास", "संशोधन"],
    ur: ["مطالعہ", "تحقیق"],
  },
  "follow-up": {
    en: ["follow up", "followup", "day 15", "day 30"],
    hi: ["फॉलो-अप", "फॉलो अप"],
    kn: ["ಫಾಲೋ ಅಪ್", "ಅನುಸರಣಾ ಭೇಟಿ"],
    mr: ["पाठपुरावा", "फॉलो अप"],
    ur: ["فالو اپ"],
  },
  randomisation: {
    en: ["randomisation", "randomization", "randomised", "randomized"],
    hi: ["रैंडमाइजेशन", "यादृच्छिक"],
    kn: ["ಯಾದೃಚ್ಛಿಕ", "ರ್ಯಾಂಡಮೈಸೇಶನ್"],
    mr: ["यादृच्छिक", "रँडमायझेशन"],
    ur: ["رینڈمائزیشن", "قرعہ اندازی"],
  },
  assessments: {
    en: ["questionnaire", "pain scale"],
    hi: ["प्रश्नावली"],
    kn: ["ಪ್ರಶ್ನಾವಳಿ"],
    mr: ["प्रश्नावली"],
    ur: ["سوالنامہ"],
  },
};

/**
 * Emergency phrase rules. A rule fires when every group has at least one term
 * present in the question. Based on the warning signs on the "When to seek
 * medical help" page; it cannot recognise every emergency.
 */
export const emergencyRules: Record<PatientLang, string[][][]> = {
  en: [
    [["face", "facial"], ["droop", "drooping", "drooped", "fallen", "one side", "uneven"]],
    [["slurred", "difficulty speaking", "trouble speaking", "can t speak", "cannot speak", "unable to speak", "can t talk", "cannot talk"]],
    [["weak", "weakness", "numb", "numbness"], ["one side", "sudden", "suddenly", "spreading", "rapidly", "getting worse", "worsening", "both legs"]],
    [["breath", "breathe", "breathing"], ["severe", "difficulty", "can t", "cannot", "unable", "struggling", "hard to"]],
    [["tongue", "throat", "lips", "mouth"], ["swell", "swelling", "swollen"]],
    [["back pain", "back ache", "backache"], ["bladder", "bowel", "urine", "saddle", "pee"]],
    [["swallow", "swallowing"], ["difficulty", "can t", "cannot", "unable", "choking"]],
    [["anaphylaxis", "stroke", "unconscious", "collapsed", "collapse"]],
  ],
  hi: [
    [["चेहरा", "चेहरे"], ["टेढ़ा", "लटक", "झुक"]],
    [["बोलने में", "बोल नहीं", "लड़खड़ा"]],
    [["कमजोरी", "कमज़ोरी", "सुन्न"], ["एक तरफ", "अचानक", "तेजी से", "तेज़ी से", "बढ़ रही", "दोनों पैर"]],
    [["सांस", "साँस", "श्वास"], ["नहीं", "दिक्कत", "तकलीफ", "कठिनाई", "मुश्किल"]],
    [["जीभ", "गला", "गले", "होंठ"], ["सूज"]],
    [["पीठ दर्द", "कमर दर्द", "पीठ में दर्द", "कमर में दर्द"], ["पेशाब", "मल", "शौच"]],
    [["निगल"], ["नहीं", "दिक्कत", "मुश्किल", "कठिनाई"]],
    [["स्ट्रोक", "लकवा", "बेहोश", "एनाफिलेक्सिस"]],
  ],
  kn: [
    [["ಮುಖ"], ["ಜೋತು", "ವಾಲು", "ಸೊಟ್ಟ"]],
    [["ಮಾತನಾಡಲು", "ಮಾತನಾಡ", "ಮಾತು"], ["ಕಷ್ಟ", "ತೊಂದರೆ", "ಆಗುತ್ತಿಲ್ಲ", "ತೊದಲು"]],
    [["ದೌರ್ಬಲ್ಯ", "ಬಲಹೀನ", "ಮರಗಟ್ಟ"], ["ಒಂದು ಬದಿ", "ಹಠಾತ್", "ಹರಡ", "ಹೆಚ್ಚಾಗುತ್ತಿದೆ", "ಎರಡೂ ಕಾಲು"]],
    [["ಉಸಿರಾಟ", "ಉಸಿರು"], ["ಕಷ್ಟ", "ತೊಂದರೆ", "ಆಗುತ್ತಿಲ್ಲ"]],
    [["ನಾಲಿಗೆ", "ಗಂಟಲು", "ತುಟಿ"], ["ಊತ", "ಊದಿ"]],
    [["ಬೆನ್ನು ನೋವು", "ಸೊಂಟ ನೋವು"], ["ಮೂತ್ರ", "ಮಲ"]],
    [["ನುಂಗ"], ["ಕಷ್ಟ", "ತೊಂದರೆ", "ಆಗುತ್ತಿಲ್ಲ"]],
    [["ಪಾರ್ಶ್ವವಾಯು", "ಸ್ಟ್ರೋಕ್", "ಪ್ರಜ್ಞೆ ತಪ್ಪ", "ಅನಾಫಿಲ್ಯಾಕ್ಸಿಸ್"]],
  ],
  mr: [
    [["चेहरा", "चेहऱ्या"], ["वाकडा", "लोंब", "झुक"]],
    [["बोलण्यात", "बोलता येत नाही", "बोलायला"], ["त्रास", "अडचण", "नाही"]],
    [["अशक्तपणा", "बधिर", "कमजोरी"], ["एका बाजूला", "अचानक", "वाढत", "झपाट्याने", "दोन्ही पाय"]],
    [["श्वास", "दम"], ["त्रास", "घेता येत नाही", "लागतो", "अडचण"]],
    [["जीभ", "जिभे", "घसा", "घशा", "ओठ"], ["सूज", "सुज"]],
    [["पाठदुखी", "कंबरदुखी", "पाठीत दुख", "कंबरेत दुख"], ["लघवी", "शौच", "मलविसर्जन"]],
    [["गिळ"], ["त्रास", "अडचण", "येत नाही"]],
    [["स्ट्रोक", "पक्षाघात", "लकवा", "बेशुद्ध", "अॅनाफिलॅक्सिस"]],
  ],
  ur: [
    [["چہرہ", "چہرے"], ["لٹک", "ٹیڑھا", "جھک"]],
    [["بولنے میں", "بول نہیں", "لڑکھڑا"]],
    [["کمزوری", "سن"], ["ایک طرف", "اچانک", "تیزی سے", "بڑھ رہی", "دونوں ٹانگ"]],
    [["سانس"], ["نہیں", "مشکل", "دشواری", "تکلیف"]],
    [["زبان", "گلا", "گلے", "ہونٹ"], ["سوج"]],
    [["کمر درد", "کمر میں درد", "پیٹھ میں درد"], ["پیشاب", "پاخانہ"]],
    [["نگل"], ["نہیں", "مشکل", "دشواری"]],
    [["فالج", "اسٹروک", "بے ہوش", "بیہوش", "اینافلیکسس"]],
  ],
};

/** Requests for a personal treatment decision — always declined. */
export const treatmentRules: Record<PatientLang, string[][][]> = {
  en: [
    [["dose", "dosage", "how much", "how many tablets", "how many pills", "mg"]],
    [["stop", "start", "change", "switch", "increase", "reduce", "skip", "combine", "mix"], ["medicine", "medicines", "medication", "tablet", "tablets", "pill", "pills", "dose", "treatment", "these"]],
    [["should i take", "should i stop", "should i start", "should i use", "can i take", "can i stop", "is it safe for me"]],
    [["best for me", "which medicine is best", "which medicine should", "prescribe", "diagnose", "do i have"]],
  ],
  hi: [
    [["खुराक", "डोज़", "डोज", "कितनी गोली", "कितनी दवा"]],
    [["बंद कर", "छोड़ द", "लेना चाहिए", "ले सकता", "ले सकती", "सबसे अच्छी दवा", "एक साथ ले", "मिलाकर ले"]],
  ],
  kn: [
    [["ಡೋಸ್", "ಪ್ರಮಾಣ", "ಎಷ್ಟು ಮಾತ್ರೆ"]],
    [["ನಿಲ್ಲಿಸಬಹುದೇ", "ನಿಲ್ಲಿಸಲೇ", "ತೆಗೆದುಕೊಳ್ಳಬೇಕೇ", "ತೆಗೆದುಕೊಳ್ಳಬಹುದೇ", "ಉತ್ತಮ ಔಷಧ", "ಒಟ್ಟಿಗೆ ತೆಗೆದುಕೊ"]],
  ],
  mr: [
    [["डोस", "मात्रा", "किती गोळ्या"]],
    [["बंद करू", "बंद करावे", "घ्यावी का", "घ्यावे का", "घेऊ का", "सर्वात चांगले औषध", "एकत्र घे", "सोबत घे"]],
  ],
  ur: [
    [["خوراک", "ڈوز", "کتنی گولی"]],
    [["بند کر", "لینی چاہیے", "لینا چاہیے", "لے سکتا", "لے سکتی", "بہترین دوا", "ایک ساتھ لے", "ملا کر لے"]],
  ],
};

/** Very common question words ignored by ranked search. */
export const stopwords = new Set([
  "what", "is", "a", "an", "the", "are", "do", "does", "how", "i", "my", "me", "can", "about", "tell", "of", "to", "in", "for",
  "and", "or", "it", "this", "that", "with", "on", "where", "when", "why", "which", "who", "should", "mean", "means", "find",
  "information", "learn", "you", "please", "there", "be", "get", "any", "some",
  "क्या", "है", "हैं", "का", "की", "के", "में", "मुझे", "कैसे", "कब", "कहाँ", "बारे", "और",
  "काय", "आहे", "आहेत", "मला", "कसे", "कधी", "कुठे", "बद्दल", "आणि", "चा", "ची", "चे",
  "ಏನು", "ಇದೆ", "ಹೇಗೆ", "ಯಾವಾಗ", "ಎಲ್ಲಿ", "ಬಗ್ಗೆ", "ಮತ್ತು", "ನನಗೆ",
  "کیا", "ہے", "ہیں", "کی", "کا", "کے", "میں", "مجھے", "کیسے", "کب", "کہاں", "بارے", "اور",
]);
