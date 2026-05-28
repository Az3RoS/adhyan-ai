-- Explanation skins for:
--   c04 "Checking AI Output"  — generic/EN, generic/HI
--   c05 "Voice and Image Fakes" — generic/EN, generic/HI, elderly/HI
--   c05 is safety_critical=TRUE → human_reviewed=TRUE required

INSERT INTO explanation_skins (
  skin_id, concept_id, status, locale, persona,
  literacy_level, is_safety_critical, human_reviewed,
  day1_hook, day2_reveal, day3_practice,
  day4_retrieval_q, day4_acceptable_ans,
  day5_check_prompt, one_liner,
  primary_analogy_id,
  primary_format, reading_required, max_words_per_screen, font_size_class,
  completion_message, completion_style,
  wa_headline, wa_body, wa_cta
) VALUES

-- ─────────────────────────────────────────────
-- c04 — Checking AI Output
-- ─────────────────────────────────────────────

('c04_generic_en', 'c04', 'published', 'en', 'generic',
 'medium', FALSE, TRUE,
 'One question changes everything: "How would I verify this?" Ask it every single time you get an answer from AI. Not because AI is always wrong — but because even a 10% chance of error matters when the decision is about your health, money, or rights.',
 'Verification does not have to be hard. For health: ask a doctor or call the national helpline. For money: check with your bank or the official scheme website. For legal matters: search the official government portal or visit a legal aid office. For news: check two independent sources. The habit is the skill.',
 'Pick one answer you got from AI recently (or ask one now). Write down: (1) What is the claim? (2) How would you verify it? (3) Which source would you use? Then actually check it.',
 'Before acting on important AI advice, what is the single most important step?',
 ARRAY['Verify with a trusted human source', 'Check the official website or government portal', 'Cross-check with someone who knows the subject', 'Confirm with a doctor, lawyer, or expert', 'Find a second independent source'],
 'Finish this: "I will always verify AI advice about _____ by _____." Make it specific to your own life.',
 '"How do I verify this?" — one question that makes AI safe to use.',
 'a_evaluate_clerk_en',
 'text', FALSE, 18, 'md',
 'You have built the most important habit for using AI safely. Verify before you act.',
 'quiet_glow',
 'Verify before you act',
 'One question makes AI safe to use: "How do I verify this?" Learn the habit with Adhyan.',
 'Open Adhyan'),

('c04_generic_hi', 'c04', 'published', 'hi', 'generic',
 'medium', FALSE, TRUE,
 'एक सवाल सब कुछ बदल देता है: "मैं इसे कैसे जाँचूँगा?" AI से जवाब मिलने के बाद हर बार यह सवाल पूछें। इसलिए नहीं कि AI हमेशा गलत है — बल्कि इसलिए कि स्वास्थ्य, पैसे या अधिकारों के फ़ैसलों में 10% गलती भी बहुत बड़ी होती है।',
 'जाँच करना मुश्किल नहीं है। स्वास्थ्य के लिए: डॉक्टर से पूछें या राष्ट्रीय हेल्पलाइन पर कॉल करें। पैसे के लिए: बैंक या सरकारी योजना की वेबसाइट देखें। कानूनी मामलों के लिए: सरकारी पोर्टल या कानूनी सहायता केंद्र जाएँ। खबरों के लिए: दो अलग स्रोत देखें।',
 'AI से एक ज़रूरी सवाल पूछें। फिर लिखें: (1) क्या दावा है? (2) कैसे जाँचेंगे? (3) कौन सा स्रोत उपयोग करेंगे? फिर सच में जाँचें।',
 'किसी ज़रूरी AI जवाब पर कार्रवाई करने से पहले सबसे ज़रूरी क्या करना है?',
 ARRAY['किसी भरोसेमंद इंसान से जाँचें', 'सरकारी वेबसाइट देखें', 'किसी जानकार से पुष्टि करें', 'डॉक्टर, वकील या विशेषज्ञ से पूछें', 'दूसरा स्रोत खोजें'],
 'यह वाक्य पूरा करें: "मैं AI की सलाह _____ के बारे में हमेशा _____ से जाँचूँगा/जाँचूँगी।" अपनी ज़िंदगी से जोड़कर लिखें।',
 '"मैं इसे कैसे जाँचूँगा?" — एक सवाल जो AI को सुरक्षित बनाता है।',
 'a_evaluate_clerk_en',
 'text', FALSE, 15, 'md',
 'आपने AI को सुरक्षित तरीके से इस्तेमाल करने की सबसे ज़रूरी आदत बना ली — कार्रवाई से पहले जाँच।',
 'quiet_glow',
 'कार्रवाई से पहले जाँच',
 '"मैं इसे कैसे जाँचूँगा?" — एक सवाल जो AI को सुरक्षित बनाता है। Adhyan पर सीखें।',
 'Adhyan खोलें'),

-- ─────────────────────────────────────────────
-- c05 — Voice and Image Fakes
-- safety_critical = TRUE → human_reviewed = TRUE always
-- ─────────────────────────────────────────────

