-- Launch scam alerts — 5 active, high-confidence, Cyber Dost verified
-- expires_at NULL = evergreen; set a date to auto-expire

INSERT INTO scam_alerts
  (id, expires_at,
   alert_title_en, alert_title_hi,
   scam_message_sample,
   warning_signs,
   safe_action,
   affected_states, affected_occupations,
   severity, source, source_url, verified)
VALUES

(gen_random_uuid(), NULL,
 'Fake KYC Call — Bank Account Freeze Threat',
 'नकली KYC कॉल — बैंक खाता बंद होने की धमकी',
 '"Your bank account will be blocked in 24 hours due to incomplete KYC. Call this number immediately to update: 98XXXXXXXX"',
 ARRAY['Urgent deadline (24 hours)', 'Calls itself from your bank', 'Asks for OTP or Aadhaar number', 'Unknown number'],
 'Hang up. Call your bank directly using the number on the back of your debit card. Banks never ask for OTP over phone.',
 ARRAY['all'], ARRAY['all'],
 'critical', 'cyber_dost', 'https://cyberdost.mha.gov.in', TRUE),

(gen_random_uuid(), NULL,
 'WhatsApp Job Offer Scam — Work From Home',
 'WhatsApp नौकरी घोटाला — घर से काम',
 '"Earn ₹5000/day liking YouTube videos. No experience needed. Registration fee ₹500. Join now: [link]"',
 ARRAY['Too-high salary for simple task', 'Registration or joining fee required', 'WhatsApp-only contact', 'No company name or office address'],
 'Any job that charges you money upfront is a scam. Block and report the number. Real employers never charge candidates.',
 ARRAY['all'], ARRAY['student','homemaker','domestic_worker','gig_worker','farmer'],
 'high', 'cyber_dost', 'https://cyberdost.mha.gov.in', TRUE),

(gen_random_uuid(), NULL,
 'AI Voice Clone — Distressed Family Member',
 'AI आवाज़ क्लोन — परिवार में मुसीबत का नाटक',
 '"Maa, main accident mein hoon. Police ne pakad liya. 20,000 bhejo abhi iss number pe. Kisi ko mat batana."',
 ARRAY['Unexpected call from unfamiliar number', 'Voice sounds like relative but "different"', 'Urgent money transfer demand', 'Request to keep it secret'],
 'Hang up immediately. Call your family member directly on their known number. AI can clone a voice — always verify through a second call.',
 ARRAY['all'], ARRAY['elderly','homemaker','farmer'],
 'critical', 'cyber_dost', 'https://cyberdost.mha.gov.in', TRUE),

(gen_random_uuid(), NULL,
 'Fake Government Scheme SMS — PM Kisan / Aadhaar',
 'नकली सरकारी योजना SMS — PM Kisan / Aadhaar',
 '"Congratulations! You are selected for PM Kisan extra benefit of ₹8000. Click here to claim before 31 May: [link]"',
 ARRAY['Unofficial link (not gov.in)', 'Asks for Aadhaar, bank account, or OTP', 'Deadline pressure', 'Amount different from official scheme'],
 'Do not click. All PM Kisan payments go automatically to registered accounts. Check pmkisan.gov.in directly or visit your nearest Common Service Centre.',
 ARRAY['all'], ARRAY['farmer','homemaker','elderly'],
 'high', 'cyber_dost', 'https://cyberdost.mha.gov.in', TRUE),

(gen_random_uuid(), NULL,
 'Fake Parcel Customs Fee — Courier Scam',
 'नकली पार्सल कस्टम शुल्क — कूरियर घोटाला',
 '"Your international parcel is held at customs. Pay ₹1,499 clearance fee to release. Pay here: [link]"',
 ARRAY['You did not order anything international', 'Payment link not from official courier site', 'Immediate payment demanded', 'Contact only via WhatsApp or SMS'],
 'Ignore the message. Legitimate customs fees are collected at delivery, not via WhatsApp links. Call the courier company directly using their official website number.',
 ARRAY['all'], ARRAY['all'],
 'medium', 'cyber_dost', 'https://cyberdost.mha.gov.in', TRUE);
