-- Launch community stories — 6 featured stories across personas and pillars
-- All anonymised, editorially approved, publish_date set to today

INSERT INTO community_stories
  (story_text, locale, occupation, state, district,
   story_type, relevant_concept_id,
   moderation_status, display_name, publish_date)
VALUES

('I got a WhatsApp message saying I won ₹50,000 in a lottery. The grammar was perfect, the logo looked real. Then I remembered the three signs from Adhyan: urgency, money request, unknown number. All three were there. I blocked the number instead of clicking. My neighbour got the same message. He clicked. Lost ₹3,000.',
 'en', 'farmer', 'Maharashtra', 'Nashik',
 'warning', 'c10', 'featured', 'Raju, Nashik', CURRENT_DATE),

('मेरे पास एक कॉल आई जो मेरे बेटे की आवाज़ जैसी थी। कह रहा था पुलिस ने पकड़ा है, ₹15,000 चाहिए। मैं घबरा गई। फिर Adhyan का सबक याद आया — अनजान नंबर, जल्दी, पैसे। मैंने फ़ोन काटा और सीधे बेटे को कॉल किया। वो घर पर था। खुश था।',
 'hi', 'homemaker', 'Uttar Pradesh', 'Lucknow',
 'warning', 'c05', 'featured', 'सुमन, लखनऊ', CURRENT_DATE),

('A job offer came on LinkedIn — ₹45,000/month, data entry, work from home, no experience needed. It asked for ₹1,000 training fee. I used Adhyan''s five red flags checklist. Found all five. Reported the account instead of applying. Three friends had already paid the fee.',
 'en', 'student', 'Karnataka', 'Bengaluru',
 'warning', 'c06', 'featured', 'Priya, Bengaluru', CURRENT_DATE),

('I used AI to write a complaint letter to my bank about a blocked debit card. In 10 minutes I had a formal letter in proper English. The bank resolved it in two days. Before Adhyan I would have gone to the branch five times.',
 'en', 'shop_owner', 'Gujarat', 'Ahmedabad',
 'success', 'c08', 'featured', 'Kamlesh, Ahmedabad', CURRENT_DATE),

('एक सरकारी योजना का SMS आया — कह रहा था PM Kisan के तहत ₹8,000 extra मिलेंगे। Link पर click करने पर Aadhaar और bank details माँगी। Adhyan में पढ़ा था कि PM Kisan के पैसे सीधे खाते में जाते हैं — link पर नहीं। मैंने delete कर दिया।',
 'hi', 'farmer', 'Rajasthan', 'Jaipur',
 'warning', 'c10', 'featured', 'मोहन, जयपुर', CURRENT_DATE),

('I asked AI to explain a loan document in simple language. It told me the interest rate was actually 28% per year, not the "low EMI" the agent was advertising. I did not sign. AI probably saved me ₹40,000 over the loan term.',
 'en', 'gig_worker', 'Tamil Nadu', 'Chennai',
 'success', 'c09', 'featured', 'Arjun, Chennai', CURRENT_DATE);