('c05_generic_en', 'c05', 'published', 'en', 'generic',
 'medium', TRUE, TRUE,
 'A woman in Pune received a call. The voice sounded exactly like her son — the same warmth, the same words he uses, the same pauses. "Maa, I am in trouble. The police have me. Send ₹20,000 right now. Do not tell anyone." It was not her son. It was a voice cloned from his social media videos. She nearly sent the money.',
 'AI can now clone a voice from as little as 10 seconds of audio. It can generate photos of people who do not exist, or put real people in scenes that never happened. Scammers use these to create fake emergencies.\n\nThe three signs every time:\n1. Sudden urgency — act NOW, no time to think\n2. Unusual request — money, OTP, bank details\n3. Unfamiliar contact — unknown number, new account\n\nThe rule: when all three appear together, hang up. Call back on the known number.',
 'Practice this: if your family member called from an unknown number right now saying there is an emergency, what would you do before sending money? Write the exact steps.',
 'What are the three signs that a call or photo might be an AI fake?',
 ARRAY['Sudden urgency plus money request plus unfamiliar number', 'Unknown number with emergency and request for money or OTP', 'Fear plus urgency plus financial demand', 'Unexpected call from unknown contact asking for immediate action'],
 'In your own words: what is the ONE rule that stops this scam cold?',
 'If a voice or photo surprised you — pause before you act.',
 'a_protect_homemaker_hi',
 'audio', FALSE, 14, 'md',
 'You now know how to spot an AI voice scam. Share this with one family member today — it could save them.',
 'warm_pulse',
 'AI voice clones sound real',
 'AI can clone any voice in 10 seconds. Here are the 3 signs — and the one rule that stops the scam.',
 'Share with family'),

('c05_generic_hi', 'c05', 'published', 'hi', 'generic',
 'medium', TRUE, TRUE,
 'पुणे में एक माँ को फ़ोन आया। आवाज़ बिल्कुल उसके बेटे जैसी थी — वही गर्मजोशी, वही शब्द। "माँ, मैं मुसीबत में हूँ। पुलिस ने पकड़ा है। अभी ₹20,000 भेजो। किसी को मत बताना।" वह उसका बेटा नहीं था। AI ने उसके बेटे के सोशल मीडिया वीडियो से आवाज़ क्लोन की थी।',
 'AI अब सिर्फ 10 सेकंड की आवाज़ से किसी की भी आवाज़ कॉपी कर सकता है। वह ऐसी तस्वीरें बना सकता है जो कभी हुई ही नहीं।\n\nतीन संकेत हमेशा:\n1. अचानक जल्दी — अभी करो, सोचने का समय नहीं\n2. असामान्य माँग — पैसे, OTP, बैंक जानकारी\n3. अजीब नंबर — अनजान नंबर, नया खाता\n\nनियम: जब तीनों एक साथ हों — फ़ोन काटें। जाने-पहचाने नंबर पर वापस कॉल करें।',
 'यह सोचें: अगर अभी आपके परिवार का कोई सदस्य अनजान नंबर से फ़ोन करके कहे कि मुसीबत में हैं — पैसे भेजने से पहले आप क्या करेंगे? क़दम लिखें।',
 'तीन संकेत क्या हैं जो बताते हैं कि कॉल या फ़ोटो AI से बनी हो सकती है?',
 ARRAY['अचानक जल्दी और पैसे की माँग और अनजान नंबर', 'अनजान नंबर से इमरजेंसी और OTP या पैसे की माँग', 'डर और जल्दी और वित्तीय माँग एक साथ', 'अनपेक्षित कॉल और तुरंत कार्रवाई की माँग'],
 'अपने शब्दों में: वह एक नियम क्या है जो इस घोटाले को रोक देता है?',
 'अगर कोई आवाज़ या फ़ोटो आपको चौंका दे — कार्रवाई से पहले रुकें।',
 'a_protect_elder_hi',
 'audio', FALSE, 12, 'md',
 'आप AI आवाज़ घोटाले पहचानना सीख गए। आज एक परिवार के सदस्य को यह बताएँ — यह उनकी बचत बचा सकता है।',
 'warm_pulse',
 'AI आवाज़ असली लगती है',
 'AI 10 सेकंड में किसी की भी आवाज़ कॉपी कर सकता है। 3 संकेत और एक नियम। Adhyan पर जानें।',
 'परिवार के साथ शेयर करें'),

('c05_elderly_hi', 'c05', 'published', 'hi', 'elderly',
 'low', TRUE, TRUE,
 'एक बुज़ुर्ग माँ को फ़ोन आया — आवाज़ बेटे जैसी थी। कह रहा था: "माँ, मुझे पुलिस ने पकड़ा है, ₹20,000 अभी भेजो।" वह उसका बेटा नहीं था। किसी ने उसकी आवाज़ चुरा ली थी।',
 'आज कोई भी किसी की भी आवाज़ नकल कर सकता है — बस थोड़े से वीडियो से।\n\nजब भी कोई फ़ोन पर:\n— बहुत जल्दी मचाए\n— पैसे या OTP माँगे\n— अनजान नंबर से हो\n\nतो फ़ोन काट दें। अपने बेटे/बेटी/घरवाले के जाने-पहचाने नंबर पर खुद कॉल करें।',
 'सोचिए: अगर आपके बेटे या बेटी का फ़ोन आए और वो मुसीबत में बताएँ — पैसे भेजने से पहले आप क्या करेंगे?',
 'फ़ोन पर नकली आवाज़ से बचने के लिए तीन संकेत क्या हैं?',
 ARRAY['जल्दी मचाना और पैसे माँगना और अनजान नंबर', 'डर और पैसे की माँग और नया नंबर', 'अचानक मुसीबत और OTP माँगना', 'परिचित आवाज़ पर अनजान नंबर से माँग'],
 'वह एक काम जो इस घोटाले को रोक देगा — वो क्या है?',
 'फ़ोन पर डर और जल्दी दिखे तो रुकें — वापस कॉल करें।',
 'a_protect_elder_hi',
 'audio', FALSE, 10, 'xl',
 'शाबाश। आप यह घोटाला पहचान सकते हैं। अपने घर में सबको बताएँ।',
 'warm_pulse',
 'फ़ोन पर नकली आवाज़',
 'आवाज़ असली लगे — पर अनजान नंबर और जल्दी हो तो रुकें। Adhyan पर जानें।',
 'Adhyan खोलें');
