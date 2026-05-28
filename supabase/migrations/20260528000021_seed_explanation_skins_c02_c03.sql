-- Explanation skins for:
--   c02 "AI Makes Mistakes" — generic/EN, generic/HI, farmer/HI
--   c03 "Pattern Matching"  — generic/EN, generic/HI

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
-- c02 — AI Makes Mistakes
-- ─────────────────────────────────────────────

('c02_generic_en', 'c02', 'published', 'en', 'generic',
 'medium', FALSE, TRUE,
 'AI sounds confident — always. It uses the same calm, polite tone whether it is giving you the right answer or a completely wrong one. There is no trembling voice, no hesitation, no "I am not sure." Just smooth, confident text.',
 'AI generates the most statistically likely answer based on what it has read. It cannot check whether that answer is actually true. It has no internal alarm that goes off when it is wrong. This is why experts call it a "confident guesser" — and why every important answer needs a second source.',
 'Try this now: ask an AI assistant "Who is the current Chief Minister of [your state]?" Then verify the answer on the state government website. Notice whether the AI was right, wrong, or gave an outdated answer.',
 'Why does AI give wrong answers confidently, without warning you?',
 ARRAY['It cannot tell what it knows from what it guesses', 'It has no way to check if it is correct', 'It optimises for fluency not accuracy', 'Pattern matching does not include a truth check', 'It has no alarm for errors'],
 'Think of one decision you recently made where you used or could have used AI. What would you check before trusting that answer?',
 'AI sounds certain even when it is wrong — it cannot tell the difference.',
 'a_evaluate_gig_en',
 'text', FALSE, 18, 'md',
 'You now know why AI can be wrong even when it sounds confident. This makes you a safer user than most.',
 'quiet_glow',
 'AI is a confident guesser',
 'AI never says "I''m not sure." Here''s why you must always verify. Learn with Adhyan.',
 'Open Adhyan'),

('c02_generic_hi', 'c02', 'published', 'hi', 'generic',
 'medium', FALSE, TRUE,
 'AI हमेशा आत्मविश्वास से जवाब देता है — चाहे जवाब सही हो या गलत। उसकी आवाज़ में कोई हिचकिचाहट नहीं, कोई "मुझे यकीन नहीं" नहीं। बस एक शांत, विनम्र जवाब।',
 'AI उन सभी चीज़ों से "सबसे संभावित जवाब" बनाता है जो उसने पढ़ी हैं। वह यह नहीं जाँच सकता कि उसका जवाब सच है या नहीं। उसके अंदर कोई अलार्म नहीं बजता जब वह गलत होता है। इसीलिए किसी भी ज़रूरी जानकारी के लिए दूसरे स्रोत से भी जाँच करें।',
 'यह करके देखें: किसी AI से पूछें "मेरे राज्य के मुख्यमंत्री कौन हैं?" फिर सरकारी वेबसाइट पर जाँचें। AI सही था या गलत?',
 'AI गलत जवाब देते समय आपको चेतावनी क्यों नहीं देता?',
 ARRAY['वह नहीं जानता कि वह गलत है', 'उसके पास सच जाँचने का तरीका नहीं है', 'वह सुंदर शब्द बनाता है — सत्य नहीं', 'उसमें गलती का अलार्म नहीं है'],
 'एक ऐसा काम सोचें जिसमें आपने AI की मदद ली या ले सकते थे। उस जवाब को किस तरह जाँचेंगे?',
 'AI गलत होने पर भी आत्मविश्वास से बोलता है।',
 'a_evaluate_gig_en',
 'text', FALSE, 15, 'md',
 'आपने समझ लिया कि AI आत्मविश्वास से गलत क्यों हो सकता है। यह जानना आपको एक सुरक्षित उपयोगकर्ता बनाता है।',
 'quiet_glow',
 'AI आत्मविश्वास से गलत बोलता है',
 'AI कभी नहीं कहता "मुझे यकीन नहीं।" इसलिए जाँच ज़रूरी है। Adhyan पर सीखें।',
 'Adhyan खोलें'),

