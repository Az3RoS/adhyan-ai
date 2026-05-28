-- Starter analogy library — 3 per pillar, one per main persona type
-- Each analogy is reusable across multiple concept skins

INSERT INTO analogies
  (id, pillar, persona, locale, analogy_text, source_domain)
VALUES

-- UNDERSTAND pillar
('a_understand_farmer_hi', 'understand', 'farmer', 'hi',
 'AI वैसा है जैसे बाज़ार में कोई दलाल जो हज़ारों खेतों के भाव जानता है, पर आपके खेत की मिट्टी कभी नहीं देखी।',
 'farming'),

('a_understand_elder_en', 'understand', 'elderly', 'en',
 'Think of AI like a very well-read librarian who has read every book in the world — but has never stepped outside the library.',
 'library'),

('a_understand_student_en', 'understand', 'student', 'en',
 'AI is like a classmate who has read every textbook but never attended a single class discussion.',
 'education'),

-- EVALUATE pillar
('a_evaluate_shopowner_hi', 'evaluate', 'shop_owner', 'hi',
 'AI का जवाब वैसा है जैसे कोई अनजान ग्राहक आपको सलाह दे — सुनो ज़रूर, पर बिना जाँचे मत मानो।',
 'trade'),

('a_evaluate_gig_en', 'evaluate', 'gig_worker', 'en',
 'Checking AI output is like checking your delivery app — the route looks right on screen, but you still watch the road.',
 'delivery'),

('a_evaluate_clerk_en', 'evaluate', 'clerk', 'en',
 'AI answers are like a draft prepared by a new junior — useful starting point, needs your review before it goes out.',
 'office'),

-- PROTECT pillar
('a_protect_homemaker_hi', 'protect', 'homemaker', 'hi',
 'AI से बनी आवाज़ पहचानना वैसा है जैसे नकली मसाले की पहचान — रंग एकदम सही, पर महक में फ़र्क़ पता चलता है।',
 'cooking'),

('a_protect_elder_hi', 'protect', 'elderly', 'hi',
 'AI से बना फ़ोटो वैसे ही झूठा है जैसे बाज़ार की नकली दवाई — डिब्बा असली जैसा, अंदर का सच अलग।',
 'medicine'),

('a_protect_farmer_en', 'protect', 'farmer', 'en',
 'A scam message is like a fake seed packet — the picture looks perfect, the price too good. Check before you plant.',
 'farming'),

-- USE pillar
('a_use_student_hi', 'use', 'student', 'hi',
 'AI से सही सवाल पूछना वैसा है जैसे बस स्टैंड पर सही दिशा पूछना — जितना साफ़ बताओगे उतना सटीक जवाब मिलेगा।',
 'travel'),

('a_use_professional_en', 'use', 'professional', 'en',
 'Prompting AI well is like briefing a new intern — the more context you give upfront, the less rework later.',
 'office'),

('a_use_domestic_hi', 'use', 'domestic_worker', 'hi',
 'AI को काम देना वैसा है जैसे किसी नए सहायक को समझाना — पूरी जानकारी दोगे तो काम सही होगा।',
 'household');
