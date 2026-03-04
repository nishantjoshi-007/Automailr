export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "cold-outreach",
    name: "Cold Outreach",
    subject: "Quick question, {{first_name}}",
    body: `<p>Hi {{first_name}},</p>
<p>I came across {{company}} and was really impressed by what your team is building. I'd love to explore how we might be able to help you achieve even more.</p>
<p>Would you be open to a quick 15-minute chat this week?</p>
<p>Looking forward to hearing from you.</p>
<p>Best regards</p>`,
  },
  {
    id: "follow-up",
    name: "Follow-Up",
    subject: "Following up — {{first_name}}",
    body: `<p>Hi {{first_name}},</p>
<p>I wanted to follow up on my previous email. I understand things get busy at {{company}}, so I thought I'd reach out one more time.</p>
<p>I'd love to schedule a brief call at your convenience. Would any time this week work for you?</p>
<p>Thanks for your time!</p>`,
  },
  {
    id: "event-invite",
    name: "Event Invite",
    subject: "You're invited, {{first_name}}! 🎉",
    body: `<p>Hi {{first_name}},</p>
<p>We're hosting an exclusive event and would love for someone from {{company}} to join us.</p>
<p>Here are the details:</p>
<ul>
<li><strong>Date:</strong> [Event Date]</li>
<li><strong>Time:</strong> [Event Time]</li>
<li><strong>Location:</strong> [Event Location / Virtual Link]</li>
</ul>
<p>Would you be interested in attending? Let me know and I'll send over the full invitation.</p>
<p>Hope to see you there!</p>`,
  },
  {
    id: "job-application",
    name: "Job Application",
    subject: "Application for [Position] at {{company}}",
    body: `<p>Dear {{first_name}} {{last_name}},</p>
<p>I'm writing to express my interest in the [Position] role at {{company}}. I believe my background in [Your Field] aligns well with what your team is looking for.</p>
<p>I've attached my resume for your review. I'd welcome the opportunity to discuss how my experience could contribute to {{company}}'s goals.</p>
<p>Thank you for your consideration. I look forward to hearing from you.</p>
<p>Best regards</p>`,
  },
];