('c02_farmer_hi', 'c02', 'published', 'hi', 'farmer',
 'medium', FALSE, TRUE,
 'मान लीजिए कोई दलाल बिना झिझक के कहे "इस महीने सोयाबीन का भाव ₹5,000 रहेगा" — पर उसने कभी मंडी नहीं देखी, बस किताबें पढ़ी हैं। AI ऐसा ही है।',
 'AI इतने आत्मविश्वास से जवाब देता है कि लगता है वह सच बोल रहा है। लेकिन वह सिर्फ पैटर्न मिला रहा है — सत्य नहीं जानता। खेती के फ़ैसलों में — MSP, कीटनाशक, बीज — हमेशा स्थानीय कृषि विभाग या अनुभवी किसान से भी पूछें।',
 'यह करें: AI से पूछें "इस सीज़न में किस फसल का MSP सबसे अधिक है?" फिर pmkisan.gov.in या अपने कृषि कार्यालय से जाँचें।',
 'खेती के बारे में AI का जवाब क्यों सही नहीं भी हो सकता?',
 ARRAY['AI के पास आपके ज़िले की जानकारी नहीं है', 'वह इस साल का मौसम नहीं जानता', 'उसने कभी खेत नहीं देखा', 'पुराना डेटा हो सकता है', 'गलत होने पर चेतावनी नहीं देता'],
 'खेती में AI से एक सवाल पूछिए — और फिर उसे कहाँ से जाँचेंगे वह भी बताइए।',
 'AI मंडी भाव जानता है — पर आपकी ज़मीन की हकीकत नहीं।',
 'a_evaluate_shopowner_hi',
 'audio', FALSE, 15, 'lg',
 'शाबाश। आप जानते हैं कि AI कब सही है और कब उसे जाँचना ज़रूरी है।',
 'quiet_glow',
 'AI खेती में भी गलत हो सकता है',
 'AI का जवाब हमेशा सही नहीं होता — खासकर खेती में। Adhyan में जानें।',
 'Adhyan खोलें'),

-- ─────────────────────────────────────────────
-- c03 — Pattern Matching
-- ─────────────────────────────────────────────

('c03_generic_en', 'c03', 'published', 'en', 'generic',
 'medium', FALSE, TRUE,
 'When you ask AI a question, it does not think. It scans everything it has ever read and finds the most likely next word, then the next, then the next. The result sounds like a thoughtful answer — but it was built one word at a time, like beads on a string.',
 'This process is called pattern matching. AI finds patterns in billions of sentences and uses them to predict what words should follow your question. It has no understanding of meaning, no awareness of consequences, no model of the world. It only knows: "given what came before, what usually comes next?"',
 'Ask AI: "What does 2+2 equal?" Then ask: "What does 2+2 equal on Jupiter?" Compare the answers. What does this tell you about whether AI actually understands your question — or just matches patterns?',
 'AI gives you a fluent, confident answer. What is it actually doing underneath?',
 ARRAY['Matching patterns in text it has read', 'Predicting the most likely next word', 'Finding the most probable continuation', 'Statistical prediction not reasoning', 'No understanding — just pattern completion'],
 'In one sentence: what is the difference between "understanding a question" and "predicting an answer"? Why does it matter?',
 'AI predicts the most likely next word — it does not think.',
 'a_understand_student_en',
 'text', FALSE, 20, 'md',
 'You now understand how AI actually works. Most people who use AI every day do not know this.',
 'warm_pulse',
 'AI does not think — it predicts',
 'AI builds every answer one word at a time. Understanding this changes how you use it. Adhyan explains.',
 'Open Adhyan'),

('c03_generic_hi', 'c03', 'published', 'hi', 'generic',
 'medium', FALSE, TRUE,
 'जब आप AI से कोई सवाल पूछते हैं, तो वह "सोचता" नहीं है। वह अपने पढ़े हुए सभी शब्दों में से "अगला सबसे संभावित शब्द" खोजता है — एक-एक करके। नतीजा पढ़ने में समझदारी भरा लगता है, पर बना एक-एक शब्द जोड़कर है।',
 'इसे "पैटर्न मैचिंग" कहते हैं। AI अरबों वाक्यों के पैटर्न पहचानता है और अनुमान लगाता है कि आपके सवाल के बाद कौन से शब्द आने चाहिए। उसे शब्दों का अर्थ नहीं पता, परिणामों की समझ नहीं — बस यह पता है: "इन शब्दों के बाद आमतौर पर क्या आता है?"',
 'यह करें: AI से पूछें "2+2 क्या होता है?" फिर पूछें "बृहस्पति पर 2+2 क्या होता है?" जवाब देखें। क्या AI सच में आपका सवाल समझता है?',
 'AI एक सुंदर जवाब देता है — पर असल में वह क्या कर रहा है?',
 ARRAY['पढ़े हुए शब्दों में पैटर्न मिला रहा है', 'अगला सबसे संभावित शब्द अनुमान लगा रहा है', 'सांख्यिकीय अनुमान है, सोच नहीं', 'अर्थ नहीं समझता — पैटर्न पूरा करता है'],
 'अपने शब्दों में बताएँ: "सवाल समझना" और "जवाब अनुमान लगाना" में क्या फ़र्क़ है?',
 'AI अगला शब्द अनुमान लगाता है — सोचता नहीं।',
 'a_understand_elder_en',
 'text', FALSE, 15, 'md',
 'आप जान गए कि AI असल में कैसे काम करता है। यह जानकारी बहुत कम लोगों को है।',
 'warm_pulse',
 'AI सोचता नहीं — अनुमान लगाता है',
 'AI एक-एक शब्द जोड़कर जवाब बनाता है। यह समझना बदल देता है कि आप इसका उपयोग कैसे करते हैं।',
 'Adhyan खोलें');
